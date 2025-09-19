import { api, ApiResponse, tokenManager } from './api';

// Types
export interface User {
    id: number;
    email: string;
    role: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

// Authentication service
export const authService = {
    // Login user
    async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
        const response = await api.post<AuthResponse>('/auth', {
            action: 'login',
            email,
            password,
        });

        if (response.success && response.data) {
            // Store token in localStorage
            tokenManager.setToken(response.data.token);
        }

        return response;
    },

    // Register user
    async register(email: string, password: string): Promise<ApiResponse<{ user: User }>> {
        return api.post<{ user: User }>('/auth', {
            action: 'register',
            email,
            password,
        });
    },

    // Get current user info
    async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
        return api.get<{ user: User }>('/auth');
    },

    // Logout user
    logout(): void {
        tokenManager.removeToken();
    },

    // Check if user is authenticated
    isAuthenticated(): boolean {
        return tokenManager.isAuthenticated();
    },

    // Get stored token
    getToken(): string | null {
        return tokenManager.getToken();
    },
};
