
import { Request, Response } from 'express';
import { PaymentService } from './payments.service';
import { logger } from '../../utils/logger';

export class PaymentController {
    static async addPayment(req: Request, res: Response) {
        try {
            const result = await PaymentService.addPayment(req.params.orderId, req.body);
            res.status(201).json(result);
        } catch (error: any) {
            logger.error('Add payment error', error);
            res.status(400).json({ message: error.message || 'Internal server error' });
        }
    }

    static async getByOrder(req: Request, res: Response) {
        try {
            const payments = await PaymentService.getByOrder(req.params.orderId);
            res.json(payments);
        } catch (error: any) {
            logger.error('Get payments error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
