
import { Router } from 'express';
import { UserController } from './user.controller';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = Router();

router.get('/', authMiddleware, UserController.getAllUsers);
router.post('/', authMiddleware, UserController.createStaff);
router.patch('/:id/role', authMiddleware, UserController.updateRole);
router.delete('/:id', authMiddleware, UserController.deleteUser);

export default router;
