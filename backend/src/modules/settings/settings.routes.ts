
import { Router } from 'express';
import { SettingsController } from './settings.controller';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = Router();

router.get('/branch', authMiddleware, SettingsController.getSettings);
router.patch('/branch', authMiddleware, SettingsController.updateSettings);
router.post('/reset', authMiddleware, SettingsController.resetDatabase);

export default router;
