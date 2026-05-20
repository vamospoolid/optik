
import { Router } from 'express';
import { BpjsController } from './bpjs.controller';
import { authenticate } from '../../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', BpjsController.createClaim);
router.get('/', BpjsController.getAll);
router.get('/stats', BpjsController.getStats);
router.get('/:id', BpjsController.getById);

// Status workflows
router.patch('/:id/submit', BpjsController.submitClaim);
router.patch('/:id/status', BpjsController.updateStatus);

export default router;
