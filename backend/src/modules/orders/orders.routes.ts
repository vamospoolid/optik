
import { Router } from 'express';
import { OrderController } from './orders.controller';
import { authenticate } from '../../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', OrderController.create);
router.get('/', OrderController.getAll);
router.get('/:id', OrderController.getById);
router.patch('/:id/status', OrderController.updateStatus);
router.post('/:id/payments', OrderController.addPayment);

export default router;
