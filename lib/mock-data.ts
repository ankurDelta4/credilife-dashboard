export interface Loan extends Record<string, unknown> {
  id: string
  customerName: string
  name: string // Alias for customerName to match "Name" column
  amount: number
  loanAmount: number // Alias for amount to match "Loan Amount" column
  interestRate: number
  term: number
  installments: number // New field for installments
  status: "active" | "pending" | "overdue" | "completed" | "rejected"
  startDate: Date
  createdTime: Date // Alias for startDate to match "Created Time" column
  endDate: Date
  monthlyPayment: number
  remainingBalance: number
}

export interface Customer extends Record<string, unknown> {
  id: string
  name: string
  email: string
  phone: string
  creditScore: number
  totalLoans: number
  status: "active" | "pending" | "rejected"
  joinDate: Date
}

export interface Application extends Record<string, unknown> {
  id: string
  customerName: string
  email: string
  amount: number
  purpose: string
  status: "pending" | "approved" | "rejected"
  submitDate: Date
  creditScore: number
}

export interface RecentActivity extends Record<string, unknown> {
  id: string
  type: "loan_approved" | "payment_received" | "application_submitted" | "loan_overdue"
  description: string
  timestamp: Date
  amount?: number
}

export const mockLoans: Loan[] = [
  {
    id: "L001",
    customerName: "Alice Johnson",
    name: "Alice Johnson",
    amount: 50000,
    loanAmount: 50000,
    interestRate: 5.5,
    term: 36,
    installments: 36,
    status: "active",
    startDate: new Date("2024-01-15"),
    createdTime: new Date("2024-01-15"),
    endDate: new Date("2027-01-15"),
    monthlyPayment: 1512,
    remainingBalance: 42000,
  },
  {
    id: "L002",
    customerName: "Bob Smith",
    name: "Bob Smith",
    amount: 25000,
    loanAmount: 25000,
    interestRate: 6.2,
    term: 24,
    installments: 24,
    status: "overdue",
    startDate: new Date("2023-06-10"),
    createdTime: new Date("2023-06-10"),
    endDate: new Date("2025-06-10"),
    monthlyPayment: 1108,
    remainingBalance: 8500,
  },
  {
    id: "L003",
    customerName: "Carol Davis",
    name: "Carol Davis",
    amount: 75000,
    loanAmount: 75000,
    interestRate: 4.8,
    term: 60,
    installments: 60,
    status: "active",
    startDate: new Date("2024-03-20"),
    createdTime: new Date("2024-03-20"),
    endDate: new Date("2029-03-20"),
    monthlyPayment: 1407,
    remainingBalance: 68000,
  },
  {
    id: "L004",
    customerName: "David Wilson",
    name: "David Wilson",
    amount: 30000,
    loanAmount: 30000,
    interestRate: 7.1,
    term: 18,
    installments: 18,
    status: "pending",
    startDate: new Date("2024-09-01"),
    createdTime: new Date("2024-09-01"),
    endDate: new Date("2026-03-01"),
    monthlyPayment: 1845,
    remainingBalance: 30000,
  },
  {
    id: "L005",
    customerName: "Eva Brown",
    name: "Eva Brown",
    amount: 15000,
    loanAmount: 15000,
    interestRate: 5.0,
    term: 12,
    installments: 12,
    status: "completed",
    startDate: new Date("2023-01-10"),
    createdTime: new Date("2023-01-10"),
    endDate: new Date("2024-01-10"),
    monthlyPayment: 1283,
    remainingBalance: 0,
  },
]

export const mockCustomers: Customer[] = [
  {
    id: "C001",
    name: "Alice Johnson",
    email: "alice.johnson@email.com",
    phone: "+1 (555) 123-4567",
    creditScore: 785,
    totalLoans: 2,
    status: "active",
    joinDate: new Date("2023-12-15"),
  },
  {
    id: "C002",
    name: "Bob Smith",
    email: "bob.smith@email.com",
    phone: "+1 (555) 234-5678",
    creditScore: 650,
    totalLoans: 1,
    status: "active",
    joinDate: new Date("2023-05-20"),
  },
  {
    id: "C003",
    name: "Carol Davis",
    email: "carol.davis@email.com",
    phone: "+1 (555) 345-6789",
    creditScore: 820,
    totalLoans: 1,
    status: "active",
    joinDate: new Date("2024-02-10"),
  },
  {
    id: "C004",
    name: "David Wilson",
    email: "david.wilson@email.com",
    phone: "+1 (555) 456-7890",
    creditScore: 720,
    totalLoans: 1,
    status: "pending",
    joinDate: new Date("2024-08-25"),
  },
  {
    id: "C005",
    name: "Eva Brown",
    email: "eva.brown@email.com",
    phone: "+1 (555) 567-8901",
    creditScore: 760,
    totalLoans: 1,
    status: "active",
    joinDate: new Date("2022-11-30"),
  },
]

export const mockApplications: Application[] = [
  {
    id: "A001",
    customerName: "Frank Miller",
    email: "frank.miller@email.com",
    amount: 40000,
    purpose: "Home Improvement",
    status: "pending",
    submitDate: new Date("2024-09-15"),
    creditScore: 680,
  },
  {
    id: "A002",
    customerName: "Grace Lee",
    email: "grace.lee@email.com",
    amount: 22000,
    purpose: "Debt Consolidation",
    status: "approved",
    submitDate: new Date("2024-09-10"),
    creditScore: 750,
  },
  {
    id: "A003",
    customerName: "Henry Clark",
    email: "henry.clark@email.com",
    amount: 60000,
    purpose: "Business Expansion",
    status: "pending",
    submitDate: new Date("2024-09-18"),
    creditScore: 710,
  },
  {
    id: "A004",
    customerName: "Iris Martinez",
    email: "iris.martinez@email.com",
    amount: 15000,
    purpose: "Auto Purchase",
    status: "rejected",
    submitDate: new Date("2024-09-05"),
    creditScore: 580,
  },
]

export const mockRecentActivity: RecentActivity[] = [
  {
    id: "RA001",
    type: "payment_received",
    description: "Payment received from Alice Johnson",
    timestamp: new Date("2024-09-19T10:30:00"),
    amount: 1512,
  },
  {
    id: "RA002",
    type: "application_submitted",
    description: "New loan application from Frank Miller",
    timestamp: new Date("2024-09-19T09:15:00"),
    amount: 40000,
  },
  {
    id: "RA003",
    type: "loan_approved",
    description: "Loan approved for Grace Lee",
    timestamp: new Date("2024-09-18T16:45:00"),
    amount: 22000,
  },
  {
    id: "RA004",
    type: "loan_overdue",
    description: "Bob Smith's payment is overdue",
    timestamp: new Date("2024-09-18T14:20:00"),
    amount: 1108,
  },
  {
    id: "RA005",
    type: "payment_received",
    description: "Payment received from Carol Davis",
    timestamp: new Date("2024-09-18T11:30:00"),
    amount: 1407,
  },
]