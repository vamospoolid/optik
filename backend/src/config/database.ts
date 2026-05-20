import { PrismaClient } from '@prisma/client';
import { getIO } from '../utils/socket';

const prisma = new PrismaClient();

// Prisma Middleware for Real-time Updates
prisma.$use(async (params, next) => {
    const result = await next(params);

    const mutatingActions = ['create', 'update', 'delete', 'updateMany', 'deleteMany', 'createMany'];
    
    if (mutatingActions.includes(params.action)) {
        const io = getIO();
        if (io) {
            // Specific event for audit logs
            if (params.model === ('AuditLog' as any)) {
                io.emit('new_audit_log', result);
            }
            
            // Global event to tell frontend that data has changed
            io.emit('data_changed', { model: params.model, action: params.action });
        }
    }

    return result;
});

export default prisma;
