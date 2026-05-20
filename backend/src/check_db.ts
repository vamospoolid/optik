
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const branches = await prisma.branch.findMany();
    console.log('Branches:', branches.length);
    
    const users = await prisma.user.findMany();
    console.log('Users:', users.length);
    
    const frames = await prisma.frame.findMany({
        include: { stocks: true, supplier: true }
    });
    console.log('Frames:', frames.length);
    if (frames.length > 0) {
        console.log('Frame 0 stocks:', frames[0].stocks);
    }
    
    const lenses = await prisma.lens.findMany({
        include: { stocks: true, supplier: true }
    });
    console.log('Lenses:', lenses.length);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
