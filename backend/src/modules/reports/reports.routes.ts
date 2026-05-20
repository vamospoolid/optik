
import { Router } from 'express';
import { ReportController } from './reports.controller';
import { authenticate } from '../../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/dashboard', ReportController.getDashboardMetrics);
router.get('/sales', ReportController.getSalesReport);

export default router;
