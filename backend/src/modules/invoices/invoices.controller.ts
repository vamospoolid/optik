
import { Request, Response } from 'express';
import { InvoiceService } from './invoices.service';
import { logger } from '../../utils/logger';

export class InvoiceController {
    static async getAll(req: any, res: Response) {
        try {
            const invoices = await InvoiceService.findAll(req.user.branch_id);
            res.json(invoices);
        } catch (error: any) {
            logger.error('Get invoices error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getByOrder(req: Request, res: Response) {
        try {
            const invoice = await InvoiceService.getByOrderId(req.params.orderId);
            res.json(invoice);
        } catch (error: any) {
            logger.error('Get invoice error', error);
            res.status(404).json({ message: error.message });
        }
    }
}
