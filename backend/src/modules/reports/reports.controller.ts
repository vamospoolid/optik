
import { Request, Response } from 'express';
import { ReportService } from './reports.service';
import { logger } from '../../utils/logger';

export class ReportController {
    static async getDashboardMetrics(req: any, res: Response) {
        try {
            const branch_id = req.user.branch_id;
            if (!branch_id) {
                return res.status(400).json({ message: 'User branch not identified' });
            }
            const metrics = await ReportService.getDashboardMetrics(branch_id);
            res.json(metrics);
        } catch (error: any) {
            logger.error('Get dashboard metrics error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getSalesReport(req: any, res: Response) {
        try {
            const branch_id = req.user.branch_id;
            if (!branch_id) {
                return res.status(400).json({ message: 'User branch not identified' });
            }
            const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
            const year = parseInt(req.query.year as string) || new Date().getFullYear();

            const report = await ReportService.getSalesReport(branch_id, month, year);
            res.json(report);
        } catch (error: any) {
            logger.error('Get sales report error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
