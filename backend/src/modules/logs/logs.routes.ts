
import { Router } from 'express';
import { LogController } from './logs.controller';
import { authenticate } from '../../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', LogController.getAuditLogs);
router.get('/user/:userId', LogController.getLogsByUser);
router.get('/table/:table', LogController.getLogsByTable);

export default router;
