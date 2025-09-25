export interface LoanCalculation {
  principal: number
  tenureInMonths: number
  repaymentFrequency: string
  interestRateMonthly: string
  closingFee: number
  totalInterest: number
  totalRepayment: number
  installments: number
  installmentAmount: number
}

export function calculateInstallments(
  principal: number, 
  tenureInMonths: number, 
  repaymentFrequency: string, 
  monthlyRate: number = 0.20, 
  closingFeeRate: number = 0.05
): LoanCalculation {
  // Closing fee = % of principal
  const closingFee = principal * closingFeeRate;

  // Total interest = principal * monthlyRate * tenure
  const totalInterest = principal * monthlyRate * tenureInMonths;

  // Total repayment = principal + interest + closing fee
  const totalRepayment = principal + totalInterest + closingFee;

  // Decide number of installments based on frequency
  let installments = 0;
  if (repaymentFrequency === "monthly") {
    installments = tenureInMonths;
  } else if (repaymentFrequency === "bi-weekly") {
    installments = tenureInMonths * 2;
  } else if (repaymentFrequency === "weekly") {
    installments = tenureInMonths * 4;
  } else {
    throw new Error("Invalid repayment frequency. Use: weekly, bi-weekly, or monthly.");
  }

  // Installment amount
  const installmentAmount = totalRepayment / installments;

  return {
    principal: Number(principal.toFixed(2)),
    tenureInMonths: Number(tenureInMonths),
    repaymentFrequency,
    interestRateMonthly: (monthlyRate * 100).toFixed(2) + "%",
    closingFee: Number(closingFee.toFixed(2)),
    totalInterest: Number(totalInterest.toFixed(2)),
    totalRepayment: Number(totalRepayment.toFixed(2)),
    installments,
    installmentAmount: Number(installmentAmount.toFixed(2))
  };
}