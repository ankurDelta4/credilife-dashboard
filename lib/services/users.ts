import { api, ApiResponse, PaginatedResponse } from './api';

interface PaginationParams {
    page?: number;
    limit?: number;
}

// Types
export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    status: 'active' | 'inactive';
    createdAt: string;
}

export interface CreateUserRequest {
    name: string;
    email: string;
    role?: string;
    status?: 'active' | 'inactive';
}

export interface UpdateUserRequest {
    name?: string;
    email?: string;
    role?: string;
    status?: 'active' | 'inactive';
}

export interface UsersResponse extends PaginatedResponse<User> { }

// Users service
export const usersService = {
    // Get all users with optional filters
    async getUsers(params?: PaginationParams): Promise<ApiResponse<UsersResponse>> {
        return api.get<UsersResponse>('/users', params);
    },

    // Get user by ID
    async getUser(id: number): Promise<ApiResponse<{ user: User }>> {
        return api.get<{ user: User }>(`/users/${id}`);
    },

    // Create new user
    async createUser(userData: CreateUserRequest): Promise<ApiResponse<{ user: User }>> {
        return api.post<{ user: User }>('/users', userData);
    },

    // Update user
    async updateUser(id: number, userData: UpdateUserRequest): Promise<ApiResponse<{ user: User }>> {
        return api.put<{ user: User }>(`/users/${id}`, userData);
    },

    // Delete user
    async deleteUser(id: number): Promise<ApiResponse<{ user: User }>> {
        return api.delete<{ user: User }>(`/users/${id}`);
    },

    // Get users by status
    async getUsersByStatus(status: 'active' | 'inactive'): Promise<ApiResponse<UsersResponse>> {
        return this.getUsers({ status });
    },

    // Search users
    async searchUsers(searchTerm: string): Promise<ApiResponse<UsersResponse>> {
        return this.getUsers({ search: searchTerm });
    },
};
