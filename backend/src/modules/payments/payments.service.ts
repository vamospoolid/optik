
import prisma from '../../config/database';

export class PaymentService {

    static async addPayment(orderId: string, data: any) {
        const { method, amount } = data;

        return await prisma.$transaction(async (tx) => {
            // Get the current invoice
            const invoice = await tx.invoice.findFirst({
                where: { order_id: orderId },
            });
            if (!invoice) throw new Error('Invoice not found for this order');

            if (amount > invoice.remaining) {
                throw new Error(`Payment of ${amount} exceeds remaining balance of ${invoice.remaining}`);
            }

            // Create payment
            const payment = await tx.payment.create({
                data: {
                    order_id: orderId,
                    method,
                    amount,
                },
            });

            // Update invoice remaining balance
            const newRemaining = invoice.remaining - amount;
            const newDpAmount = invoice.dp_amount + amount;

            await tx.invoice.update({
                where: { id: invoice.id },
                data: {
                    remaining: newRemaining,
                    dp_amount: newDpAmount,
                },
            });

            // If fully paid, mark order as processed
            if (newRemaining <= 0) {
                await tx.order.update({
                    where: { id: orderId },
                    data: { status: 'processed' },
                });
            }

            return {
                payment,
                invoice: { ...invoice, remaining: newRemaining, dp_amount: newDpAmount },
                is_paid_off: newRemaining <= 0,
            };
        });
    }

    static async getByOrder(orderId: string) {
        return prisma.payment.findMany({
            where: { order_id: orderId },
            orderBy: { paid_at: 'asc' },
        });
    }
}
