
import prisma from '../../config/database';

export class ExaminationService {
    static async create(data: any) {
        const { patient_id, doctor_name, exam_date, source, notes, prescriptions } = data;

        // Use transaction to create examination and associated prescriptions
        return await prisma.$transaction(async (tx) => {
            const examination = await tx.eyeExamination.create({
                data: {
                    patient_id,
                    doctor_name,
                    exam_date: exam_date ? new Date(exam_date) : new Date(),
                    source,
                    notes,
                },
            });

            if (prescriptions && prescriptions.length > 0) {
                for (const p of prescriptions) {
                    const createdPrescription = await tx.prescription.create({
                        data: {
                            exam_id: examination.id,
                            type: p.type,
                            pd: p.pd,
                        },
                    });

                    if (p.details && p.details.length > 0) {
                        await tx.prescriptionDetail.createMany({
                            data: p.details.map((d: any) => ({
                                prescription_id: createdPrescription.id,
                                eye: d.eye,
                                sph: d.sph,
                                cyl: d.cyl,
                                axis: d.axis,
                                add_power: d.add_power,
                            })),
                        });
                    }
                }
            }

            return tx.eyeExamination.findUnique({
                where: { id: examination.id },
                include: {
                    prescriptions: {
                        include: { details: true }
                    }
                }
            });
        });
    }

    static async getByPatient(patientId: string) {
        return prisma.eyeExamination.findMany({
            where: { patient_id: patientId },
            include: {
                prescriptions: {
                    include: { details: true }
                }
            },
            orderBy: { exam_date: 'desc' }
        });
    }

    static async getById(id: string) {
        const exam = await prisma.eyeExamination.findUnique({
            where: { id },
            include: {
                patient: true,
                prescriptions: {
                    include: { details: true }
                }
            }
        });

        if (!exam) throw new Error('Examination record not found');
        return exam;
    }
}
