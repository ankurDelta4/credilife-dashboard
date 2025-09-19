import { api, ApiResponse, PaginationParams, PaginatedResponse } from './api';

// Types
export interface Loan {
    id: number;
    userId: number;
    amount: number;
    purpose: string;
    status: 'pending' | 'approved' | 'rejected';
    interestRate: number;
    termMonths: number;
    monthlyPayment: number;
    createdAt: string;
    updatedAt: string;
    reason?: string;
}

export interface CreateLoanRequest {
    userId: number;
    amount: number;
    purpose: string;
    termMonths: number;
}

export interface UpdateLoanRequest {
    amount?: number;
    purpose?: string;
    termMonths?: number;
    status?: 'pending' | 'approved' | 'rejected';
}

export interface LoansResponse extends PaginatedResponse<Loan> { }

export interface LoanApprovalRequest {
    action: 'approve' | 'reject';
    reason?: string;
}

// Loans service
export const loansService = {
    // Get all loans with optional filters
    async getLoans(params?: PaginationParams): Promise<ApiResponse<LoansResponse>> {
        return api.get<LoansResponse>('/loans', params);
    },

    // Get loan by ID
    async getLoan(id: number): Promise<ApiResponse<{ loan: Loan }>> {
        return api.get<{ loan: Loan }>(`/loans/${id}`);
    },

    // Create new loan application
    async createLoan(loanData: CreateLoanRequest): Promise<ApiResponse<{ loan: Loan }>> {
        return api.post<{ loan: Loan }>('/loans', loanData);
    },

    // Update loan
    async updateLoan(id: number, loanData: UpdateLoanRequest): Promise<ApiResponse<{ loan: Loan }>> {
        return api.put<{ loan: Loan }>(`/loans/${id}`, loanData);
    },

    // Delete loan
    async deleteLoan(id: number): Promise<ApiResponse<{ loan: Loan }>> {
        return api.delete<{ loan: Loan }>(`/loans/${id}`);
    },

    // Approve loan
    async approveLoan(id: number): Promise<ApiResponse<{ loan: Loan }>> {
        return api.post<{ loan: Loan }>(`/loans/${id}/approve`, {
            action: 'approve'
        });
    },

    // Reject loan
    async rejectLoan(id: number, reason?: string): Promise<ApiResponse<{ loan: Loan }>> {
        return api.post<{ loan: Loan }>(`/loans/${id}/approve`, {
            action: 'reject',
            reason
        });
    },

    // Get loans by status
    async getLoansByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<ApiResponse<LoansResponse>> {
        return this.getLoans({ status });
    },

    // Get loans by user
    async getLoansByUser(userId: number): Promise<ApiResponse<LoansResponse>> {
        return this.getLoans({ userId: userId.toString() });
    },

    // Get pending loans (for admin approval)
    async getPendingLoans(): Promise<ApiResponse<LoansResponse>> {
        return this.getLoansByStatus('pending');
    },

    // Get approved loans
    async getApprovedLoans(): Promise<ApiResponse<LoansResponse>> {
        return this.getLoansByStatus('approved');
    },

    // Get rejected loans
    async getRejectedLoans(): Promise<ApiResponse<LoansResponse>> {
        return this.getLoansByStatus('rejected');
    },
};
