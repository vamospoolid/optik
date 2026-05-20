
import { Request, Response } from 'express';
import { PatientService } from './patients.service';
import { logger } from '../../utils/logger';
import { OcrService } from '../../services/ocrService';
import path from 'path';
import fs from 'fs';

export class PatientController {
    static async create(req: Request, res: Response) {
        try {
            const branch_id = req.body.branch_id || (req as any).user.branch_id;
            const patient = await PatientService.create({ ...req.body, branch_id });
            res.status(201).json(patient);
        } catch (error: any) {
            logger.error('Create patient error', error);
            if (error.code === 'P2002') {
                return res.status(400).json({ message: 'NIK or BPJS number already exists' });
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getAll(req: any, res: Response) {
        try {
            logger.info(`Getting patients for user: ${JSON.stringify(req.user)}`);
            const { page, limit, search } = req.query;
            const branch_id = req.user.branch_id;
            
            if (!branch_id) {
                return res.status(400).json({ message: 'User branch not identified' });
            }

            const p = page ? parseInt(page as string) : 1;
            const l = limit ? parseInt(limit as string) : 5000;
            const s = (search as string) || '';

            const result = await PatientService.findAll(branch_id, s, p, l);
            res.json(result);
        } catch (error: any) {
            logger.error('Get patients error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const patient = await PatientService.findById(req.params.id);
            res.json(patient);
        } catch (error: any) {
            logger.error('Get patient error', error);
            res.status(404).json({ message: error.message });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const patient = await PatientService.update(req.params.id, req.body);
            res.json(patient);
        } catch (error: any) {
            logger.error('Update patient error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async scan(req: Request, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No image file provided' });
            }

            const imagePath = req.file.path;
            const result = await OcrService.extractPatientData(imagePath);

            // Clean up the uploaded file
            // fs.unlinkSync(imagePath); // Keep it for now if needed, but usually good to delete

            res.json(result);
        } catch (error: any) {
            logger.error('Patient scan error', error);
            res.status(500).json({ message: error.message || 'Internal server error' });
        }
    }
}
