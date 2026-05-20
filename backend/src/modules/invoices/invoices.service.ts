
import prisma from '../../config/database';

export class InvoiceService {
    static async getByOrderId(orderId: string) {
        return prisma.order.findUnique({
            where: { id: orderId },
            include: {
                patient: true,
                prescription: {
                    include: { details: true }
                },
                items: {
                    include: {
                        frame: true,
                        lens: true
                    }
                },
                invoices: true,
                payments: true
            }
        });
    }

    static async findAll(branchId: string) {
        return prisma.invoice.findMany({
            where: {
                order: {
                    patient: { branch_id: branchId }
                }
            },
            include: {
                order: {
                    include: {
                        patient: { select: { name: true, phone: true } }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
    }
}
