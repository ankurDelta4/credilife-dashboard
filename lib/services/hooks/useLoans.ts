import { useState, useCallback } from 'react';
import { loansService, Loan, CreateLoanRequest, UpdateLoanRequest, PaginationParams } from '../loans';
import { ApiError } from '../api';

interface LoansState {
    loans: Loan[];
    isLoading: boolean;
    error: string | null;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    } | null;
}

export const useLoans = () => {
    const [state, setState] = useState<LoansState>({
        loans: [],
        isLoading: false,
        error: null,
        pagination: null,
    });

    const fetchLoans = useCallback(async (params?: PaginationParams) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = await loansService.getLoans(params);

            if (response.success && response.data) {
                setState({
                    loans: response.data.data,
                    pagination: response.data.pagination,
                    isLoading: false,
                    error: null,
                });
                return response.data;
            } else {
                throw new Error(response.error || 'Failed to fetch loans');
            }
        } catch (error) {
            const errorMessage = error instanceof ApiError ? error.message : 'Failed to fetch loans';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));
            throw error;
        }
    }, []);

    const getLoan = useCallback(async (id: number) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = await loansService.getLoan(id);

            if (response.success && response.data) {
                setState(prev => ({ ...prev, isLoading: false }));
                return response.data.loan;
            } else {
                throw new Error(response.error || 'Failed to fetch loan');
            }
        } catch (error) {
            const errorMessage = error instanceof ApiError ? error.message : 'Failed to fetch loan';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));
            throw error;
        }
    }, []);

    const createLoan = useCallback(async (loanData: CreateLoanRequest) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = await loansService.createLoan(loanData);

            if (response.success && response.data) {
                // Add new loan to the list
                setState(prev => ({
                    ...prev,
                    loans: [...prev.loans, response.data!.loan],
                    isLoading: false,
                }));
                return response.data.loan;
            } else {
                throw new Error(response.error || 'Failed to create loan');
            }
        } catch (error) {
            const errorMessage = error instanceof ApiError ? error.message : 'Failed to create loan';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));
            throw error;
        }
    }, []);

    const updateLoan = useCallback(async (id: number, loanData: UpdateLoanRequest) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = await loansService.updateLoan(id, loanData);

            if (response.success && response.data) {
                // Update loan in the list
                setState(prev => ({
                    ...prev,
                    loans: prev.loans.map(loan =>
                        loan.id === id ? response.data!.loan : loan
                    ),
                    isLoading: false,
                }));
                return response.data.loan;
            } else {
                throw new Error(response.error || 'Failed to update loan');
            }
        } catch (error) {
            const errorMessage = error instanceof ApiError ? error.message : 'Failed to update loan';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));
            throw error;
        }
    }, []);

    const deleteLoan = useCallback(async (id: number) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = await loansService.deleteLoan(id);

            if (response.success && response.data) {
                // Remove loan from the list
                setState(prev => ({
                    ...prev,
                    loans: prev.loans.filter(loan => loan.id !== id),
                    isLoading: false,
                }));
                return response.data.loan;
            } else {
                throw new Error(response.error || 'Failed to delete loan');
            }
        } catch (error) {
            const errorMessage = error instanceof ApiError ? error.message : 'Failed to delete loan';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));
            throw error;
        }
    }, []);

    const approveLoan = useCallback(async (id: number) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = await loansService.approveLoan(id);

            if (response.success && response.data) {
                // Update loan status in the list
                setState(prev => ({
                    ...prev,
                    loans: prev.loans.map(loan =>
                        loan.id === id ? response.data!.loan : loan
                    ),
                    isLoading: false,
                }));
                return response.data.loan;
            } else {
                throw new Error(response.error || 'Failed to approve loan');
            }
        } catch (error) {
            const errorMessage = error instanceof ApiError ? error.message : 'Failed to approve loan';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));
            throw error;
        }
    }, []);

    const rejectLoan = useCallback(async (id: number, reason?: string) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = await loansService.rejectLoan(id, reason);

            if (response.success && response.data) {
                // Update loan status in the list
                setState(prev => ({
                    ...prev,
                    loans: prev.loans.map(loan =>
                        loan.id === id ? response.data!.loan : loan
                    ),
                    isLoading: false,
                }));
                return response.data.loan;
            } else {
                throw new Error(response.error || 'Failed to reject loan');
            }
        } catch (error) {
            const errorMessage = error instanceof ApiError ? error.message : 'Failed to reject loan';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));
            throw error;
        }
    }, []);

    const getLoansByStatus = useCallback(async (status: 'pending' | 'approved' | 'rejected') => {
        return fetchLoans({ status });
    }, [fetchLoans]);

    const getLoansByUser = useCallback(async (userId: number) => {
        return fetchLoans({ userId: userId.toString() });
    }, [fetchLoans]);

    const getPendingLoans = useCallback(async () => {
        return getLoansByStatus('pending');
    }, [getLoansByStatus]);

    const getApprovedLoans = useCallback(async () => {
        return getLoansByStatus('approved');
    }, [getLoansByStatus]);

    const getRejectedLoans = useCallback(async () => {
        return getLoansByStatus('rejected');
    }, [getLoansByStatus]);

    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    return {
        ...state,
        fetchLoans,
        getLoan,
        createLoan,
        updateLoan,
        deleteLoan,
        approveLoan,
        rejectLoan,
        getLoansByStatus,
        getLoansByUser,
        getPendingLoans,
        getApprovedLoans,
        getRejectedLoans,
        clearError,
    };
};
