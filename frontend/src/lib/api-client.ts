import axios from 'axios';
import { getRefreshToken, setTokens, clearTokens } from './auth';

const getBaseURL = () => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!envUrl) return 'http://localhost:3001/api/v1';
    if (envUrl.endsWith('/api/v1')) return envUrl;
    if (envUrl.endsWith('/api')) return `${envUrl}/v1`;
    return `${envUrl.replace(/\/$/, '')}/api/v1`;
};

const apiClient = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    // We will typically handle access tokens centrally or pass them explicitly
    // This assumes token is stored in localStorage logically for an SPA-like feel, 
    // or managed via next-auth/cookies in a Next.js SSR context.
    // For simplicity in this demo, let's assume localStorage in browser.
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = getRefreshToken();
                if (!refreshToken) throw new Error('No refresh token');

                const res = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, {
                    refreshToken,
                });

                const { accessToken } = res.data;
                
                // Assuming client-side auth state
                if (typeof window !== 'undefined') {
                    localStorage.setItem('accessToken', accessToken);
                }

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                // Refresh failed, logout
                clearTokens();
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

export default apiClient;
