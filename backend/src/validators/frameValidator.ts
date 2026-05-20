import { z } from 'zod';

export const createFrameSchema = z.object({
    body: z.object({
        brand: z.string().min(1),
        model: z.string().min(1),
        color: z.string().optional(),
        purchase_price: z.number().optional(),
        selling_price: z.number().positive(),
        bpjs_covered: z.boolean().default(false),
        bpjs_price: z.number().optional(),
    }),
});

export const updateFrameSchema = z.object({
    body: z.object({
        brand: z.string().optional(),
        model: z.string().optional(),
        color: z.string().optional(),
        purchase_price: z.number().optional(),
        selling_price: z.number().positive().optional(),
        bpjs_covered: z.boolean().optional(),
        bpjs_price: z.number().optional(),
    }),
});

export const updateFrameStockSchema = z.object({
    body: z.object({
        frame_id: z.string().uuid(),
        branch_id: z.string().uuid(),
        quantity: z.number().int(),
        min_stock: z.number().int().optional(),
    }),
});
