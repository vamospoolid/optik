
import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { authenticate } from '../../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/frames', InventoryController.getFrames);
router.post('/frames', InventoryController.addFrame);
router.get('/lenses', InventoryController.getLenses);
router.post('/lenses', InventoryController.addLens);
router.get('/:id/movements', InventoryController.getMovements);

export default router;
