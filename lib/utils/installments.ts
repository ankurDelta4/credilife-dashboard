import { addMonths, addWeeks, addDays, format } from 'date-fns';

export interface Installment {
  loan_id: string;
  installment_number: number;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  paid_at: string | null;
  payment_verified: boolean;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  created_at: string;
  updated_at: string;
}

export interface LoanDetails {
  id: string;
  principal_amount: number;
  interest_amount?: number;
  total_repayment: number;
  tenure: string; // "3" or "6" months only
  repayment_type: 'monthly' | 'bi-weekly' | 'weekly' | 'daily';
  start_date: string;
  closing_fees?: number;
  monthly_rate?: number; // Default 0.20 (20%)
  closing_fee_rate?: number; // Default 0.05 (5%)
}

/**
 * Calculate the number of installments based on tenure and repayment type
 * Matches your business logic exactly
 */
export function calculateNumberOfInstallments(
  tenureMonths: number,
  repaymentType: string
): number {
  switch (repaymentType) {
    case 'monthly':
      return tenureMonths;
    case 'bi-weekly':
      // 2 payments per month
      return tenureMonths * 2;
    case 'weekly':
      // 4 payments per month
      return tenureMonths * 4;
    case 'daily':
      // Approximately 30 payments per month
      return tenureMonths * 30;
    default:
      return tenureMonths; // Default to monthly
  }
}

/**
 * Calculate the installment amount
 */
export function calculateInstallmentAmount(
  totalRepayment: number,
  numberOfInstallments: number
): number {
  // Round to 2 decimal places
  return Math.round((totalRepayment / numberOfInstallments) * 100) / 100;
}

/**
 * Generate installments for a loan (supports 3 and 6 month loans only)
 * Uses the same calculation logic as provided
 */
export function generateInstallments(loan: LoanDetails): Omit<Installment, 'id'>[] {
  const installments: Omit<Installment, 'id'>[] = [];
  
  // Validate tenure - only 3 or 6 months are allowed
  const tenureMonths = parseInt(loan.tenure);
  if (tenureMonths !== 3 && tenureMonths !== 6) {
    console.warn(`Invalid tenure ${tenureMonths}. Defaulting to 3 months.`);
  }
  
  const validTenure = (tenureMonths === 3 || tenureMonths === 6) ? tenureMonths : 3;
  
  // Use provided rates or defaults
  const monthlyRate = loan.monthly_rate || 0.20; // 20% monthly interest default
  const closingFeeRate = loan.closing_fee_rate || 0.05; // 5% closing fee default
  
  // Calculate fees and total repayment if not provided
  let totalRepayment = loan.total_repayment;
  if (!totalRepayment) {
    const closingFee = loan.principal_amount * closingFeeRate;
    const totalInterest = loan.principal_amount * monthlyRate * validTenure;
    totalRepayment = loan.principal_amount + totalInterest + closingFee;
  }
  
  const numberOfInstallments = calculateNumberOfInstallments(
    validTenure,
    loan.repayment_type
  );
  
  // Calculate installment amount
  const installmentAmount = calculateInstallmentAmount(
    loan.total_repayment,
    numberOfInstallments
  );
  
  // Start generating installments from the loan start date
  const startDate = new Date(loan.start_date);
  const currentDate = new Date().toISOString();
  
  for (let i = 0; i < numberOfInstallments; i++) {
    let dueDate: Date;
    
    // Calculate due date based on repayment type
    switch (loan.repayment_type) {
      case 'monthly':
        dueDate = addMonths(startDate, i + 1);
        break;
      case 'bi-weekly':
        dueDate = addWeeks(startDate, (i + 1) * 2);
        break;
      case 'weekly':
        dueDate = addWeeks(startDate, i + 1);
        break;
      case 'daily':
        dueDate = addDays(startDate, i + 1);
        break;
      default:
        dueDate = addMonths(startDate, i + 1);
    }
    
    // Adjust the last installment to account for any rounding differences
    let amountDue = installmentAmount;
    if (i === numberOfInstallments - 1) {
      // Calculate the remaining amount for the last installment
      const totalPreviousInstallments = installmentAmount * (numberOfInstallments - 1);
      amountDue = Math.round((loan.total_repayment - totalPreviousInstallments) * 100) / 100;
    }
    
    installments.push({
      loan_id: loan.id,
      installment_number: i + 1,
      due_date: format(dueDate, 'yyyy-MM-dd'),
      amount_due: amountDue,
      amount_paid: 0,
      paid_at: null,
      payment_verified: false,
      status: 'pending',
      created_at: currentDate,
      updated_at: format(new Date(), 'yyyy-MM-dd'),
    });
  }
  
  return installments;
}

/**
 * Create installments in the database
 */
export async function createInstallmentsInDatabase(
  installments: Omit<Installment, 'id'>[],
  backendUrl: string,
  apiKey: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Batch create all installments
    const response = await fetch(`${backendUrl}/installments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(installments),
    });
    
    if (response.ok) {
      // Check if response has content
      const responseText = await response.text();
      let data = null;
      
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          // If JSON parsing fails but request was successful, that's okay
          console.log(`Successfully created ${installments.length} installments (no response body)`);
          return { success: true, data: installments };
        }
      }
      
      console.log(`Successfully created ${installments.length} installments`);
      return { success: true, data: data || installments };
    } else {
      const errorText = await response.text();
      console.error('Failed to create installments:', errorText);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error('Error creating installments:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Format installment for display
 */
export function formatInstallmentForDisplay(installment: Installment & { installment_number: number; status: string }) {
  return {
    number: `#${installment.installment_number}`,
    dueDate: format(new Date(installment.due_date), 'MMM dd, yyyy'),
    amountDue: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(installment.amount_due),
    amountPaid: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(installment.amount_paid),
    status: installment.status,
    isPaid: installment.payment_verified,
    paidDate: installment.paid_at ? format(new Date(installment.paid_at), 'MMM dd, yyyy') : null,
  };
}