
import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middlewares/validationMiddleware';
import { loginSchema } from './auth.validator';
import { authenticate } from '../../middlewares/authMiddleware';

const router = Router();

router.post('/login', validate(loginSchema), AuthController.login);
router.get('/me', authenticate, AuthController.getMe);

export default router;
