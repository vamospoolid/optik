
import { Response } from 'express';
import { UserService } from './user.service';
import { logger } from '../../utils/logger';

export class UserController {
    static async getAllUsers(req: any, res: Response) {
        try {
            const branchId = req.user.branch_id;
            const users = await UserService.findAll(branchId);
            res.json(users);
        } catch (error: any) {
            logger.error('Get users error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async updateRole(req: any, res: Response) {
        try {
            const { role } = req.body;
            if (req.user.role !== 'owner' && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Access denied' });
            }
            const updated = await UserService.updateRole(req.params.id, role);
            res.json(updated);
        } catch (error: any) {
            logger.error('Update user role error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async createStaff(req: any, res: Response) {
        try {
            if (req.user.role !== 'owner' && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Access denied' });
            }
            const branch_id = req.user.branch_id;
            const user = await UserService.createStaff({ ...req.body, branch_id });
            res.status(201).json(user);
        } catch (error: any) {
            logger.error('Create staff error', error);
            res.status(400).json({ message: error.message || 'Internal server error' });
        }
    }

    static async deleteUser(req: any, res: Response) {
        try {
            if (req.user.role !== 'owner' && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Access denied' });
            }
            await UserService.deleteUser(req.params.id);
            res.status(204).send();
        } catch (error: any) {
            logger.error('Delete user error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
