
import prisma from '../../config/database';

export class ExpenseService {
    static async getCategories() {
        return prisma.expenseCategory.findMany({
            orderBy: { name: 'asc' }
        });
    }

    static async createCategory(name: string, description?: string) {
        return prisma.expenseCategory.create({
            data: { name, description }
        });
    }

    static async getExpenses(branchId: string, startDate?: Date, endDate?: Date) {
        return prisma.expense.findMany({
            where: {
                branch_id: branchId,
                expense_date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                category: true,
                user: { select: { name: true } }
            },
            orderBy: { expense_date: 'desc' }
        });
    }

    static async createExpense(data: {
        category_id: string;
        branch_id: string;
        user_id: string;
        amount: number;
        notes?: string;
        expense_date?: Date;
    }) {
        return prisma.expense.create({
            data: {
                category_id: data.category_id,
                branch_id: data.branch_id,
                user_id: data.user_id,
                amount: data.amount,
                notes: data.notes,
                expense_date: data.expense_date || new Date()
            }
        });
    }

    static async updateExpense(id: string, data: any) {
        return prisma.expense.update({
            where: { id },
            data
        });
    }

    static async deleteExpense(id: string) {
        return prisma.expense.delete({
            where: { id }
        });
    }
}
