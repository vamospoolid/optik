
import { Router } from 'express';
import { CRMController } from './crm.controller';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = Router();

router.get('/alerts', authMiddleware as any, CRMController.getAlerts as any);

export default router;
