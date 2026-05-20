import prisma from '../../config/database';
import { StockMovementService } from './stock-movement.service';

export class InventoryService {
    // Frames
    static async getFrames(branchId: string, search?: string) {
        const where: any = {};
        if (search) {
            where.OR = [
                { brand: { contains: search, mode: 'insensitive' } },
                { model: { contains: search, mode: 'insensitive' } },
            ];
        }

        return prisma.frame.findMany({
            where,
            include: { 
                stocks: { where: { branch_id: branchId } },
                supplier: true
            }
        });
    }

    static async createFrame(data: any, userId: string, branchId: string) {
        const { selling_price, initial_stock = 0, ...rest } = data;
        
        return await prisma.$transaction(async (tx) => {
            const frame = await tx.frame.create({ 
                data: {
                    ...rest,
                    price: parseFloat(selling_price),
                    stock: initial_stock
                } 
            });

            if (initial_stock > 0) {
                await StockMovementService.updateStock(tx, branchId, frame.id, 'frame', initial_stock);
                await StockMovementService.createBatch(tx, {
                    productId: frame.id,
                    type: 'frame',
                    branchId: branchId,
                    purchasePrice: data.purchase_price ? parseFloat(data.purchase_price) : 0,
                    quantity: initial_stock
                });
                await StockMovementService.logMovement(tx, {
                    type: 'IN',
                    source: 'PURCHASE',
                    quantity: initial_stock,
                    frame_id: frame.id,
                    branch_id: branchId,
                    user_id: userId,
                    notes: 'Stok awal saat pendaftaran barang'
                });
            }

            return frame;
        });
    }

    // Lenses
    static async getLenses(branchId: string, search?: string) {
        const where: any = {};
        if (search) {
            where.OR = [
                { brand: { contains: search, mode: 'insensitive' } },
                { type: { contains: search, mode: 'insensitive' } },
                { feature: { contains: search, mode: 'insensitive' } },
            ];
        }

        return prisma.lens.findMany({
            where,
            include: { 
                stocks: { where: { branch_id: branchId } },
                supplier: true
            }
        });
    }

    static async createLens(data: any, userId: string, branchId: string) {
        const { selling_price, initial_stock = 0, ...rest } = data;
        
        return await prisma.$transaction(async (tx) => {
            const lens = await tx.lens.create({ 
                data: {
                    ...rest,
                    price: parseFloat(selling_price)
                } 
            });

            if (initial_stock > 0) {
                await StockMovementService.updateStock(tx, branchId, lens.id, 'lens', initial_stock);
                await StockMovementService.createBatch(tx, {
                    productId: lens.id,
                    type: 'lens',
                    branchId: branchId,
                    purchasePrice: data.purchase_price ? parseFloat(data.purchase_price) : 0,
                    quantity: initial_stock
                });
                await StockMovementService.logMovement(tx, {
                    type: 'IN',
                    source: 'PURCHASE',
                    quantity: initial_stock,
                    lens_id: lens.id,
                    branch_id: branchId,
                    user_id: userId,
                    notes: 'Stok awal saat pendaftaran barang'
                });
            }

            return lens;
        });
    }

    static async getMovements(productId: string) {
        return (prisma as any).stockMovement.findMany({
            where: {
                OR: [
                    { frame_id: productId },
                    { lens_id: productId }
                ]
            },
            include: {
                user: { select: { name: true } }
            },
            orderBy: { created_at: 'desc' }
        });
    }
}
