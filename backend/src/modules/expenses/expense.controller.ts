
import { Request, Response } from 'express';
import { ExpenseService } from './expense.service';

export class ExpenseController {
    static async getCategories(req: Request, res: Response) {
        try {
            const categories = await ExpenseService.getCategories();
            res.status(200).json(categories);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async createCategory(req: Request, res: Response) {
        try {
            const { name, description } = req.body;
            const category = await ExpenseService.createCategory(name, description);
            res.status(201).json(category);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getExpenses(req: Request, res: Response) {
        try {
            const { branchId } = req.params;
            const { startDate, endDate } = req.query;
            const expenses = await ExpenseService.getExpenses(
                branchId,
                startDate ? new Date(startDate as string) : undefined,
                endDate ? new Date(endDate as string) : undefined
            );
            res.status(200).json(expenses);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async createExpense(req: Request, res: Response) {
        try {
            const { category_id, branch_id, amount, notes, expense_date } = req.body;
            const user_id = (req as any).user.id;
            const expense = await ExpenseService.createExpense({
                category_id,
                branch_id,
                user_id,
                amount,
                notes,
                expense_date: expense_date ? new Date(expense_date) : undefined
            });
            res.status(201).json(expense);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async deleteExpense(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await ExpenseService.deleteExpense(id);
            res.status(200).json({ message: 'Expense deleted successfully' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
