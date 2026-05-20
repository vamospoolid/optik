
import bcrypt from 'bcrypt';
import prisma from '../../config/database';
import { generateAccessToken, generateRefreshToken } from '../../config/auth';

export class AuthService {
    static async login(email: string, password: string) {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { branch: true },
        });

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            throw new Error('Invalid email or password');
        }

        const payload = { 
            id: user.id, 
            email: user.email, 
            role: user.role, 
            branch_id: user.branch_id 
        };

        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken({ id: user.id });

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                branch_id: user.branch_id,
                branch: user.branch,
            },
        };
    }

    static async getProfile(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { branch: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            branch_id: user.branch_id,
            branch: user.branch,
        };
    }
}
