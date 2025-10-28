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
import { Plus, Search, Filter, ChevronLeft, ChevronRight, Download, X, Loader2 } from "lucide-react"
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
  // Removed users array - using search instead
  const [isCreating, setIsCreating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  // Search functionality
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [loanFormData, setLoanFormData] = useState({
    // User selection
    user_selection: 'existing', // 'existing' or 'new'
    selected_user_id: '',
    
    // User data (for new users or editing existing)
    first_name: '',
    last_name: '',
    id_number: '',
    email: '',
    whatsapp_number: '',
    phone: '',
    address: '',
    password: '', // Password for new user creation
    
    // Loan application data
    requested_amount: '',
    loan_purpose: '',
    tenure: '',
    repayment_type: 'monthly',
    
    // Payment schedule
    payment_frequency: 'monthly',
    payment_day_1: '',
    payment_day_2: '',
    
    // Calculated fields
    interest_rate: '10', // Default 10%
    principal_amount: '',
    interest_amount: '',
    closing_fees: '',
    total_repayment: ''
  })
  const { toast } = useToast()
  const itemsPerPage = 10

  useEffect(() => {
    fetchLoans()
    // Don't fetch all users anymore - we'll use search instead
  }, [])

  // Search users with debounce
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    if (!userSearchQuery || userSearchQuery.length < 1) {
      setSearchResults([])
      return
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(userSearchQuery)}&limit=10`)
        const data = await response.json()
        if (data.success) {
          setSearchResults(data.users || [])
        }
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300) // 300ms debounce

    setSearchTimeout(timeout)

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [userSearchQuery])

  // Select user from search
  const selectUser = (user: any) => {
    setSelectedUser(user)
    setUserSearchQuery('')
    setSearchResults([])
    
    // Update form data
    setLoanFormData(prev => ({
      ...prev,
      selected_user_id: user.id.toString(),
      first_name: user.name?.split(' ')[0] || '',
      last_name: user.name?.split(' ').slice(1).join(' ') || '',
      email: user.email,
      whatsapp_number: user.phone_number || '',
      phone: user.phone_number || '',
      id_number: user.unique_id || ''
    }))
  }

  // Clear selected user
  const clearSelectedUser = () => {
    setSelectedUser(null)
    setLoanFormData(prev => ({
      ...prev,
      selected_user_id: '',
      first_name: '',
      last_name: '',
      email: '',
      whatsapp_number: '',
      phone: '',
      id_number: '',
      password: ''
    }))
  }

  // Handle Enter key for quick selection
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      selectUser(searchResults[0])
    }
  }


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
      user_selection: 'existing',
      selected_user_id: '',
      first_name: '',
      last_name: '',
      id_number: '',
      email: '',
      whatsapp_number: '',
      phone: '',
      address: '',
      password: '',
      requested_amount: '',
      loan_purpose: '',
      tenure: '',
      repayment_type: 'monthly',
      payment_frequency: 'monthly',
      payment_day_1: '',
      payment_day_2: '',
      interest_rate: '10',
      principal_amount: '',
      interest_amount: '',
      closing_fees: '',
      total_repayment: ''
    })
    setIsNewLoanModalOpen(true)
  }

  const handleLoanSubmit = async () => {
    console.log('Loan form data:', loanFormData)
    
    // Validate based on user selection
    if (loanFormData.user_selection === 'existing' && !loanFormData.selected_user_id) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a customer"
      })
      return
    }
    
    if (loanFormData.user_selection === 'new') {
      if (!loanFormData.first_name || !loanFormData.last_name || !loanFormData.email || !loanFormData.whatsapp_number || !loanFormData.password) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please fill in all customer details including password"
        })
        return
      }
    }
    
    if (!loanFormData.requested_amount || !loanFormData.tenure || !loanFormData.payment_frequency || !loanFormData.payment_day_1) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all loan details"
      })
      return
    }
    
    if (loanFormData.payment_frequency === 'biweekly' && !loanFormData.payment_day_2) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select second payment day for bi-weekly schedule"
      })
      return
    }
    
    setIsCreating(true)
    
    try {
      // Prepare user data (including payment schedule)
      let userData = {}
      let userId = ''
      
      if (loanFormData.user_selection === 'existing') {
        // Use the selected user's data (already populated in form)
        if (selectedUser) {
          // Use the actual user's ID from the database
          userId = selectedUser.id
          userData = {
            first_name: loanFormData.first_name,
            last_name: loanFormData.last_name,
            email: loanFormData.email,
            whatsapp_number: loanFormData.whatsapp_number,
            phone: loanFormData.phone,
            id_number: loanFormData.id_number,
            // Add payment schedule to user_data
            payment_frequency: loanFormData.payment_frequency,
            payment_day_1: loanFormData.payment_day_1,
            payment_day_2: loanFormData.payment_day_2
          }
        }
      } else {
        // New user - First create user in Supabase auth function
        try {
          // Call Supabase auth function to create user
          const supabaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co'
          const supabaseAnonKey = process.env.NEXT_PUBLIC_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4amZxdmRocGhrdWd1dGtvdmFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgyMTEzMjMsImV4cCI6MjA0Mzc4NzMyM30.sLdFz4jnaQVkBBrPqUMF92Yl_uPDDpc_0VjNXIIjmSI'
          
          const authResponse = await fetch(`${supabaseUrl}/functions/v1/auth`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'apikey': supabaseAnonKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: `${loanFormData.first_name} ${loanFormData.last_name}`,
              phone_number: loanFormData.whatsapp_number,
              role: 'user',
              email: loanFormData.email,
              unique_id: '', // Let the backend handle unique_id generation
              action: 'login', // Using login as it handles both signup and login
              password: loanFormData.password
            })
          })
          
          if (!authResponse.ok) {
            const errorData = await authResponse.json()
            throw new Error(errorData.message || 'Failed to create user account')
          }
          
          const authData = await authResponse.json()
          console.log('User created successfully:', authData)
          
          // Use the created user's ID and unique_id from response
          userId = authData.user?.id || crypto.randomUUID()
          const uniqueId = authData.user?.unique_id || ''
          
          userData = {
            first_name: loanFormData.first_name,
            last_name: loanFormData.last_name,
            email: loanFormData.email,
            whatsapp_number: loanFormData.whatsapp_number,
            phone: loanFormData.phone || loanFormData.whatsapp_number,
            id_number: loanFormData.id_number,
            address: loanFormData.address,
            unique_id: uniqueId,
            // Add payment schedule to user_data
            payment_frequency: loanFormData.payment_frequency,
            payment_day_1: loanFormData.payment_day_1,
            payment_day_2: loanFormData.payment_day_2
          }
        } catch (error) {
          toast({
            variant: "destructive",
            title: "User Creation Failed",
            description: error instanceof Error ? error.message : "Failed to create user account"
          })
          setIsCreating(false)
          return
        }
      }
      
      // Calculate loan amounts
      const principal = parseFloat(loanFormData.requested_amount)
      const interestRate = parseFloat(loanFormData.interest_rate) / 100
      const interestAmount = principal * interestRate
      const closingFees = principal * 0.02 // 2% closing fees
      const totalRepayment = principal + interestAmount + closingFees
      
      // Prepare loan application data - ONLY use actual column names
      const applicationData = {
        user_id: userId,
        requested_amount: principal || 0,
        loan_purpose: loanFormData.loan_purpose || 'Personal Loan',
        status: 'pending',
        current_stage: 'application_submitted',
        is_renewal: false,
        interest_amount: interestAmount || 0,
        principal_amount: principal || 0,
        closing_fees: closingFees || 0,
        total_repayment: totalRepayment || 0,
        user_data: userData, // This will be stringified by the API
        tenure: parseInt(loanFormData.tenure) || 12,
        repayment_type: loanFormData.repayment_type || 'monthly',
        id_number: loanFormData.id_number ? parseInt(loanFormData.id_number) : null,
        questions_count: 0
      }
      
      console.log('Creating loan application:', applicationData)
      
      const response = await fetch('/api/loan-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData)
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
        throw new Error(data.error || 'Failed to create loan application')
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create loan application"
      })
    } finally {
      setIsCreating(false)
    }
  }


  const handleFormChange = (field: string, value: string) => {
    setLoanFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      // Calculate loan amounts when amount or rate changes
      if (field === 'requested_amount' || field === 'interest_rate') {
        const principal = parseFloat(updated.requested_amount) || 0
        const rate = parseFloat(updated.interest_rate) / 100 || 0
        updated.principal_amount = principal.toString()
        updated.interest_amount = (principal * rate).toFixed(2)
        updated.closing_fees = (principal * 0.02).toFixed(2) // 2% closing fees
        updated.total_repayment = (principal + (principal * rate) + (principal * 0.02)).toFixed(2)
      }
      
      return updated
    })
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

        {/* New Loan Application Modal */}
        <Dialog open={isNewLoanModalOpen} onOpenChange={setIsNewLoanModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Loan Application</DialogTitle>
              <DialogDescription>
                Create a new loan application for a customer
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Customer Selection */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold text-sm">Customer Information</h3>
                
                <div className="flex gap-4">
                  <Label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="existing"
                      checked={loanFormData.user_selection === 'existing'}
                      onChange={(e) => handleFormChange('user_selection', e.target.value)}
                    />
                    Select Existing Customer
                  </Label>
                  <Label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="new"
                      checked={loanFormData.user_selection === 'new'}
                      onChange={(e) => handleFormChange('user_selection', e.target.value)}
                    />
                    Create New Customer
                  </Label>
                </div>

                {loanFormData.user_selection === 'existing' ? (
                  <div className="space-y-2">
                    <Label htmlFor="user_search">Search Customer by Unique ID or Name *</Label>
                    <div className="relative">
                      <Input
                        id="user_search"
                        type="text"
                        placeholder="Type unique ID (e.g., K9P2X5) or name..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                      />
                      
                      {/* Search Results Dropdown */}
                      {userSearchQuery && searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                          {searchResults.map((user) => (
                            <div
                              key={user.id}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => selectUser(user)}
                            >
                              <div className="font-medium">{user.unique_id} - {user.name}</div>
                              <div className="text-sm text-gray-500">{user.phone_number}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {userSearchQuery && isSearching && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg p-4">
                          <div className="flex items-center justify-center">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Searching...
                          </div>
                        </div>
                      )}
                      
                      {userSearchQuery && !isSearching && searchResults.length === 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg p-4">
                          <div className="text-sm text-gray-500">No customers found</div>
                        </div>
                      )}
                    </div>
                    
                    {/* Selected User Display */}
                    {selectedUser && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">ID: {selectedUser.unique_id}</p>
                            <p className="text-sm">{selectedUser.name}</p>
                            <p className="text-sm text-gray-600">{selectedUser.email}</p>
                            <p className="text-sm text-gray-600">{selectedUser.phone_number}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => clearSelectedUser()}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        type="text"
                        placeholder="John"
                        value={loanFormData.first_name}
                        onChange={(e) => handleFormChange('first_name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name *</Label>
                      <Input
                        id="last_name"
                        type="text"
                        placeholder="Doe"
                        value={loanFormData.last_name}
                        onChange={(e) => handleFormChange('last_name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={loanFormData.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter password"
                        value={loanFormData.password}
                        onChange={(e) => handleFormChange('password', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp_number">WhatsApp Number *</Label>
                      <Input
                        id="whatsapp_number"
                        type="tel"
                        placeholder="+1234567890"
                        value={loanFormData.whatsapp_number}
                        onChange={(e) => handleFormChange('whatsapp_number', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="id_number">ID Number</Label>
                      <Input
                        id="id_number"
                        type="text"
                        placeholder="12345678901"
                        value={loanFormData.id_number}
                        onChange={(e) => handleFormChange('id_number', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        type="text"
                        placeholder="123 Main St"
                        value={loanFormData.address}
                        onChange={(e) => handleFormChange('address', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Loan Details */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold text-sm">Loan Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="requested_amount">Requested Amount *</Label>
                    <Input
                      id="requested_amount"
                      type="number"
                      placeholder="5000"
                      value={loanFormData.requested_amount}
                      onChange={(e) => handleFormChange('requested_amount', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loan_purpose">Loan Purpose</Label>
                    <Input
                      id="loan_purpose"
                      type="text"
                      placeholder="Personal Loan"
                      value={loanFormData.loan_purpose}
                      onChange={(e) => handleFormChange('loan_purpose', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenure">Tenure (Months) *</Label>
                    <Select
                      value={loanFormData.tenure}
                      onValueChange={(value) => handleFormChange('tenure', value)}
                    >
                      <SelectTrigger id="tenure">
                        <SelectValue placeholder="Select tenure" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 Months</SelectItem>
                        <SelectItem value="6">6 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interest_rate">Interest Rate (%) *</Label>
                    <Input
                      id="interest_rate"
                      type="number"
                      placeholder="10"
                      value={loanFormData.interest_rate}
                      onChange={(e) => handleFormChange('interest_rate', e.target.value)}
                    />
                  </div>
                </div>

                {/* Calculated Amounts */}
                {loanFormData.requested_amount && (
                  <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm">
                      <span className="font-medium">Principal:</span> ${loanFormData.principal_amount || '0'}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Interest:</span> ${loanFormData.interest_amount || '0'}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Closing Fees:</span> ${loanFormData.closing_fees || '0'}
                    </div>
                    <div className="text-sm font-semibold">
                      <span>Total Repayment:</span> ${loanFormData.total_repayment || '0'}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Schedule */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold text-sm">Payment Schedule</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment_frequency">Payment Frequency *</Label>
                    <Select
                      value={loanFormData.payment_frequency}
                      onValueChange={(value) => handleFormChange('payment_frequency', value)}
                    >
                      <SelectTrigger id="payment_frequency">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly (Twice a month)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="repayment_type">Repayment Type *</Label>
                    <Select
                      value={loanFormData.repayment_type}
                      onValueChange={(value) => handleFormChange('repayment_type', value)}
                    >
                      <SelectTrigger id="repayment_type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

              <div className="grid grid-cols-2 gap-4">
                {loanFormData.payment_frequency === 'monthly' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="payment_day_1">Payment Due Day *</Label>
                      <Select
                        value={loanFormData.payment_day_1}
                        onValueChange={(value) => handleFormChange('payment_day_1', value)}
                      >
                        <SelectTrigger id="payment_day_1">
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(28)].map((_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              Day {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Payment will be due on day {loanFormData.payment_day_1 || '?'} of each month
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="payment_day_1">First Payment Day *</Label>
                      <Select
                        value={loanFormData.payment_day_1}
                        onValueChange={(value) => handleFormChange('payment_day_1', value)}
                      >
                        <SelectTrigger id="payment_day_1">
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(15)].map((_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              Day {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        First payment of the month
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment_day_2">Second Payment Day *</Label>
                      <Select
                        value={loanFormData.payment_day_2}
                        onValueChange={(value) => handleFormChange('payment_day_2', value)}
                      >
                        <SelectTrigger id="payment_day_2">
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(13)].map((_, i) => (
                            <SelectItem key={i + 16} value={(i + 16).toString()}>
                              Day {i + 16}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Second payment of the month
                      </p>
                    </div>
                  </>
                )}
              </div>


                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm text-blue-800">
                    <strong>Payment Schedule:</strong>
                    {loanFormData.payment_frequency === 'monthly' ? (
                      <> Payments will be due on day {loanFormData.payment_day_1 || '?'} of each month.</>
                    ) : (
                      <> Payments will be due on days {loanFormData.payment_day_1 || '?'} and {loanFormData.payment_day_2 || '?'} of each month.</>
                    )}
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>Reminders:</strong> Notifications will be sent 7 and 3 days before each payment due date.
                  </p>
                </div>
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
                {isCreating ? 'Creating Application...' : 'Create Loan Application'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


      </div>
    </DashboardLayout>
  )
}