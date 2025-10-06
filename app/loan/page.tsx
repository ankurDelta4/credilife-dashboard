"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable, Column } from "@/components/data-table"
import { LoanDetailsModal } from "@/components/loan-details-modal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { bulkExport } from "@/lib/utils/export-utils"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Search, Filter, ChevronLeft, ChevronRight, Download } from "lucide-react"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
} from "@/components/ui/pagination"

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
  const [currentPage, setCurrentPage] = useState(1)
  const [isNewLoanModalOpen, setIsNewLoanModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [loanFormData, setLoanFormData] = useState({
    full_name: '',
    id_number: '',
    loan_amount: '',
    installment_amount: '',
    number_of_installments: '',
    installment_due_date: '',
    email: '',
    whatsapp: ''
  })
  const { toast } = useToast()
  const itemsPerPage = 10

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
    
    let matchesStatus = false
    if (statusFilter === "all") {
      matchesStatus = true
    } else if (statusFilter === "running") {
      matchesStatus = loan.status === "running" || loan.status === "active"
    } else if (statusFilter === "completed") {
      matchesStatus = loan.status === "completed" || loan.status === "settled"
    } else {
      matchesStatus = loan.status === statusFilter
    }

    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedLoans = filteredLoans.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])


  const handleNewLoan = () => {
    setLoanFormData({
      full_name: '',
      id_number: '',
      loan_amount: '',
      installment_amount: '',
      number_of_installments: '',
      installment_due_date: '',
      email: '',
      whatsapp: ''
    })
    setIsNewLoanModalOpen(true)
  }

  const handleLoanSubmit = async () => {
    // Validate loan data
    const { full_name, id_number, loan_amount, installment_amount, number_of_installments, installment_due_date, email, whatsapp } = loanFormData
    
    if (!full_name || !id_number || !loan_amount || !installment_amount || !number_of_installments || !installment_due_date || !email || !whatsapp) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields"
      })
      return
    }
    
    setIsCreating(true)
    
    try {
      // Create loan application
      const response = await fetch('/api/loan-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...loanFormData,
          status: 'pending',
          created_at: new Date().toISOString()
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          variant: "success",
          title: "Success!",
          description: "Loan application has been created successfully."
        })
        
        setIsNewLoanModalOpen(false)
        fetchLoans()
      } else {
        throw new Error(data.error || 'Failed to create loan')
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create loan"
      })
    } finally {
      setIsCreating(false)
    }
  }


  const handleFormChange = (field: string, value: string) => {
    setLoanFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleExportLoans = async () => {
    try {
      setIsExporting(true)
      
      if (filteredLoans.length === 0) {
        toast({
          variant: "destructive",
          title: "No Data",
          description: "No loans available to export"
        })
        return
      }
      
      bulkExport({
        data: filteredLoans,
        type: 'loans'
      })
      
      toast({
        variant: "success",
        title: "Export Successful",
        description: `Successfully exported ${filteredLoans.length} loans to CSV`
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export loans data"
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleRowClick = (loan: Loan) => {
    setSelectedLoan(loan)
    setIsModalOpen(true)
  }


  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedLoan(null)
  }

  const getStatusCounts = () => {
    return {
      all: loans.length,
      running: loans.filter(l => l.status === "running" || l.status === "active").length,
      completed: loans.filter(l => l.status === "completed" || l.status === "settled").length,
      terminated: loans.filter(l => l.status === "terminated").length,
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
          <div className="flex gap-2">
            <Button onClick={handleNewLoan}>
              <Plus className="mr-2 h-4 w-4" />
              New Loan Application
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportLoans}
              disabled={isExporting || filteredLoans.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
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
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
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
              <>
                <DataTable
                  columns={loanColumns}
                  data={paginatedLoans}
                  onRowClick={handleRowClick}
                />
                
                {totalPages > 1 && (
                  <div className="flex items-center justify-between py-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredLoans.length)} of {filteredLoans.length} loans
                    </div>
                    
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                        </PaginationItem>
                        
                        {[...Array(totalPages)].map((_, index) => {
                          const pageNum = index + 1
                          if (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                          ) {
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  onClick={() => handlePageChange(pageNum)}
                                  isActive={currentPage === pageNum}
                                  className="cursor-pointer"
                                  size="icon"
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            )
                          } else if (
                            pageNum === currentPage - 2 ||
                            pageNum === currentPage + 2
                          ) {
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )
                          }
                          return null
                        })}
                        
                        <PaginationItem>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
        <LoanDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          loan={selectedLoan}
        />

        {/* New Loan Modal */}
        <Dialog open={isNewLoanModalOpen} onOpenChange={setIsNewLoanModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Loan Registration</DialogTitle>
              <DialogDescription>
                Register a new loan for an existing client
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="John Doe"
                    value={loanFormData.full_name}
                    onChange={(e) => handleFormChange('full_name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id_number">ID Number (11 digits) *</Label>
                  <Input
                    id="id_number"
                    type="text"
                    placeholder="12345678901"
                    maxLength={11}
                    value={loanFormData.id_number}
                    onChange={(e) => handleFormChange('id_number', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="loan_amount">Loan Amount *</Label>
                  <Input
                    id="loan_amount"
                    type="number"
                    placeholder="5000"
                    value={loanFormData.loan_amount}
                    onChange={(e) => handleFormChange('loan_amount', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="installment_amount">Installment Amount *</Label>
                  <Input
                    id="installment_amount"
                    type="number"
                    placeholder="1000"
                    value={loanFormData.installment_amount}
                    onChange={(e) => handleFormChange('installment_amount', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number_of_installments">Number of Installments *</Label>
                  <Input
                    id="number_of_installments"
                    type="number"
                    placeholder="6"
                    value={loanFormData.number_of_installments}
                    onChange={(e) => handleFormChange('number_of_installments', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="installment_due_date">First Installment Due Date *</Label>
                  <Input
                    id="installment_due_date"
                    type="date"
                    value={loanFormData.installment_due_date}
                    onChange={(e) => handleFormChange('installment_due_date', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={loanFormData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp Number *</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder="+1234567890"
                    value={loanFormData.whatsapp}
                    onChange={(e) => handleFormChange('whatsapp', e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Email and WhatsApp will be used for sending payment reminders 7 and 3 days before the due date.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsNewLoanModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleLoanSubmit}
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Loan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


      </div>
    </DashboardLayout>
  )
}