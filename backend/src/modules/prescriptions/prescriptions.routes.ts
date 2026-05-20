
import { Router } from 'express';
import multer from 'multer';
import { PrescriptionController } from './prescriptions.controller';
import { authenticate } from '../../middlewares/authMiddleware';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.use(authenticate);

router.post('/scan', upload.single('prescription_image'), PrescriptionController.scan);
router.get('/', PrescriptionController.getAll);
router.get('/patient/:patientId', PrescriptionController.getByPatient);
router.get('/:id', PrescriptionController.getById);

export default router;
