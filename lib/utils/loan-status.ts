/**
 * Loan Status Workflow Management
 * Handles the progression of loans through different statuses
 */

export type LoanStatus = 'created' | 'pending' | 'verification' | 'approved' | 'declined';

export interface StatusTransition {
  from: LoanStatus;
  to: LoanStatus;
  allowed: boolean;
  requiresAction?: string;
}

export interface LoanStatusInfo {
  status: LoanStatus;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  nextStatuses: LoanStatus[];
  icon: string;
}

// Define the loan status workflow
export const LOAN_STATUS_WORKFLOW: Record<LoanStatus, LoanStatusInfo> = {
  created: {
    status: 'created',
    label: 'Created',
    description: 'Loan application has been created but not yet submitted',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    nextStatuses: ['pending'],
    icon: '📝'
  },
  pending: {
    status: 'pending',
    label: 'Pending',
    description: 'Loan application submitted and awaiting initial review',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    nextStatuses: ['verification', 'declined'],
    icon: '⏳'
  },
  verification: {
    status: 'verification',
    label: 'Under Verification',
    description: 'Application is being verified and documents are being reviewed',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    nextStatuses: ['approved', 'declined'],
    icon: '🔍'
  },
  approved: {
    status: 'approved',
    label: 'Approved',
    description: 'Loan application has been approved and loan is active',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    nextStatuses: [],
    icon: '✅'
  },
  declined: {
    status: 'declined',
    label: 'Declined',
    description: 'Loan application has been declined',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    nextStatuses: [],
    icon: '❌'
  }
};

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(from: LoanStatus, to: LoanStatus): boolean {
  const fromStatus = LOAN_STATUS_WORKFLOW[from];
  return fromStatus.nextStatuses.includes(to);
}

/**
 * Get all possible next statuses for a current status
 */
export function getNextStatuses(currentStatus: LoanStatus): LoanStatus[] {
  return LOAN_STATUS_WORKFLOW[currentStatus]?.nextStatuses || [];
}

/**
 * Get status information
 */
export function getStatusInfo(status: LoanStatus): LoanStatusInfo {
  return LOAN_STATUS_WORKFLOW[status];
}

/**
 * Validate and transition loan status
 */
export function transitionLoanStatus(
  currentStatus: LoanStatus,
  newStatus: LoanStatus,
  userId?: string,
  reason?: string
): {
  success: boolean;
  error?: string;
  transition?: {
    from: LoanStatus;
    to: LoanStatus;
    timestamp: Date;
    userId?: string;
    reason?: string;
  };
} {
  // Check if transition is valid
  if (!isValidStatusTransition(currentStatus, newStatus)) {
    return {
      success: false,
      error: `Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed transitions: ${getNextStatuses(currentStatus).join(', ')}`
    };
  }

  // Valid transition
  return {
    success: true,
    transition: {
      from: currentStatus,
      to: newStatus,
      timestamp: new Date(),
      userId,
      reason
    }
  };
}

/**
 * Get the complete workflow path
 */
export function getWorkflowPath(): LoanStatus[] {
  return ['created', 'pending', 'verification', 'approved'];
}

/**
 * Get current step in workflow (for progress indication)
 */
export function getWorkflowStep(status: LoanStatus): number {
  const path = getWorkflowPath();
  return path.indexOf(status);
}

/**
 * Calculate workflow progress percentage
 */
export function getWorkflowProgress(status: LoanStatus): number {
  const path = getWorkflowPath();
  const currentStep = getWorkflowStep(status);
  
  if (currentStep === -1) return 0; // Declined or unknown status
  if (status === 'approved') return 100;
  
  return Math.round((currentStep / (path.length - 1)) * 100);
}

/**
 * Get status badge classes for UI
 */
export function getStatusBadgeClasses(status: LoanStatus): string {
  const info = getStatusInfo(status);
  return `${info.bgColor} ${info.color} px-2 py-1 rounded-full text-xs font-medium`;
}

/**
 * Log status change for audit trail
 */
export interface StatusChangeLog {
  loanId: string;
  from: LoanStatus;
  to: LoanStatus;
  timestamp: Date;
  userId?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export function createStatusChangeLog(
  loanId: string,
  from: LoanStatus,
  to: LoanStatus,
  userId?: string,
  reason?: string,
  metadata?: Record<string, any>
): StatusChangeLog {
  return {
    loanId,
    from,
    to,
    timestamp: new Date(),
    userId,
    reason,
    metadata
  };
}