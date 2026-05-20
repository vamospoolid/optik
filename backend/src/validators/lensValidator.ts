import { z } from 'zod';

export const createLensSchema = z.object({
    body: z.object({
        brand: z.string().min(1),
        type: z.enum(['monofocal', 'bifocal', 'progressive']),
        feature: z.enum(['normal', 'bluecromic', 'photochromic']),
        purchase_price: z.number().optional(),
        selling_price: z.number().positive(),
        bpjs_covered: z.boolean().default(false),
        bpjs_price: z.number().optional(),
    }),
});

export const updateLensSchema = z.object({
    body: z.object({
        brand: z.string().optional(),
        type: z.enum(['monofocal', 'bifocal', 'progressive']).optional(),
        feature: z.enum(['normal', 'bluecromic', 'photochromic']).optional(),
        purchase_price: z.number().optional(),
        selling_price: z.number().positive().optional(),
        bpjs_covered: z.boolean().optional(),
        bpjs_price: z.number().optional(),
    }),
});

export const updateLensStockSchema = z.object({
    body: z.object({
        lens_id: z.string().uuid(),
        branch_id: z.string().uuid(),
        quantity: z.number().int(),
        min_stock: z.number().int().optional(),
    }),
});
