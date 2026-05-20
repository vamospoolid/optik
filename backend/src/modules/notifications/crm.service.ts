
import prisma from '../../config/database';

export class CRMService {
    static async getCRMAlerts(branchId: string) {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        // 1. Birthdays Today & Upcoming
        const birthdays = await this.getBirthdays(branchId);

        // 2. Ready for Pickup (Status: READY but not COMPLETED)
        const pickupReminders = await this.getPickupReminders(branchId);

        // 3. Re-checkup Reminders (Last order > 1 year ago)
        const checkupReminders = await this.getCheckupReminders(branchId);

        return {
            birthdays,
            pickupReminders,
            checkupReminders,
            summary: {
                total_alerts: birthdays.length + pickupReminders.length + checkupReminders.length
            }
        };
    }

    private static async getBirthdays(branchId: string) {
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();

        // Prisma doesn't support easy month/day extraction in cross-DB ways without raw query or additional fields
        // But for many databases, we can use raw query or filter in memory if patient count is small
        // For efficiency, let's use a raw query if possible, or a more optimized approach
        
        const patients = await prisma.patient.findMany({
            where: { branch_id: branchId },
            select: { id: true, name: true, phone: true, birth_date: true }
        });

        return patients.filter(p => {
            if (!p.birth_date) return false;
            const bDate = new Date(p.birth_date);
            return bDate.getMonth() === today.getMonth() && bDate.getDate() === today.getDate();
        });
    }

    private static async getPickupReminders(branchId: string) {
        // Find orders with status 'ready' that were updated more than 3 days ago
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        return prisma.order.findMany({
            where: {
                patient: { branch_id: branchId },
                status: 'ready',
                updated_at: { lte: threeDaysAgo }
            },
            include: {
                patient: { select: { name: true, phone: true } }
            }
        });
    }

    private static async getCheckupReminders(branchId: string) {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        // This is a bit complex: Patients whose LATEST order was > 1 year ago
        // For simplicity in this stage, we'll find patients who haven't ordered in a year
        const patientsWithRecentOrders = await prisma.order.findMany({
            where: {
                patient: { branch_id: branchId },
                order_date: { gte: oneYearAgo }
            },
            select: { patient_id: true }
        });

        const recentPatientIds = Array.from(new Set(patientsWithRecentOrders.map(o => o.patient_id)));

        return prisma.patient.findMany({
            where: {
                branch_id: branchId,
                id: { notIn: recentPatientIds },
                orders: { some: {} } // Only those who have ordered at least once
            },
            select: { id: true, name: true, phone: true, created_at: true }
        });
    }
}
