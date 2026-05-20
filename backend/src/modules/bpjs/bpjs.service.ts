
import prisma from '../../config/database';

export class BpjsService {

    static async createClaim(data: any, userId: string) {
        const { patient_id, prescription_id, order_id, notes } = data;

        // Verify patient has BPJS number
        const patient = await prisma.patient.findUnique({ where: { id: patient_id } });
        if (!patient) throw new Error('Patient not found');

        // Create the claim
        const claim = await prisma.bpjsClaim.create({
            data: {
                patient_id,
                prescription_id,
                order_id: (order_id === "none" || !order_id) ? null : order_id,
                status: 'draft',
            },
            include: {
                patient: { select: { id: true, name: true, phone: true } },
                prescription: { include: { details: true } },
                order: { include: { invoices: true } },
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                user_id: userId,
                action: 'CREATE_BPJS_CLAIM',
                table_name: 'bpjs_claims',
                record_id: claim.id,
                new_data: { patient_id, prescription_id, status: 'draft' },
            },
        });

        return claim;
    }

    static async submitClaim(claimId: string, userId: string) {
        const claim = await prisma.bpjsClaim.findUnique({ where: { id: claimId } });
        if (!claim) throw new Error('Claim not found');
        if (claim.status !== 'draft') throw new Error('Only draft claims can be submitted');

        const updated = await prisma.bpjsClaim.update({
            where: { id: claimId },
            data: {
                status: 'submitted',
                claim_date: new Date(),
            },
            include: {
                patient: { select: { id: true, name: true } },
                prescription: { include: { details: true } },
            },
        });

        await prisma.auditLog.create({
            data: {
                user_id: userId,
                action: 'SUBMIT_BPJS_CLAIM',
                table_name: 'bpjs_claims',
                record_id: claimId,
                old_data: { status: 'draft' },
                new_data: { status: 'submitted' },
            },
        });

        return updated;
    }

    static async updateClaimStatus(
        claimId: string,
        status: 'approved' | 'rejected' | 'paid',
        rejectionReason: string | undefined,
        userId: string
    ) {
        return await prisma.$transaction(async (tx) => {
            const claim = await tx.bpjsClaim.findUnique({ 
                where: { id: claimId },
                include: { order: { include: { invoices: true } } }
            });
            if (!claim) throw new Error('Klaim BPJS tidak ditemukan');

            // Jika status baru sama dengan status lama, abaikan
            if (status === claim.status) {
                return claim;
            }

            const updated = await tx.bpjsClaim.update({
                where: { id: claimId },
                data: {
                    status,
                    rejection_reason: rejectionReason || null,
                },
            });

            // LOGIKA REKONSILIASI KEUANGAN BILA KLAIM DIBAYAR (PAID) OLEH BPJS
            if (status === 'paid' && claim.status !== 'paid' && claim.order_id) {
                const invoice = claim.order?.invoices[0];
                if (invoice && invoice.remaining > 0) {
                    // Batasi subsidi otomatis BPJS maksimal sebesar Rp 330.000 (Kelas 1)
                    // Jika tagihan tersisa melebihi batas ini, pasien tetap berhutang selisihnya.
                    const MAX_BPJS_SUBSIDY = 330000;
                    const subsidyAmount = Math.min(invoice.remaining, MAX_BPJS_SUBSIDY);

                    // 1. Buat pembayaran otomatis dengan metode 'bpjs'
                    await tx.payment.create({
                        data: {
                            order_id: claim.order_id,
                            method: 'bpjs',
                            amount: subsidyAmount,
                        }
                    });

                    // 2. Potong sisa tagihan invoice dengan nominal subsidi BPJS
                    await tx.invoice.update({
                        where: { id: invoice.id },
                        data: { remaining: invoice.remaining - subsidyAmount }
                    });

                    // 3. Log mutasi pembayaran BPJS ke audit logs
                    await tx.auditLog.create({
                        data: {
                            user_id: userId,
                            action: 'BPJS_CLAIM_RECONCILIATION',
                            table_name: 'payments',
                            record_id: claim.order_id,
                            new_data: { 
                                order_id: claim.order_id, 
                                invoice_id: invoice.id,
                                reconciled_amount: subsidyAmount,
                                payment_method: 'bpjs'
                            },
                        },
                    });
                }
            }

            await tx.auditLog.create({
                data: {
                    user_id: userId,
                    action: `BPJS_CLAIM_${status.toUpperCase()}`,
                    table_name: 'bpjs_claims',
                    record_id: claimId,
                    old_data: { status: claim.status },
                    new_data: { status, rejection_reason: rejectionReason },
                },
            });

            return updated;
        });
    }

    static async findAll(branchId: string) {
        return prisma.bpjsClaim.findMany({
            where: { patient: { branch_id: branchId } },
            include: {
                patient: { select: { id: true, name: true, phone: true, bpjs_number: true } },
                prescription: {
                    include: {
                        details: true,
                        examination: true,
                    },
                },
                order: {
                    include: { invoices: true },
                },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    static async findById(id: string) {
        const claim = await prisma.bpjsClaim.findUnique({
            where: { id },
            include: {
                patient: true,
                prescription: { include: { details: true, examination: true } },
                order: { include: { items: true, invoices: true, payments: true } },
            },
        });
        if (!claim) throw new Error('BPJS Claim not found');
        return claim;
    }

    static async getStats(branchId: string) {
        const [total, draft, submitted, approved, rejected, paid] = await Promise.all([
            prisma.bpjsClaim.count({ where: { patient: { branch_id: branchId } } }),
            prisma.bpjsClaim.count({ where: { patient: { branch_id: branchId }, status: 'draft' } }),
            prisma.bpjsClaim.count({ where: { patient: { branch_id: branchId }, status: 'submitted' } }),
            prisma.bpjsClaim.count({ where: { patient: { branch_id: branchId }, status: 'approved' } }),
            prisma.bpjsClaim.count({ where: { patient: { branch_id: branchId }, status: 'rejected' } }),
            prisma.bpjsClaim.count({ where: { patient: { branch_id: branchId }, status: 'paid' } }),
        ]);

        return { total, draft, submitted, approved, rejected, paid };
    }
}
