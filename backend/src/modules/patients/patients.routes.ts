
import { Router } from 'express';
import multer from 'multer';
import { PatientController } from './patients.controller';
import { authenticate } from '../../middlewares/authMiddleware';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.use(authenticate);

router.post('/scan', upload.single('ktp_image'), PatientController.scan);
router.post('/', PatientController.create);
router.get('/', PatientController.getAll);
router.get('/:id', PatientController.getById);
router.put('/:id', PatientController.update);

export default router;
