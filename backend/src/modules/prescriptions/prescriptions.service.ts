
import prisma from '../../config/database';

export class PrescriptionService {
    static async getById(id: string) {
        const prescription = await prisma.prescription.findUnique({
            where: { id },
            include: {
                details: true,
                examination: {
                    include: { patient: true }
                }
            }
        });

        if (!prescription) throw new Error('Prescription not found');
        return prescription;
    }

    static async getByPatient(patientId: string) {
        return prisma.prescription.findMany({
            where: { examination: { patient_id: patientId } },
            include: { details: true, examination: true },
        });
    }

    static async findAll() {
        return prisma.prescription.findMany({
            include: { 
                details: true, 
                examination: { include: { patient: true } } 
            },
            orderBy: { created_at: 'desc' }
        });
    }
}
