
import { Request, Response } from 'express';
import { PrescriptionService } from './prescriptions.service';
import { OcrService } from '../../services/ocrService';
import { logger } from '../../utils/logger';
import path from 'path';

export class PrescriptionController {
    static async getAll(req: Request, res: Response) {
        try {
            const result = await PrescriptionService.findAll();
            res.json(result);
        } catch (error: any) {
            logger.error('Get all prescriptions error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const result = await PrescriptionService.getById(req.params.id);
            res.json(result);
        } catch (error: any) {
            logger.error('Get prescription error', error);
            res.status(404).json({ message: error.message });
        }
    }

    static async getByPatient(req: Request, res: Response) {
        try {
            const result = await PrescriptionService.getByPatient(req.params.patientId);
            res.json(result);
        } catch (error: any) {
            logger.error('Get patient prescriptions error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async scan(req: any, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No image uploaded' });
            }

            const filePath = path.resolve(req.file.path);
            const result = await OcrService.extractPrescription(filePath);
            
            res.json(result);
        } catch (error: any) {
            logger.error('Prescription scan error', error);
            res.status(500).json({ message: error.message });
        }
    }
}
