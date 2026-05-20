
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const orders = await prisma.order.findMany({
        include: {
            patient: true,
            bpjs_claim: true,
            payments: true
        }
    });
    
    orders.forEach(o => {
        const isBpjs = o.payments.some(p => p.method === 'bpjs');
        console.log(`Order ID: ${o.id}, Patient: ${o.patient.name}, Method BPJS: ${isBpjs}, Has Claim: ${!!o.bpjs_claim}`);
    });
}

main().finally(() => prisma.$disconnect());
