
import prisma from '../../config/database';

export class ReportService {
    static async getDashboardMetrics(branchId: string, startDate?: Date, endDate?: Date) {
        const today = new Date();
        const start = startDate || new Date(today.setHours(0, 0, 0, 0));
        const end = endDate || new Date(today.setHours(23, 59, 59, 999));

        const [
            totalPatients,
            newPatientsToday,
            totalOrders,
            ordersToday,
            totalRevenue,
            revenueToday,
            recentOrders,
            lowStockFrames,
            lowStockLenses,
            bpjsStats,
            expenseToday,
        ] = await Promise.all([
            // Patients
            prisma.patient.count({ where: { branch_id: branchId } }),
            prisma.patient.count({
                where: { branch_id: branchId, created_at: { gte: start, lte: end } },
            }),
            // Orders
            prisma.order.count({ where: { patient: { branch_id: branchId } } }),
            prisma.order.count({
                where: { patient: { branch_id: branchId }, order_date: { gte: start, lte: end } },
            }),
            // Revenue (Total all time vs Today)
            prisma.invoice.aggregate({
                where: { order: { patient: { branch_id: branchId } } },
                _sum: { total_amount: true },
            }),
            prisma.invoice.aggregate({
                where: {
                    order: { patient: { branch_id: branchId } },
                    created_at: { gte: start, lte: end },
                },
                _sum: { total_amount: true },
            }),
            // Recent Orders
            prisma.order.findMany({
                where: { patient: { branch_id: branchId } },
                include: { patient: { select: { name: true } }, invoices: true },
                orderBy: { order_date: 'desc' },
                take: 5,
            }),
            // Low Stock Warnings
            prisma.frameStock.findMany({
                where: { branch_id: branchId, quantity: { lte: prisma.frameStock.fields.min_stock } },
                include: { frame: true },
                take: 5,
            }),
            prisma.lensStock.findMany({
                where: { branch_id: branchId, quantity: { lte: prisma.lensStock.fields.min_stock } },
                include: { lens: true },
                take: 5,
            }),
            // BPJS Stats
            prisma.bpjsClaim.count({
                where: { patient: { branch_id: branchId }, status: { in: ['draft', 'submitted'] } }
            }),
            // Expenses
            prisma.expense.aggregate({
                where: {
                    branch_id: branchId,
                    expense_date: { gte: start, lte: end },
                },
                _sum: { amount: true },
            }),
        ]);


        const trends = await this.getSalesTrend(branchId);

        return {
            patients: { total: totalPatients, today: newPatientsToday },
            orders: { total: totalOrders, today: ordersToday },
            revenue: {
                total: totalRevenue?._sum?.total_amount || 0,
                today: revenueToday?._sum?.total_amount || 0,
            },
            recent_orders: recentOrders,
            alerts: {
                low_frames: lowStockFrames,
                low_lenses: lowStockLenses,
            },
            bpjs: {
                pending: bpjsStats
            },
            trends,
            expenses: {
                today: expenseToday?._sum?.amount || 0,
            },
        };
    }

    static async getSalesTrend(branchId: string) {
        const trends = [];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
        
        // Last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 0, 23, 59, 59, 999);

            const [umumSales, bpjsSales] = await Promise.all([
                prisma.invoice.aggregate({
                    where: {
                        order: {
                            patient: { branch_id: branchId },
                            bpjs_claim: null // No BPJS claim means General
                        },
                        created_at: { gte: start, lte: end }
                    },
                    _sum: { total_amount: true }
                }),
                prisma.invoice.aggregate({
                    where: {
                        order: {
                            patient: { branch_id: branchId },
                            bpjs_claim: { isNot: null } // Has BPJS claim
                        },
                        created_at: { gte: start, lte: end }
                    },
                    _sum: { total_amount: true }
                })
            ]);

            trends.push({
                name: monthNames[month - 1],
                umum: umumSales?._sum?.total_amount || 0,
                bpjs: bpjsSales?._sum?.total_amount || 0,
                total: (umumSales?._sum?.total_amount || 0) + (bpjsSales?._sum?.total_amount || 0)
            });
        }
        return trends;
    }

    static async getSalesReport(branchId: string, month: number, year: number) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        const orders = await prisma.order.findMany({
            where: {
                patient: { branch_id: branchId },
                order_date: { gte: startDate, lte: endDate },
            },
            include: {
                items: { include: { frame: true, lens: true } },
                invoices: true,
                payments: true,
            },
            orderBy: { order_date: 'asc' },
        });

        const expenses = await prisma.expense.findMany({
            where: {
                branch_id: branchId,
                expense_date: { gte: startDate, lte: endDate },
            },
            include: { category: true }
        });

        // Calculate total revenue, frame sales, lens sales, service sales, and profit
        let totalRevenue = 0;
        let totalRemaining = 0;
        let frameSales = 0;
        let lensSales = 0;
        let serviceSales = 0;
        let totalGrossProfit = 0;
        let totalExpenses = 0;
        const paymentMethods: Record<string, number> = {};
        const expenseBreakdown: Record<string, number> = {};

        orders.forEach(order => {
            const invoice = order.invoices[0];
            if (invoice) {
                totalRevenue += invoice.total_amount;
                totalRemaining += invoice.remaining;
            }

            order.items.forEach(item => {
                const itemTotal = item.price * item.qty;
                
                // Fallback for HPP: captured cost_price -> master purchase_price -> 0
                const costPrice = item.cost_price || 
                                (item.product_type === 'frame' ? item.frame?.purchase_price : 0) || 
                                (item.product_type === 'lens' ? item.lens?.purchase_price : 0) || 
                                0;
                
                const itemProfit = (item.price - costPrice) * item.qty;
                totalGrossProfit += itemProfit;

                if (item.product_type === 'frame') frameSales += itemTotal;
                if (item.product_type === 'lens') lensSales += itemTotal;
                if (item.product_type === 'service') serviceSales += itemTotal;
            });

            // Count payments in this period for this order
            const orderPayments = (order as any).payments || [];
            orderPayments.forEach((p: any) => {
                paymentMethods[p.method] = (paymentMethods[p.method] || 0) + p.amount;
            });
        });

        expenses.forEach((exp: any) => {
            totalExpenses += exp.amount;
            const catName = exp.category.name;
            expenseBreakdown[catName] = (expenseBreakdown[catName] || 0) + exp.amount;
        });

        const netProfit = totalGrossProfit - totalExpenses;

        return {
            period: { month, year },
            summary: {
                total_orders: orders.length,
                total_revenue: totalRevenue,
                total_receivables: totalRemaining,
                total_gross_profit: totalGrossProfit,
                total_expenses: totalExpenses,
                total_net_profit: netProfit,
                breakdown: {
                    frame_sales: frameSales,
                    lens_sales: lensSales,
                    service_sales: serviceSales,
                },
                payment_methods: paymentMethods,
                expense_breakdown: expenseBreakdown
            },
            data: orders,
            expenses: expenses
        };
    }
}
