
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SupplierService {
    static async getAll() {
        return await prisma.supplier.findMany({
            orderBy: { name: 'asc' }
        });
    }

    static async getById(id: string) {
        return await prisma.supplier.findUnique({
            where: { id },
            include: {
                frames: true,
                lenses: true
            }
        });
    }

    static async create(data: any) {
        return await prisma.supplier.create({
            data: {
                name: data.name,
                contact_person: data.contact_person,
                phone: data.phone,
                email: data.email,
                address: data.address
            }
        });
    }

    static async update(id: string, data: any) {
        return await prisma.supplier.update({
            where: { id },
            data: {
                name: data.name,
                contact_person: data.contact_person,
                phone: data.phone,
                email: data.email,
                address: data.address
            }
        });
    }

    static async delete(id: string) {
        return await prisma.supplier.delete({
            where: { id }
        });
    }
}
