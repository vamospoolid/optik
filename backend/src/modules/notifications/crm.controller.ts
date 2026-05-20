
import { Request, Response } from 'express';
import { CRMService } from './crm.service';

export class CRMController {
    static async getAlerts(req: any, res: Response) {
        try {
            const branchId = req.user.branch_id;
            const alerts = await CRMService.getCRMAlerts(branchId);
            res.json(alerts);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}
