"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable, Column } from "@/components/data-table"
import { LoanDetailsModal } from "@/components/loan-details-modal"
import { QuestionFlowModal } from "@/components/question-flow-modal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CustomerSearchInput } from "@/components/customer-search-input"
import { useToast } from "@/components/ui/use-toast"
import { calculateInstallments } from "@/lib/utils/loan-calculations"
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
  const [isQuestionFlowOpen, setIsQuestionFlowOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [basicLoanData, setBasicLoanData] = useState({
    user_id: '',
    user_name: '',
    requested_amount: '',
    tenure: '',
    repayment_type: 'monthly',
    interest_amount: 0,
    principal_amount: 0,
    closing_fees: 0,
    total_repayment: 0,
    id_number: '',
    questions_count: 0,
    is_renewal: false
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
    setBasicLoanData({
      user_id: '',
      user_name: '',
      requested_amount: '',
      tenure: '',
      repayment_type: 'monthly',
      interest_amount: 0,
      principal_amount: 0,
      closing_fees: 0,
      total_repayment: 0,
      id_number: '',
      questions_count: 0,
      is_renewal: false
    })
    setIsNewLoanModalOpen(true)
  }

  const handleBasicDataSubmit = () => {
    // Validate basic loan data
    if (!basicLoanData.user_id || !basicLoanData.requested_amount || !basicLoanData.tenure) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields: Customer, Requested Amount, and Tenure"
      })
      return
    }

    // Validate amount range
    const amount = parseFloat(basicLoanData.requested_amount)
    if (amount < 2500 || amount > 30000) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Requested amount must be between $2,500 and $30,000"
      })
      return
    }

    try {
      // Calculate loan details
      const calculation = calculateInstallments(
        amount,
        parseFloat(basicLoanData.tenure),
        basicLoanData.repayment_type
      )

      // Update basic loan data with calculations
      const updatedLoanData = {
        ...basicLoanData,
        principal_amount: calculation.principal,
        interest_amount: calculation.totalInterest,
        closing_fees: calculation.closingFee,
        total_repayment: calculation.totalRepayment
      }
      
      setBasicLoanData(updatedLoanData)
      
      // Close basic form and open question flow
      setIsNewLoanModalOpen(false)
      setIsQuestionFlowOpen(true)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Calculation Error",
        description: "Failed to calculate loan details. Please check your input."
      })
    }
  }

  const handleQuestionFlowSubmit = (questionFlowData: any) => {
    // This function is now handled in QuestionFlowModal
    // Just close the modal and refresh the loans
    setIsQuestionFlowOpen(false)
    fetchLoans()
    
    toast({
      variant: "success",
      title: "Success!",
      description: "Loan application has been submitted successfully."
    })
  }

  const handleFormChange = (field: string, value: string | boolean) => {
    setBasicLoanData(prev => ({ ...prev, [field]: value }))
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

        {/* Basic Loan Data Modal */}
        <Dialog open={isNewLoanModalOpen} onOpenChange={setIsNewLoanModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Loan Application - Basic Details</DialogTitle>
              <DialogDescription>
                Enter basic loan information, then we'll guide you through customer questions
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <CustomerSearchInput
                value={basicLoanData.user_id}
                onChange={(userId, userName) => {
                  handleFormChange('user_id', userId)
                  handleFormChange('user_name', userName)
                }}
                label="Select Customer"
                required
              />

              <div className="space-y-2">
                <Label htmlFor="requested_amount">Requested Amount * (Min: $2,500 - Max: $30,000)</Label>
                <Input
                  id="requested_amount"
                  type="number"
                  min="2500"
                  max="30000"
                  placeholder="2500"
                  value={basicLoanData.requested_amount}
                  onChange={(e) => handleFormChange('requested_amount', e.target.value)}
                />
              </div>


              <div className="space-y-2">
                <Label htmlFor="tenure">Tenure *</Label>
                <Select value={basicLoanData.tenure} onValueChange={(value) => handleFormChange('tenure', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenure" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem value="6">6 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="repayment_type">Repayment Type</Label>
                <Select value={basicLoanData.repayment_type} onValueChange={(value) => handleFormChange('repayment_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select repayment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                  </SelectContent>
                </Select>
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
                onClick={handleBasicDataSubmit}
              >
                Continue to Questions
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Question Flow Modal */}
        <QuestionFlowModal
          isOpen={isQuestionFlowOpen}
          onClose={() => setIsQuestionFlowOpen(false)}
          onSubmit={handleQuestionFlowSubmit}
          isLoading={isCreating}
          initialLoanData={basicLoanData}
          onSuccess={() => {
            setIsQuestionFlowOpen(false)
            fetchLoans()
          }}
          onError={(error) => {
            toast({
              variant: "destructive",
              title: "Submission Failed",
              description: error || "Failed to create loan application"
            })
          }}
        />

      </div>
    </DashboardLayout>
  )
}