
import { Request, Response } from 'express';
import { InventoryService } from './inventory.service';
import { logger } from '../../utils/logger';

export class InventoryController {
    static async getFrames(req: any, res: Response) {
        try {
            const branch_id = req.user.branch_id;
            const { search } = req.query;
            if (!branch_id) {
                return res.status(400).json({ message: 'User branch not identified' });
            }
            const frames = await InventoryService.getFrames(branch_id, search as string);
            console.log(`[Inventory] getFrames for branch ${branch_id}, search: "${search || ''}", found: ${frames.length}`);
            res.json(frames);
        } catch (error: any) {
            logger.error('Get frames error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getLenses(req: any, res: Response) {
        try {
            const branch_id = req.user.branch_id;
            const { search } = req.query;
            if (!branch_id) {
                return res.status(400).json({ message: 'User branch not identified' });
            }
            const lenses = await InventoryService.getLenses(branch_id, search as string);
            console.log(`[Inventory] getLenses for branch ${branch_id}, search: "${search || ''}", found: ${lenses.length}`);
            res.json(lenses);
        } catch (error: any) {
            logger.error('Get lenses error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async addFrame(req: any, res: Response) {
        try {
            const frame = await InventoryService.createFrame(req.body, req.user.id, req.user.branch_id);
            res.status(201).json(frame);
        } catch (error: any) {
            logger.error('Add frame error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async addLens(req: any, res: Response) {
        try {
            const lens = await InventoryService.createLens(req.body, req.user.id, req.user.branch_id);
            res.status(201).json(lens);
        } catch (error: any) {
            logger.error('Add lens error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getMovements(req: Request, res: Response) {
        try {
            const movements = await InventoryService.getMovements(req.params.id);
            res.json(movements);
        } catch (error: any) {
            logger.error('Get movements error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
