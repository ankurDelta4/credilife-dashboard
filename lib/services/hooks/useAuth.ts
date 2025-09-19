import { useState, useEffect, useCallback } from 'react';
import { authService, User } from '../auth';
import { ApiError } from '../api';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export const useAuth = () => {
    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
    });

    // Check authentication status on mount
    useEffect(() => {
        const checkAuth = async () => {
            if (!authService.isAuthenticated()) {
                setState(prev => ({ ...prev, isLoading: false }));
                return;
            }

            try {
                const response = await authService.getCurrentUser();
                if (response.success && response.data) {
                    setState({
                        user: response.data.user,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });
                } else {
                    // Token might be invalid, remove it
                    authService.logout();
                    setState({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: null,
                    });
                }
            } catch (error) {
                // Token might be invalid, remove it
                authService.logout();
                setState({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: error instanceof ApiError ? error.message : 'Authentication failed',
                });
            }
        };

        checkAuth();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = await authService.login(email, password);

            if (response.success && response.data) {
                setState({
                    user: response.data.user,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                });
                return response;
            } else {
                throw new Error(response.error || 'Login failed');
            }
        } catch (error) {
            const errorMessage = error instanceof ApiError ? error.message : 'Login failed';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));
            throw error;
        }
    }, []);

    const register = useCallback(async (email: string, password: string) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = await authService.register(email, password);

            if (response.success) {
                setState(prev => ({ ...prev, isLoading: false }));
                return response;
            } else {
                throw new Error(response.error || 'Registration failed');
            }
        } catch (error) {
            const errorMessage = error instanceof ApiError ? error.message : 'Registration failed';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));
            throw error;
        }
    }, []);

    const logout = useCallback(() => {
        authService.logout();
        setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
        });
    }, []);

    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    return {
        ...state,
        login,
        register,
        logout,
        clearError,
    };
};
