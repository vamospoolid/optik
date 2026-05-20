
import { Router } from 'express';
import { SupplierController } from './suppliers.controller';
import { authenticate } from '../../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', SupplierController.getAll);
router.get('/:id', SupplierController.getById);
router.post('/', SupplierController.create);
router.put('/:id', SupplierController.update);
router.delete('/:id', SupplierController.delete);

export default router;
