
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

import { encrypt } from './services/encryptionService';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Comprehensive Mock Data Seeding...');
    
    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. BRANCH
    const branch = await prisma.branch.upsert({
        where: { id: '00000000-0000-0000-0000-000000000001' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'Optik 88 Pusat',
            address: 'Jl. H. Andi Depu Ruko No. 1, Polewali',
            phone: '0821 8887 6686',
        },
    });

    // 2. USERS
    const admin = await prisma.user.upsert({
        where: { email: 'admin@optik88.com' },
        update: { branch_id: branch.id },
        create: {
            name: 'Administrator',
            email: 'admin@optik88.com',
            password_hash: passwordHash,
            role: 'admin',
            branch_id: branch.id,
        },
    });

    // 3. SUPPLIERS
    const suppliers = await Promise.all([
        prisma.supplier.create({
            data: {
                name: 'PT. Lensa Indonesia Jaya',
                contact_person: 'Budi Santoso',
                phone: '08123456789',
                email: 'budi@lensindo.com',
                address: 'Kawasan Industri Pulogadung, Jakarta'
            }
        }),
        prisma.supplier.create({
            data: {
                name: 'Global Frame Distribution',
                contact_person: 'Siska Putri',
                phone: '08771234567',
                email: 'sales@globalframe.id',
                address: 'Mangga Dua Square Lt. 2, Jakarta'
            }
        })
    ]);

    // 4. FRAMES
    const framesData = [
        { brand: 'Ray-Ban', model: 'Aviator Classic', color: 'Gold/Green', price: 1850000, supplier_id: suppliers[0].id },
        { brand: 'Oakley', model: 'Holbrook', color: 'Matte Black', price: 2100000, supplier_id: suppliers[0].id },
        { brand: 'Levis', model: 'LS0516', color: 'Gunmetal', price: 950000, supplier_id: suppliers[1].id },
        { brand: 'Police', model: 'SPL775', color: 'Black/Silver', price: 1450000, supplier_id: suppliers[1].id },
        { brand: 'Nike', model: '7115', color: 'Navy Blue', price: 1200000, supplier_id: suppliers[1].id },
    ];

    for (const f of framesData) {
        await prisma.frame.create({
            data: {
                ...f,
                stocks: {
                    create: { branch_id: branch.id, quantity: 15 }
                }
            }
        });
    }

    // 5. LENSES
    const lensesData: any[] = [
        { brand: 'Essilor', type: 'monofocal', feature: 'bluecromic', price: 750000, supplier_id: suppliers[0].id },
        { brand: 'Hoya', type: 'progressive', feature: 'photochromic', price: 1250000, supplier_id: suppliers[0].id },
        { brand: 'Zeiss', type: 'monofocal', feature: 'blue_protect', price: 950000, supplier_id: suppliers[0].id },
        { brand: 'KODAK', type: 'bifocal', feature: 'normal', price: 450000, supplier_id: suppliers[1].id },
    ];

    for (const l of lensesData) {
        await prisma.lens.create({
            data: {
                ...l,
                stocks: {
                    create: { branch_id: branch.id, quantity: 25 }
                }
            }
        });
    }

    // 6. PATIENTS
    const patients = await Promise.all([
        prisma.patient.create({
            data: {
                name: 'Ahmad Astoni',
                nik: encrypt('7376010101850001'),
                phone: '085244556677',
                address: 'Jl. Ahmad Yani No. 10, Polewali',
                gender: 'male',
                birth_date: new Date('1985-01-01'),
                branch_id: branch.id
            }
        }),
        prisma.patient.create({
            data: {
                name: 'Siti Aminah',
                nik: encrypt('7376010202900002'),
                phone: '081233445566',
                address: 'Kec. Wonomulyo, Polman',
                gender: 'female',
                birth_date: new Date('1990-02-02'),
                branch_id: branch.id
            }
        }),
        prisma.patient.create({
            data: {
                name: 'Budi Raharjo',
                nik: encrypt('7376010303750003'),
                phone: '081399887766',
                address: 'Jl. Trans Sulawesi, Majene',
                gender: 'male',
                birth_date: new Date('1975-03-03'),
                branch_id: branch.id
            }
        })
    ]);

    // 7. PRESCRIPTIONS
    const examination = await prisma.eyeExamination.create({
        data: {
            patient_id: patients[0].id,
            doctor_name: 'Dr. Ahmad',
            source: 'internal',
            notes: 'Pemeriksaan rutin'
        }
    });

    const prescription = await prisma.prescription.create({
        data: {
            exam_id: examination.id,
            type: 'monofocal',
            pd: 64,
            details: {
                create: [
                    { eye: 'R', sph: -1.50, cyl: -0.50, axis: 90 },
                    { eye: 'L', sph: -1.25, cyl: 0, axis: 0 }
                ]
            }
        }
    });

    // 8. ORDERS & INVOICES (Completed Transaction)
    const order1 = await prisma.order.create({
        data: {
            patient_id: patients[1].id,
            total_amount: 1200000,
            status: 'completed',
            items: {
                create: [
                    { product_type: 'frame', price: 950000, qty: 1 },
                    { product_type: 'service', price: 250000, qty: 1 }
                ]
            },
            invoices: {
                create: {
                    invoice_number: 'INV-20260317-0001',
                    total_amount: 1200000,
                    dp_amount: 1200000,
                    remaining: 0
                }
            },
            payments: {
                create: {
                    method: 'cash',
                    amount: 1200000
                }
            }
        }
    });

    // 9. ORDERS (Pending Transaction with DP)
    const order2 = await prisma.order.create({
        data: {
            patient_id: patients[2].id,
            total_amount: 2500000,
            status: 'processed',
            items: {
                create: [
                    { product_type: 'frame', price: 1850000, qty: 1 },
                    { product_type: 'lens', price: 650000, qty: 1 }
                ]
            },
            invoices: {
                create: {
                    invoice_number: 'INV-20260317-0002',
                    total_amount: 2500000,
                    dp_amount: 500000,
                    remaining: 2000000
                }
            },
            payments: {
                create: {
                    method: 'debit',
                    amount: 500000
                }
            }
        }
    });

    console.log('✅ Comprehensive Mock Data Seeded Successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
