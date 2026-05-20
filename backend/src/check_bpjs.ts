
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const claims = await prisma.bpjsClaim.findMany({
        include: {
            patient: true
        }
    });
    console.log('Total Claims:', claims.length);
    claims.forEach(c => {
        console.log(`ID: ${c.id}, Status: ${c.status}, Patient: ${c.patient.name}, Branch: ${c.patient.branch_id}`);
    });
    
    const branches = await prisma.branch.findMany();
    console.log('Branches:', branches.map(b => b.id));
}

main().finally(() => prisma.$disconnect());
