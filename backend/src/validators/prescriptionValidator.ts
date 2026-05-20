import { z } from 'zod';

const prescriptionDetailSchema = z.object({
    eye: z.enum(['R', 'L']),
    sph: z.number(),
    cyl: z.number().optional(),
    axis: z.number().int().optional(),
    add_power: z.number().optional(),
});

export const createPrescriptionSchema = z.object({
    body: z.object({
        patient_id: z.string().uuid(),
        source: z.enum(['rs', 'internal']),
        doctor_name: z.string().optional(),
        examination_date: z.string(),
        type: z.enum(['monofocal', 'bifocal', 'progressive']),
        pd: z.number().int().optional(),
        notes: z.string().optional(),
        details: z.array(prescriptionDetailSchema).min(1),
    }),
});

export const updatePrescriptionSchema = z.object({
    body: z.object({
        source: z.enum(['rs', 'internal']).optional(),
        doctor_name: z.string().optional(),
        examination_date: z.string().optional(),
        type: z.enum(['monofocal', 'bifocal', 'progressive']).optional(),
        pd: z.number().int().optional(),
        notes: z.string().optional(),
    }),
});
