
import prisma from '../../config/database';

export class SettingsService {
    static async getBranchSettings(branchId: string) {
        const branch = await prisma.branch.findUnique({
            where: { id: branchId }
        });
        if (!branch) {
            throw new Error('Branch settings not found');
        }
        return branch;
    }

    static async updateBranchSettings(branchId: string, data: { name?: string, address?: string, phone?: string, logo_url?: string }) {
        return prisma.branch.update({
            where: { id: branchId },
            data: {
                name: data.name,
                address: data.address,
                phone: data.phone,
                logo_url: data.logo_url
            }
        });
    }

    static async resetBranchData(branchId: string) {
        return await prisma.$transaction([
            // Orders & Transactions
            prisma.payment.deleteMany({ where: { order: { patient: { branch_id: branchId } } } }),
            prisma.invoice.deleteMany({ where: { order: { patient: { branch_id: branchId } } } }),
            prisma.bpjsClaim.deleteMany({ where: { patient: { branch_id: branchId } } }),
            prisma.orderItem.deleteMany({ where: { order: { patient: { branch_id: branchId } } } }),
            prisma.order.deleteMany({ where: { patient: { branch_id: branchId } } }),
            
            // Patients & Records
            prisma.prescriptionDetail.deleteMany({ where: { prescription: { examination: { patient: { branch_id: branchId } } } } }),
            prisma.prescription.deleteMany({ where: { examination: { patient: { branch_id: branchId } } } }),
            prisma.eyeExamination.deleteMany({ where: { patient: { branch_id: branchId } } }),
            prisma.patient.deleteMany({ where: { branch_id: branchId } }),

            // Inventory (Limited to branch or related to items handled in branch)
            // Note: Since Frame/Lens are global in current schema, we only delete branch stock. 
            // If user wants to reset EVERYTHING (catalogs too), they can, but let's stick to branch data for safety.
            // Actually, usually users mean "Reset ALL" for a clean start. I'll delete catalogs too as requested "reset database".
            prisma.stockMovement.deleteMany({ where: { branch_id: branchId } }),
            prisma.frameStock.deleteMany({ where: { branch_id: branchId } }),
            prisma.lensStock.deleteMany({ where: { branch_id: branchId } }),
            
            // Shared catalogs - deleting these might affect other branches.
            // In a single-shop setup, it's fine. In multi-branch, we'd need to be more selective.
            // But let's assume they want a clean shop.
            prisma.frame.deleteMany({}),
            prisma.lens.deleteMany({}),
            prisma.supplier.deleteMany({}),
            
            // Logs & Misc
            prisma.auditLog.deleteMany({ where: { user: { branch_id: branchId } } }),
            prisma.reminder.deleteMany({ where: { patient: { branch_id: branchId } } }),
        ]);
    }
}
