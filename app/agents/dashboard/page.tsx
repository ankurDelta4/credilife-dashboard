"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Users, TrendingUp, DollarSign, Search, Phone, Mail, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'

interface Loan {
  id: string
  principal_amount: number
  total_repayment: number
  amount_paid: number
  outstanding: number
  start_date: string
  end_date: string
  status: string
  created_at: string
}

interface Customer {
  id: string
  name: string
  email: string
  phone_number: string
  unique_id: string
  customer_since: string
  total_loans: number
  active_loans: number
  total_principal: number
  total_paid: number
  total_due: number
  outstanding_balance: number
  loans: Loan[]
}

interface Summary {
  total_customers: number
  total_active_loans: number
  total_outstanding: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AgentDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [summary, setSummary] = useState<Summary>({
    total_customers: 0,
    total_active_loans: 0,
    total_outstanding: 0
  })
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null)

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Separate effect for auth checks
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (!authLoading && user && user.role !== 'agent') {
      router.push('/')
      return
    }
  }, [user, isAuthenticated, authLoading, router])

  const fetchCustomers = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError('')

    try {
      const queryParams = new URLSearchParams({
        agent_id: user.id,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(debouncedSearch && { search: debouncedSearch })
      })

      const response = await fetch(`/api/agents/my-customers?${queryParams}`)
      const data = await response.json()

      if (data.success) {
        setCustomers(data.data.customers)
        setSummary(data.data.summary)
        // Only update pagination metadata if total or totalPages changed
        setPagination(prev => ({
          ...prev,
          total: data.data.pagination.total,
          totalPages: data.data.pagination.totalPages
        }))
      } else {
        setError(data.error || 'Failed to fetch customers')
      }
    } catch (err) {
      console.error('Error fetching customers:', err)
      setError('Failed to load customer data')
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [user, pagination.page, pagination.limit, debouncedSearch])

  // Fetch customers when search or page changes
  useEffect(() => {
    if (user && user.role === 'agent') {
      fetchCustomers()
    }
  }, [user, fetchCustomers])

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    // Reset to page 1 when searching
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const toggleCustomerExpanded = (customerId: string) => {
    setExpandedCustomerId(expandedCustomerId === customerId ? null : customerId)
  }

  if (authLoading || initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Customers</h1>
        <p className="text-gray-600 mt-1">
          Welcome, {user?.name}. Manage your assigned customers and track their loan performance.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_customers}</div>
            <p className="text-xs text-muted-foreground">
              Assigned to you
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_active_loans}</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.total_outstanding)}</div>
            <p className="text-xs text-muted-foreground">
              Across all customers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>View and manage your assigned customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by email or unique ID..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Customers Table */}
          <div className="rounded-md border relative">
            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-md">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Active Loans</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      {searchTerm ? 'No customers found matching your search' : 'No customers assigned yet'}
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <>
                      <TableRow key={customer.id} className="cursor-pointer hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div>
                            <div>{customer.name}</div>
                            <div className="text-xs text-gray-500">
                              ID: {customer.unique_id}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="text-xs">{customer.email}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span className="text-xs">{customer.phone_number}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">
                            {customer.active_loans} / {customer.total_loans}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <div>
                            <div className="text-red-600">{formatCurrency(customer.outstanding_balance)}</div>
                            <div className="text-xs text-gray-500">
                              of {formatCurrency(customer.total_due)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {customer.active_loans > 0 ? (
                            <Badge className="bg-green-500">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleCustomerExpanded(customer.id)}
                          >
                            {expandedCustomerId === customer.id ? 'Hide' : 'View'} Loans
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Loan Details */}
                      {expandedCustomerId === customer.id && customer.loans.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-gray-50 p-4">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm mb-3">Loan History</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {customer.loans.map((loan) => (
                                  <Card key={loan.id} className="border-gray-200">
                                    <CardContent className="pt-4">
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between items-center">
                                          <span className="font-medium">Loan #{loan.id.substring(0, 8)}</span>
                                          <Badge variant={loan.status === 'running' ? 'default' : 'secondary'}>
                                            {loan.status}
                                          </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                          <div>
                                            <span className="text-gray-500">Principal:</span>
                                            <div className="font-medium">{formatCurrency(loan.principal_amount)}</div>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Total Due:</span>
                                            <div className="font-medium">{formatCurrency(loan.total_repayment)}</div>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Paid:</span>
                                            <div className="font-medium text-green-600">{formatCurrency(loan.amount_paid)}</div>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Outstanding:</span>
                                            <div className="font-medium text-red-600">{formatCurrency(loan.outstanding)}</div>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Start Date:</span>
                                            <div>{formatDate(loan.start_date)}</div>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">End Date:</span>
                                            <div>{formatDate(loan.end_date)}</div>
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} customers
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first, last, current, and adjacent pages
                      return (
                        page === 1 ||
                        page === pagination.totalPages ||
                        Math.abs(page - pagination.page) <= 1
                      )
                    })
                    .map((page, index, array) => {
                      // Add ellipsis
                      const showEllipsisBefore = index > 0 && page - array[index - 1] > 1
                      return (
                        <>
                          {showEllipsisBefore && <span className="px-2">...</span>}
                          <Button
                            key={page}
                            variant={pagination.page === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        </>
                      )
                    })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  )
}
