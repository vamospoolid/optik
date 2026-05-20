
import { Router } from 'express';
import { ExaminationController } from './examinations.controller';
import { authenticate } from '../../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', ExaminationController.create);
router.get('/patient/:patientId', ExaminationController.getByPatient);
router.get('/:id', ExaminationController.getById);

export default router;
