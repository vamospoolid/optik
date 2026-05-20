import { create } from 'zustand';
import { clearTokens, setTokens } from '../lib/auth';
import apiClient from '../lib/api-client';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    branch_id?: string;
    branch: any;
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    login: (tokens: { accessToken: string; refreshToken: string }, user: User) => void;
    logout: () => void;
    fetchUser: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    login: (tokens, user) => {
        setTokens(tokens.accessToken, tokens.refreshToken);
        set({ user, isLoading: false });
    },
    logout: () => {
        clearTokens();
        set({ user: null, isLoading: false });
    },
    fetchUser: async () => {
        set({ isLoading: true });
        try {
            const res = await apiClient.get('/auth/me');
            set({ user: res.data, isLoading: false });
        } catch (error) {
            clearTokens();
            set({ user: null, isLoading: false });
        }
    },
}));
