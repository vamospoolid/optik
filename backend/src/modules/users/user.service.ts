
import prisma from '../../config/database';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

export class UserService {
    static async findAll(branchId: string) {
        return prisma.user.findMany({
            where: { branch_id: branchId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                created_at: true
            }
        });
    }

    static async updateRole(userId: string, role: Role) {
        return prisma.user.update({
            where: { id: userId },
            data: { role }
        });
    }

    static async createStaff(data: { name: string, email: string, password_hash: string, role: Role, branch_id: string }) {
        const hashedPassword = await bcrypt.hash(data.password_hash, 10);
        return prisma.user.create({
            data: {
                ...data,
                password_hash: hashedPassword
            }
        });
    }

    static async deleteUser(userId: string) {
        return prisma.user.delete({
            where: { id: userId }
        });
    }
}
