
import { Request, Response } from 'express';
import { OrderService } from './orders.service';
import { logger } from '../../utils/logger';

export class OrderController {
    static async create(req: any, res: Response) {
        try {
            const result = await OrderService.create(req.body, req.user.id, req.user.branch_id);
            res.status(201).json(result);
        } catch (error: any) {
            logger.error('Create order error', error);
            res.status(500).json({ message: error.message || 'Internal server error' });
        }
    }

    static async getAll(req: any, res: Response) {
        try {
            const branch_id = req.user.branch_id;
            if (!branch_id) {
                return res.status(400).json({ message: 'User branch not identified' });
            }
            const orders = await OrderService.findAll(branch_id);
            res.json(orders);
        } catch (error: any) {
            logger.error('Get orders error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const order = await OrderService.findById(req.params.id);
            res.json(order);
        } catch (error: any) {
            logger.error('Get order error', error);
            res.status(404).json({ message: error.message });
        }
    }

    static async updateStatus(req: any, res: Response) {
        try {
            const { status } = req.body;
            const order = await OrderService.updateStatus(req.params.id, status, req.user.id);
            res.json(order);
        } catch (error: any) {
            logger.error('Update order status error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async addPayment(req: any, res: Response) {
        try {
            const result = await OrderService.addPayment(req.params.id, req.body, req.user.id);
            res.json(result);
        } catch (error: any) {
            logger.error('Add payment error', error);
            res.status(400).json({ message: error.message || 'Error processing payment' });
        }
    }
}
