
import prisma from '../../config/database';

export class StockMovementService {
    static async logMovement(tx: any, data: {
        type: 'IN' | 'OUT' | 'ADJUSTMENT',
        source: 'SALE' | 'PURCHASE' | 'OPNAME' | 'RETURN',
        quantity: number,
        frame_id?: string,
        lens_id?: string,
        branch_id: string,
        user_id: string,
        notes?: string
    }) {
        return tx.stockMovement.create({
            data: {
                type: data.type,
                source: data.source,
                quantity: data.quantity,
                frame_id: data.frame_id || null,
                lens_id: data.lens_id || null,
                branch_id: data.branch_id,
                user_id: data.user_id,
                notes: data.notes || null,
            }
        });
    }

    static async createBatch(tx: any, data: {
        productId: string,
        type: 'frame' | 'lens',
        branchId: string,
        purchasePrice: number,
        quantity: number
    }) {
        return tx.stockBatch.create({
            data: {
                frame_id: data.type === 'frame' ? data.productId : null,
                lens_id: data.type === 'lens' ? data.productId : null,
                branch_id: data.branchId,
                purchase_price: data.purchasePrice,
                initial_quantity: data.quantity,
                current_quantity: data.quantity
            }
        });
    }

    static async deductFIFO(tx: any, branchId: string, productId: string, type: 'frame' | 'lens', quantity: number) {
        let remainingToDeduct = quantity;
        let totalCost = 0;

        const batches = await tx.stockBatch.findMany({
            where: {
                branch_id: branchId,
                frame_id: type === 'frame' ? productId : null,
                lens_id: type === 'lens' ? productId : null,
                current_quantity: { gt: 0 }
            },
            orderBy: { arrival_date: 'asc' }
        });

        for (const batch of batches) {
            if (remainingToDeduct <= 0) break;

            const deduction = Math.min(batch.current_quantity, remainingToDeduct);
            await tx.stockBatch.update({
                where: { id: batch.id },
                data: { current_quantity: batch.current_quantity - deduction }
            });

            totalCost += deduction * batch.purchase_price;
            remainingToDeduct -= deduction;
        }

        // Fallback if stock batches are out-of-sync with stock count (e.g. after manual adjustments)
        if (remainingToDeduct > 0) {
            let defaultPurchasePrice = 0;
            if (type === 'frame') {
                const frame = await tx.frame.findUnique({
                    where: { id: productId },
                    select: { purchase_price: true }
                });
                defaultPurchasePrice = frame?.purchase_price || 0;
            } else {
                const lens = await tx.lens.findUnique({
                    where: { id: productId },
                    select: { purchase_price: true }
                });
                defaultPurchasePrice = lens?.purchase_price || 0;
            }
            totalCost += remainingToDeduct * defaultPurchasePrice;
        }

        return totalCost;
    }

    static async updateStock(tx: any, branchId: string, productId: string, type: 'frame' | 'lens', delta: number) {
        if (type === 'frame') {
            const stock = await tx.frameStock.findUnique({
                where: { frame_id_branch_id: { frame_id: productId, branch_id: branchId } }
            });

            let result;
            if (stock) {
                result = await tx.frameStock.update({
                    where: { id: stock.id },
                    data: { quantity: stock.quantity + delta }
                });
            } else {
                result = await tx.frameStock.create({
                    data: {
                        frame_id: productId,
                        branch_id: branchId,
                        quantity: delta
                    }
                });
            }

            // Sync global Frame stock count
            await tx.frame.update({
                where: { id: productId },
                data: { stock: { increment: delta } }
            });

            return result;
        } else {
            const stock = await tx.lensStock.findUnique({
                where: { lens_id_branch_id: { lens_id: productId, branch_id: branchId } }
            });

            if (stock) {
                return tx.lensStock.update({
                    where: { id: stock.id },
                    data: { quantity: stock.quantity + delta }
                });
            } else {
                return tx.lensStock.create({
                    data: {
                        lens_id: productId,
                        branch_id: branchId,
                        quantity: delta
                    }
                });
            }
        }
    }
}
