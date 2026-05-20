
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { logger } from '../../utils/logger';

export class AuthController {
    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            const result = await AuthService.login(email, password);
            res.json(result);
        } catch (error: any) {
            logger.error('Login error', error);
            res.status(401).json({ message: error.message || 'Authentication failed' });
        }
    }

    static async getMe(req: any, res: Response) {
        try {
            const result = await AuthService.getProfile(req.user.id);
            res.json(result);
        } catch (error: any) {
            logger.error('Get profile error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
