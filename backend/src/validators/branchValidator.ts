import { z } from 'zod';

export const createBranchSchema = z.object({
    body: z.object({
        name: z.string().min(2),
        address: z.string().optional(),
        phone: z.string().optional(),
    }),
});

export const updateBranchSchema = z.object({
    body: z.object({
        name: z.string().min(2).optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
    }),
});
