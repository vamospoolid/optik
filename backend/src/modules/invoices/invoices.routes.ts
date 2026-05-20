
import { Router } from 'express';
import { InvoiceController } from './invoices.controller';
import { authenticate } from '../../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', InvoiceController.getAll);
router.get('/order/:orderId', InvoiceController.getByOrder);

export default router;
