
import { PrismaClient } from '@prisma/client';
import { encrypt } from './services/encryptionService';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Seeding BPJS Sample Claims...');

    // 1. Get Patients
    const patients = await prisma.patient.findMany({
        take: 3,
        include: { examinations: { include: { prescriptions: true } } }
    });

    if (patients.length < 2) {
        console.error('❌ Not enough patients found. Please run main seed first.');
        return;
    }

    // 2. Ensure Patients have BPJS numbers (encrypted)
    await prisma.patient.update({
        where: { id: patients[0].id },
        data: { bpjs_number: encrypt('0001234567890') }
    });
    await prisma.patient.update({
        where: { id: patients[1].id },
        data: { bpjs_number: encrypt('0009876543210') }
    });

    // 3. Get or Create Prescriptions
    let rx1 = patients[0].examinations[0]?.prescriptions[0];
    if (!rx1) {
        const exam = await prisma.eyeExamination.create({
            data: {
                patient_id: patients[0].id,
                doctor_name: 'Dr. Sample Optik',
                source: 'internal',
                prescriptions: {
                    create: {
                        type: 'monofocal',
                        pd: 62,
                        details: {
                            create: [
                                { eye: 'R', sph: -1.0, axis: 0 },
                                { eye: 'L', sph: -1.0, axis: 0 }
                            ]
                        }
                    }
                }
            },
            include: { prescriptions: true }
        });
        rx1 = exam.prescriptions[0];
    }

    let rx2 = patients[1].examinations[0]?.prescriptions[0];
    if (!rx2) {
        const exam = await prisma.eyeExamination.create({
            data: {
                patient_id: patients[1].id,
                doctor_name: 'Dr. Sample Optik',
                source: 'internal',
                prescriptions: {
                    create: {
                        type: 'bifocal',
                        pd: 64,
                        details: {
                            create: [
                                { eye: 'R', sph: -2.0, axis: 0 },
                                { eye: 'L', sph: -2.0, axis: 0 }
                            ]
                        }
                    }
                }
            },
            include: { prescriptions: true }
        });
        rx2 = exam.prescriptions[0];
    }

    // 4. Create Claims
    const claimsData = [
        { patient_id: patients[0].id, prescription_id: rx1.id, status: 'submitted', claim_date: new Date() },
        { patient_id: patients[1].id, prescription_id: rx2.id, status: 'submitted', claim_date: new Date() },
        { patient_id: patients[0].id, prescription_id: rx1.id, status: 'draft' },
        { patient_id: patients[1].id, prescription_id: rx2.id, status: 'approved' },
        { patient_id: patients[0].id, prescription_id: rx1.id, status: 'paid' },
    ];

    for (const claim of claimsData) {
        await prisma.bpjsClaim.create({
            data: claim as any
        });
    }

    console.log('✅ BPJS Sample Claims Seeded Successfully!');
    console.log('Summary: 2 Submitted, 1 Draft, 1 Approved, 1 Paid');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
