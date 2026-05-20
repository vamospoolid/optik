import { z } from 'zod';

export const createOrderSchema = z.object({
    body: z.object({
        patient_id: z.string().uuid(),
        prescription_id: z.string().uuid().optional().nullable(),
        frame_id: z.string().uuid().optional().nullable(),
        lens_id: z.string().uuid().optional().nullable(),
        total_price: z.number().positive(),
        dp: z.number().nonnegative().default(0),
        payment_status: z.enum(['pending', 'dp', 'paid']),
        order_status: z.enum(['pending', 'processed', 'ready', 'completed']),
    }),
});

export const updateOrderStatusSchema = z.object({
    body: z.object({
        order_status: z.enum(['pending', 'processed', 'ready', 'completed']).optional(),
        payment_status: z.enum(['pending', 'dp', 'paid']).optional(),
        dp: z.number().nonnegative().optional(),
        remaining: z.number().optional(),
    }),
});
