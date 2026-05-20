
import prisma from '../../config/database';
import { encrypt, decrypt } from '../../services/encryptionService';

export class PatientService {
    static async create(data: any) {
        const { nik, name, birth_date, phone, address, bpjs_number, branch_id, gender } = data;
        
        const patient = await prisma.patient.create({
            data: {
                nik: nik ? encrypt(nik) : null,
                name,
                gender,
                birth_date: birth_date ? new Date(birth_date) : null,
                phone,
                address,
                bpjs_number: bpjs_number ? encrypt(bpjs_number) : null,
                branch_id,
            },
        });

        return this.formatPatient(patient);
    }

    static async findAll(branchId: string, search: string = '', page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;
        const where: any = { branch_id: branchId };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
            ];
        }

        const [patients, total] = await Promise.all([
            prisma.patient.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
            }),
            prisma.patient.count({ where }),
        ]);

        return {
            data: patients.map(p => this.formatPatient(p)),
            total,
            page,
            last_page: Math.ceil(total / limit),
        };
    }

    static async findById(id: string) {
        const patient = await prisma.patient.findUnique({
            where: { id },
            include: {
                examinations: {
                    include: { prescriptions: { include: { details: true } } },
                    orderBy: { created_at: 'desc' },
                },
            },
        });

        if (!patient) throw new Error('Patient not found');
        return this.formatPatient(patient);
    }

    static async update(id: string, data: any) {
        const { nik, name, birth_date, phone, address, bpjs_number, gender } = data;
        const updateData: any = { name, phone, address, gender };
        
        if (nik) updateData.nik = encrypt(nik);
        if (birth_date) updateData.birth_date = new Date(birth_date);
        if (bpjs_number) updateData.bpjs_number = encrypt(bpjs_number);

        const patient = await prisma.patient.update({
            where: { id },
            data: updateData,
        });

        return this.formatPatient(patient);
    }

    private static formatPatient(patient: any) {
        return {
            ...patient,
            nik: decrypt(patient.nik),
            bpjs_number: decrypt(patient.bpjs_number),
        };
    }
}
