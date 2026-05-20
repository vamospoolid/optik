
import { Response } from 'express';
import { SettingsService } from './settings.service';
import { logger } from '../../utils/logger';

export class SettingsController {
    static async getSettings(req: any, res: Response) {
        try {
            const branchId = req.user.branch_id;
            if (!branchId) {
                return res.status(400).json({ message: 'User not associated with a branch' });
            }
            const settings = await SettingsService.getBranchSettings(branchId);
            res.json(settings);
        } catch (error: any) {
            logger.error('Get settings error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async updateSettings(req: any, res: Response) {
        try {
            const branchId = req.user.branch_id;
            if (!branchId) {
                return res.status(400).json({ message: 'User not associated with a branch' });
            }
            // Basic role check (owner or admin)
            if (req.user.role !== 'owner' && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Access denied' });
            }
            const updated = await SettingsService.updateBranchSettings(branchId, req.body);
            res.json(updated);
        } catch (error: any) {
            logger.error('Update settings error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async resetDatabase(req: any, res: Response) {
        try {
            const branchId = req.user.branch_id;
            if (!branchId) {
                return res.status(400).json({ message: 'User not associated with a branch' });
            }
            if (req.user.role !== 'owner' && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Hanya owner atau admin yang dapat meriset database' });
            }
            await SettingsService.resetBranchData(branchId);
            res.json({ message: 'Seluruh data transaksi, pasien, dan inventory telah berhasil diriset.' });
        } catch (error: any) {
            logger.error('Reset database error', error);
            res.status(500).json({ message: 'Gagal meriset database' });
        }
    }
}
