
import { Request, Response } from 'express';
import { ExaminationService } from './examinations.service';
import { logger } from '../../utils/logger';

export class ExaminationController {
    static async create(req: Request, res: Response) {
        try {
            const result = await ExaminationService.create(req.body);
            res.status(201).json(result);
        } catch (error: any) {
            logger.error('Create examination error', error);
            res.status(500).json({ message: error.message || 'Internal server error' });
        }
    }

    static async getByPatient(req: Request, res: Response) {
        try {
            const result = await ExaminationService.getByPatient(req.params.patientId);
            res.json(result);
        } catch (error: any) {
            logger.error('Get examinations error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const result = await ExaminationService.getById(req.params.id);
            res.json(result);
        } catch (error: any) {
            logger.error('Get examination error', error);
            res.status(404).json({ message: error.message });
        }
    }
}
