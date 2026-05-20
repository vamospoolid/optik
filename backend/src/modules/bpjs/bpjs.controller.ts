
import { Request, Response } from 'express';
import { BpjsService } from './bpjs.service';
import { logger } from '../../utils/logger';

export class BpjsController {

    static async createClaim(req: any, res: Response) {
        try {
            const claim = await BpjsService.createClaim(req.body, req.user.id);
            res.status(201).json(claim);
        } catch (error: any) {
            logger.error('Create BPJS claim error', error);
            res.status(400).json({ message: error.message || 'Internal server error' });
        }
    }

    static async submitClaim(req: any, res: Response) {
        try {
            const claim = await BpjsService.submitClaim(req.params.id, req.user.id);
            res.json(claim);
        } catch (error: any) {
            logger.error('Submit BPJS claim error', error);
            res.status(400).json({ message: error.message });
        }
    }

    static async updateStatus(req: any, res: Response) {
        try {
            const { status, rejection_reason } = req.body;
            if (!['approved', 'rejected', 'paid'].includes(status)) {
                return res.status(400).json({ message: 'Invalid status. Must be approved, rejected, or paid.' });
            }
            const claim = await BpjsService.updateClaimStatus(
                req.params.id,
                status,
                rejection_reason,
                req.user.id
            );
            res.json(claim);
        } catch (error: any) {
            logger.error('Update BPJS claim status error', error);
            res.status(400).json({ message: error.message });
        }
    }

    static async getAll(req: any, res: Response) {
        try {
            const claims = await BpjsService.findAll(req.user.branch_id);
            res.json(claims);
        } catch (error: any) {
            logger.error('Get BPJS claims error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const claim = await BpjsService.findById(req.params.id);
            res.json(claim);
        } catch (error: any) {
            logger.error('Get BPJS claim error', error);
            res.status(404).json({ message: error.message });
        }
    }

    static async getStats(req: any, res: Response) {
        try {
            const stats = await BpjsService.getStats(req.user.branch_id);
            res.json(stats);
        } catch (error: any) {
            logger.error('Get BPJS stats error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
