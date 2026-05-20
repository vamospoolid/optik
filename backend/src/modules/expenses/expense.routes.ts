
import { Router } from 'express';
import { ExpenseController } from './expense.controller';
import { authenticate } from '../../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

// Categories
router.get('/categories', ExpenseController.getCategories);
router.post('/categories', ExpenseController.createCategory);

// Expenses
router.get('/:branchId', ExpenseController.getExpenses);
router.post('/', ExpenseController.createExpense);
router.delete('/:id', ExpenseController.deleteExpense);

export default router;
