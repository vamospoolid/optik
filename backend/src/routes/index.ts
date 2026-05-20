
import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import patientRoutes from '../modules/patients/patients.routes';
import inventoryRoutes from '../modules/inventory/inventory.routes';
import examinationRoutes from '../modules/examinations/examinations.routes';
import prescriptionRoutes from '../modules/prescriptions/prescriptions.routes';
import orderRoutes from '../modules/orders/orders.routes';
import paymentRoutes from '../modules/payments/payments.routes';
import invoiceRoutes from '../modules/invoices/invoices.routes';
import bpjsRoutes from '../modules/bpjs/bpjs.routes';
import reportRoutes from '../modules/reports/reports.routes';
import logRoutes from '../modules/logs/logs.routes';
import supplierRoutes from '../modules/suppliers/suppliers.routes';
import notificationRoutes from '../modules/notifications/notifications.routes';
import settingsRoutes from '../modules/settings/settings.routes';
import userRoutes from '../modules/users/user.routes';
import expenseRoutes from '../modules/expenses/expense.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/examinations', examinationRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/bpjs', bpjsRoutes);
router.use('/reports', reportRoutes);
router.use('/logs', logRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/notifications', notificationRoutes);
router.use('/settings', settingsRoutes);
router.use('/users', userRoutes);
router.use('/expenses', expenseRoutes);

export default router;
