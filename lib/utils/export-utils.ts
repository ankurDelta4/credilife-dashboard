export interface ExportData {
  [key: string]: any
}

export function convertToCSV(data: ExportData[], filename: string): void {
  if (!data || data.length === 0) {
    throw new Error('No data to export')
  }

  // Get all unique keys from all objects
  const allKeys = Array.from(
    new Set(data.flatMap(item => Object.keys(item)))
  )

  // Create CSV header
  const header = allKeys.join(',')

  // Create CSV rows
  const rows = data.map(item => {
    return allKeys.map(key => {
      const value = item[key]
      // Handle different data types
      if (value === null || value === undefined) {
        return ''
      }
      // Escape commas and quotes in strings
      if (typeof value === 'string') {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }
      return String(value)
    }).join(',')
  })

  // Combine header and rows
  const csvContent = [header, ...rows].join('\n')

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function exportUsers(users: ExportData[]): void {
  const processedUsers = users.map(user => ({
    ID: user.id,
    Name: user.name,
    Email: user.email,
    'Phone Number': user.phone_number || user.phoneNumber || 'N/A',
    Role: user.role,
    'Total Loans': user.totalLoans || 0,
    'Join Date': user.created_at ? new Date(user.created_at).toLocaleDateString() : user.createdAt,
    Status: user.status || 'Active'
  }))
  
  convertToCSV(processedUsers, 'users_export')
}

export function exportLoans(loans: ExportData[]): void {
  const processedLoans = loans.map(loan => ({
    'Loan ID': loan.id,
    'Customer ID': loan.userId || loan.user_id,
    'Customer Name': loan.customerName || loan.user_name || 'N/A',
    'Principal Amount': loan.amount || loan.principal_amount || loan.requested_amount,
    'Interest Amount': loan.interestRate || loan.interest_amount || 'N/A',
    'Total Repayment': loan.total_repayment || 'N/A',
    'Tenure (Months)': loan.termMonths || loan.tenure,
    'Repayment Type': loan.repaymentType || loan.repayment_type,
    Status: loan.status,
    'Created Date': loan.createdAt || (loan.created_at ? new Date(loan.created_at).toLocaleDateString() : 'N/A'),
    'End Date': loan.endDate || loan.end_date || 'N/A',
    'Closing Fees': loan.closing_fees || 'N/A'
  }))
  
  convertToCSV(processedLoans, 'loans_export')
}

export function exportLoanApplications(applications: ExportData[]): void {
  const processedApplications = applications.map(app => ({
    'Application ID': app.id,
    'Customer ID': app.user_id,
    'Customer Name': app.user_name || 'N/A',
    'Requested Amount': app.requested_amount,
    'Loan Purpose': app.loan_purpose || 'N/A',
    'Tenure (Months)': app.tenure,
    'Repayment Type': app.repayment_type,
    'Principal Amount': app.principal_amount,
    'Interest Amount': app.interest_amount,
    'Closing Fees': app.closing_fees,
    'Total Repayment': app.total_repayment,
    Status: app.status,
    'Current Stage': app.current_stage || 'N/A',
    'Questions Count': app.questions_count || 0,
    'Is Renewal': app.is_renewal ? 'Yes' : 'No',
    'Created Date': app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A',
    'Updated Date': app.updated_at ? new Date(app.updated_at).toLocaleDateString() : 'N/A'
  }))
  
  convertToCSV(processedApplications, 'loan_applications_export')
}

export function exportReceipts(receipts: ExportData[]): void {
  const processedReceipts = receipts.map(receipt => ({
    'Receipt ID': receipt.id,
    'Loan ID': receipt.loanId || receipt.loan_id,
    'Customer ID': receipt.customerId || receipt.customer_id || receipt.user_id,
    'Customer Name': receipt.customerName || receipt.customer_name || 'N/A',
    'Payment Amount': receipt.amount || receipt.payment_amount,
    'Payment Date': receipt.paymentDate || receipt.payment_date || receipt.date,
    'Payment Method': receipt.paymentMethod || receipt.payment_method || 'N/A',
    'Transaction ID': receipt.transactionId || receipt.transaction_id || 'N/A',
    Status: receipt.status || 'Completed',
    'Receipt Number': receipt.receiptNumber || receipt.receipt_number || 'N/A',
    Notes: receipt.notes || receipt.description || 'N/A',
    'Created Date': receipt.createdAt || (receipt.created_at ? new Date(receipt.created_at).toLocaleDateString() : 'N/A')
  }))
  
  convertToCSV(processedReceipts, 'receipts_export')
}

export interface ExportOptions {
  data: ExportData[]
  type: 'users' | 'loans' | 'applications' | 'receipts'
  customFilename?: string
}

export function bulkExport({ data, type, customFilename }: ExportOptions): void {
  if (!data || data.length === 0) {
    throw new Error(`No ${type} data available for export`)
  }

  switch (type) {
    case 'users':
      exportUsers(data)
      break
    case 'loans':
      exportLoans(data)
      break
    case 'applications':
      exportLoanApplications(data)
      break
    case 'receipts':
      exportReceipts(data)
      break
    default:
      throw new Error(`Unsupported export type: ${type}`)
  }
}