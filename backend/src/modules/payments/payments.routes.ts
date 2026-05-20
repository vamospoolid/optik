
import { Router } from 'express';
import { PaymentController } from './payments.controller';
import { authenticate } from '../../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

// Add payment for an order
router.post('/orders/:orderId/pay', PaymentController.addPayment);
// Get payment history for an order
router.get('/orders/:orderId', PaymentController.getByOrder);

export default router;
