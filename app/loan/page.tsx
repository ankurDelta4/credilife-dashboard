"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable, Column } from "@/components/data-table"
import { LoanApprovalModal } from "@/components/loan-approval-modal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Filter } from "lucide-react"

interface Loan {
  id: string
  userId: string
  amount: number
  status: string
  interestRate: number | string
  termMonths: number | string
  repaymentType: string
  createdAt: string
  updatedAt: string
  endDate: string
}

const loanColumns: Column[] = [
  { key: "userId", label: "Customer" },
  { key: "amount", label: "Principal Amount" },
  { key: "status", label: "Status", width: "120px" },
  { key: "interestRate", label: "Interest Amount" },
  { key: "termMonths", label: "Tenure" },
  { key: "repaymentType", label: "Repayment Type" },
  { key: "createdAt", label: "Created Date" },
]

export default function LoanPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLoans()
  }, [])

  const fetchLoans = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/loans?type=loans&limit=100')
      const data = await response.json()
      
      if (data.success) {
        setLoans(data.data.loans || [])
      } else {
        setError(data.error || 'Failed to fetch loans')
      }
    } catch (err) {
      setError('Failed to fetch loans')
      console.error('Error fetching loans:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredLoans = loans.filter((loan) => {
    const matchesSearch = loan.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || loan.status === statusFilter

    return matchesSearch && matchesStatus
  })


  const handleNewLoan = () => {
    console.log("Create new loan")
  }

  const handleRowClick = (loan: Loan) => {
    setSelectedLoan(loan)
    setIsModalOpen(true)
  }

  const handleApprove = async (loan: Loan) => {
    try {
      // TODO: Add API call to approve loan
      // const response = await fetch(`/api/loans/${loan.id}/approve`, { method: 'POST' })
      
      setLoans(prevLoans =>
        prevLoans.map(l =>
          l.id === loan.id ? { ...l, status: "active" } : l
        )
      )
      console.log("Loan approved:", loan.id)
    } catch (error) {
      console.error("Error approving loan:", error)
    }
  }

  const handleReject = async (loan: Loan) => {
    try {
      // TODO: Add API call to reject loan
      // const response = await fetch(`/api/loans/${loan.id}/reject`, { method: 'POST' })
      
      setLoans(prevLoans =>
        prevLoans.map(l =>
          l.id === loan.id ? { ...l, status: "rejected" } : l
        )
      )
      console.log("Loan rejected:", loan.id)
    } catch (error) {
      console.error("Error rejecting loan:", error)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedLoan(null)
  }

  const getStatusCounts = () => {
    return {
      all: loans.length,
      active: loans.filter(l => l.status === "active").length,
      pending: loans.filter(l => l.status === "pending").length,
      overdue: loans.filter(l => l.status === "overdue").length,
      completed: loans.filter(l => l.status === "completed").length,
      rejected: loans.filter(l => l.status === "rejected").length,
    }
  }

  const statusCounts = getStatusCounts()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Loan Management</h1>
            <p className="text-muted-foreground">
              Manage and track all loan applications and active loans.
            </p>
          </div>
          <Button onClick={handleNewLoan}>
            <Plus className="mr-2 h-4 w-4" />
            New Loan Application
          </Button>
        </div>

        <div className="flex flex-wrap gap-4">
          {Object.entries(statusCounts).map(([status, count]) => (
            <Badge
              key={status}
              variant={statusFilter === status ? "default" : "secondary"}
              className="cursor-pointer capitalize"
              onClick={() => setStatusFilter(status)}
            >
              {status.replace("_", " ")}: {count}
            </Badge>
          ))}
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search loans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Loans ({filteredLoans.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-muted-foreground">Loading loans...</div>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-red-500">{error}</div>
              </div>
            ) : (
              <DataTable
                columns={loanColumns}
                data={filteredLoans}
                onRowClick={handleRowClick}
              />
            )}
          </CardContent>
        </Card>

        <LoanApprovalModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          loan={selectedLoan}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </div>
    </DashboardLayout>
  )
}