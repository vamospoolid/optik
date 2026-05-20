
import prisma from '../../config/database';

export class LogService {
    static async getAuditLogs(startDate?: Date, endDate?: Date, limit: number = 50) {
        // Build where clause
        const where: any = {};
        if (startDate && endDate) {
            where.created_at = {
                gte: startDate,
                lte: endDate,
            };
        }

        return prisma.auditLog.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, role: true } },
            },
            orderBy: { created_at: 'desc' },
            take: limit,
        });
    }

    static async getLogsByUser(userId: string, limit: number = 50) {
        return prisma.auditLog.findMany({
            where: { user_id: userId },
            include: {
                user: { select: { id: true, name: true, role: true } },
            },
            orderBy: { created_at: 'desc' },
            take: limit,
        });
    }

    static async getLogsByTable(tableName: string, recordId?: string, limit: number = 50) {
        const where: any = { table_name: tableName };
        if (recordId) {
            where.record_id = recordId;
        }

        return prisma.auditLog.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, role: true } },
            },
            orderBy: { created_at: 'desc' },
            take: limit,
        });
    }
}
