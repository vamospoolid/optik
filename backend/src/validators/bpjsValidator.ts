import { z } from 'zod';

export const createBpjsClaimSchema = z.object({
    body: z.object({
        order_id: z.string().uuid(),
        claim_number: z.string().optional(),
    }),
});

export const updateBpjsClaimSchema = z.object({
    body: z.object({
        claim_number: z.string().optional(),
        status: z.enum(['draft', 'submitted', 'approved', 'rejected', 'paid']),
        rejection_reason: z.string().optional(),
    }),
});
