import { useState, useCallback } from 'react';
import { usersService, User, CreateUserRequest, UpdateUserRequest, PaginationParams } from '../users';
import { ApiError } from '../api';

interface UsersState {
    users: User[];
    isLoading: boolean;
    error: string | null;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    } | null;
}

export const useUsers = () => {
    const [state, setState] = useState<UsersState>({
        users: [],
        isLoading: false,
        error: null,
        pagination: null,
    });

    const fetchUsers = useCallback(async (params?: PaginationParams) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = await usersService.getUsers(params);

            if (response.success && response.data) {
                setState({
                    users: response.data.data,
                    pagination: response.data.pagination,
                    isLoading: false,
                    error: null,
                });
                return response.data;
            } else {
                throw new Error(response.error || 'Failed to fetch users');
            }
        } catch (error) {
            const errorMessage = error instanceof ApiError ? error.message : 'Failed to fetch users';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));
            throw error;
        }
    }, []);

    const getUser = useCallback(async (id: number) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = await usersService.getUser(id);

            if (response.success && response.data) {
                setState(prev => ({ ...prev, isLoading: false }));
                return response.data.user;
            } else {
                throw new Error(response.error || 'Failed to fetch user');
            }
        } catch (error) {
            const errorMessage = error instanceof ApiError ? error.message : 'Failed to fetch user';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));
            throw error;
        }
    }, []);

    const createUser = useCallback(async (userData: CreateUserRequest) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = await usersService.createUser(userData);

            if (response.success && response.data) {
                // Add new user to the list
                setState(prev => ({
                    ...prev,
                    users: [...prev.users, response.data!.user],
                    isLoading: false,
                }));
                return response.data.user;
            } else {
                throw new Error(response.error || 'Failed to create user');
            }
        } catch (error) {
            const errorMessage = error instanceof ApiError ? error.message : 'Failed to create user';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));
            throw error;
        }
    }, []);

    const updateUser = useCallback(async (id: number, userData: UpdateUserRequest) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = await usersService.updateUser(id, userData);

            if (response.success && response.data) {
                // Update user in the list
                setState(prev => ({
                    ...prev,
                    users: prev.users.map(user =>
                        user.id === id ? response.data!.user : user
                    ),
                    isLoading: false,
                }));
                return response.data.user;
            } else {
                throw new Error(response.error || 'Failed to update user');
            }
        } catch (error) {
            const errorMessage = error instanceof ApiError ? error.message : 'Failed to update user';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));
            throw error;
        }
    }, []);

    const deleteUser = useCallback(async (id: number) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = await usersService.deleteUser(id);

            if (response.success && response.data) {
                // Remove user from the list
                setState(prev => ({
                    ...prev,
                    users: prev.users.filter(user => user.id !== id),
                    isLoading: false,
                }));
                return response.data.user;
            } else {
                throw new Error(response.error || 'Failed to delete user');
            }
        } catch (error) {
            const errorMessage = error instanceof ApiError ? error.message : 'Failed to delete user';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));
            throw error;
        }
    }, []);

    const searchUsers = useCallback(async (searchTerm: string) => {
        return fetchUsers({ search: searchTerm });
    }, [fetchUsers]);

    const getUsersByStatus = useCallback(async (status: 'active' | 'inactive') => {
        return fetchUsers({ status });
    }, [fetchUsers]);

    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    return {
        ...state,
        fetchUsers,
        getUser,
        createUser,
        updateUser,
        deleteUser,
        searchUsers,
        getUsersByStatus,
        clearError,
    };
};
