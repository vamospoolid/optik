import { z } from 'zod';

export const createPatientSchema = z.object({
    body: z.object({
        nik: z.string().length(16).optional().nullable().or(z.literal('')),
        name: z.string().min(2),
        birth_date: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        bpjs_number: z.string().optional().nullable(),
        branch_id: z.string().optional().nullable(),
    }),
});

export const updatePatientSchema = z.object({
    body: z.object({
        name: z.string().min(2).optional(),
        birth_date: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        bpjs_number: z.string().optional(),
        branch_id: z.string().optional().nullable(),
    }),
});
