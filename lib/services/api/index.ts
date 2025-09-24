// Base API configuration and utilities

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// API Response types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    code?: string;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    userId?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// API Error class
export class ApiError extends Error {
    code: string;
    status: number;

    constructor(message: string, code: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.status = status;
    }
}

// Base fetch function with error handling
export async function apiRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultHeaders: any = {
        'Content-Type': 'application/json',
    };

    // Add authorization header if token exists
    const token = localStorage.getItem('auth_token');
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new ApiError(
                data.error || 'Request failed',
                data.code || 'UNKNOWN_ERROR',
                response.status
            );
        }

        return data;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        // Network or other errors
        throw new ApiError(
            'Network error or server unavailable',
            'NETWORK_ERROR',
            0
        );
    }
}

// HTTP method helpers
export const api = {
    get: <T = any>(endpoint: string, params?: Record<string, any>) => {
        const url = new URL(`${API_BASE_URL}${endpoint}`);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.append(key, value.toString());
                }
            });
        }
        return apiRequest<T>(url.pathname + url.search);
    },

    post: <T = any>(endpoint: string, data?: any) =>
        apiRequest<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        }),

    put: <T = any>(endpoint: string, data?: any) =>
        apiRequest<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        }),

    delete: <T = any>(endpoint: string) =>
        apiRequest<T>(endpoint, {
            method: 'DELETE',
        }),
};

// Utility functions
export const buildQueryString = (params: Record<string, any>): string => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, value.toString());
        }
    });

    return searchParams.toString();
};

// Token management
export const tokenManager = {
    setToken: (token: string) => {
        localStorage.setItem('auth_token', token);
    },

    getToken: () => {
        return localStorage.getItem('auth_token');
    },

    removeToken: () => {
        localStorage.removeItem('auth_token');
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('auth_token');
    },
};
