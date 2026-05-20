
import { Request, Response } from 'express';
import { SupplierService } from './suppliers.service';
import { logger } from '../../utils/logger';

export class SupplierController {
    static async getAll(req: Request, res: Response) {
        try {
            const suppliers = await SupplierService.getAll();
            res.json(suppliers);
        } catch (error: any) {
            logger.error('Get suppliers error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const supplier = await SupplierService.getById(req.params.id);
            if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
            res.json(supplier);
        } catch (error: any) {
            logger.error('Get supplier by id error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const supplier = await SupplierService.create(req.body);
            res.status(201).json(supplier);
        } catch (error: any) {
            logger.error('Create supplier error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const supplier = await SupplierService.update(req.params.id, req.body);
            res.json(supplier);
        } catch (error: any) {
            logger.error('Update supplier error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            await SupplierService.delete(req.params.id);
            res.status(204).send();
        } catch (error: any) {
            logger.error('Delete supplier error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
