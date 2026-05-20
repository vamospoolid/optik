
import { Request, Response } from 'express';
import { LogService } from './logs.service';
import { logger } from '../../utils/logger';

export class LogController {
    static async getAuditLogs(req: Request, res: Response) {
        try {
            const { start, end, limit } = req.query;
            let startDate, endDate;
            
            if (start && end) {
                startDate = new Date(start as string);
                endDate = new Date(end as string);
            }

            const limitNum = limit ? parseInt(limit as string, 10) : 50;

            const logs = await LogService.getAuditLogs(startDate, endDate, limitNum);
            res.json(logs);
        } catch (error: any) {
            logger.error('Get audit logs error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getLogsByUser(req: Request, res: Response) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
            const logs = await LogService.getLogsByUser(req.params.userId, limit);
            res.json(logs);
        } catch (error: any) {
            logger.error('Get user logs error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getLogsByTable(req: Request, res: Response) {
        try {
            const { table } = req.params;
            const { recordId, limit } = req.query;
            const limitNum = limit ? parseInt(limit as string, 10) : 50;

            const logs = await LogService.getLogsByTable(table, recordId as string, limitNum);
            res.json(logs);
        } catch (error: any) {
            logger.error('Get table logs error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
