"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable, Column } from "@/components/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, ChevronLeft, ChevronRight, Upload, Download } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
} from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BulkImportModal } from "@/components/bulk-import-modal"
import { useToast } from "@/components/ui/use-toast"
import { bulkExport } from "@/lib/utils/export-utils"

interface User {
  id: number
  name: string
  email: string
  role: string
  status: string
  createdAt: string
  phone_number?: string
  unique_id?: string
  totalLoans?: number
  created_at?: Date
}

function UsersTable({ 
  users 
}: {
  users: User[]
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const getRoleBadge = (role: string) => {
    const roleColors = {
      admin: "bg-purple-100 text-purple-800",
      manager: "bg-blue-100 text-blue-800",
      agent: "bg-green-100 text-green-800",
      user: "bg-gray-100 text-gray-800",
    }
    return (
      <Badge className={roleColors[role as keyof typeof roleColors] || "bg-gray-100 text-gray-800"}>
        {role}
      </Badge>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead>Unique ID</TableHead>
            <TableHead>Total Loans</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Join Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                No customers found.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone_number || 'N/A'}</TableCell>
                <TableCell>{user.unique_id || 'N/A'}</TableCell>
                <TableCell>{user.totalLoans || 0}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString('en-US') : user.createdAt}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user'
  })
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()
  const itemsPerPage = 10

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      // Try direct API call first, fallback to local API if needed
      const response = await fetch('/api/users')
      const data = await response.json()
      
      if (data.success && data.data?.users) {
        console.log("Fetch users data", data)
        // Filter to show only customers (users with role='user')
        const customers = data.data.users.filter((user: User) => user.role === 'user')
        setUsers(customers)
      } else {
        setError(data.error || 'Failed to fetch users')
      }
    } catch (err) {
      setError('Failed to fetch users')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    return user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.id.toString().toLowerCase().includes(searchTerm.toLowerCase())
  })

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])


  const handleNewUser = () => {
    setFormData({ name: '', email: '', phone: '', password: '', role: 'user' })
    setIsDialogOpen(true)
  }

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters (+, -, (, ), spaces, etc.)
    const digitsOnly = phone.replace(/\D/g, '')
    
    // Ensure the number is exactly 11 digits
    if (digitsOnly.length === 11) {
      // Check if it starts with 91 (India code)
      if (digitsOnly.startsWith('91')) {
        return digitsOnly
      } else {
        // If 11 digits but doesn't start with 91, take last 10 digits and add 91
        return '91' + digitsOnly.slice(-10)
      }
    } else if (digitsOnly.length === 10) {
      // If 10 digits, assume it's missing country code, add 91 (India)
      return '91' + digitsOnly
    } else if (digitsOnly.length > 11) {
      // If more than 11 digits, take the last 11
      return digitsOnly.slice(-11)
    } else {
      // If less than 10 digits, it's invalid - return as is for validation to catch
      return digitsOnly
    }
  }

  const handleFormChange = (field: string, value: string) => {
    if (field === 'phone') {
      // Format phone number in real-time
      const formattedPhone = formatPhoneNumber(value)
      setFormData(prev => ({ ...prev, [field]: formattedPhone }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleSubmitUser = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields including password"
      })
      return
    }

    // Validate phone number length
    if (formData.phone.length !== 11) {
      toast({
        variant: "destructive",
        title: "Invalid Phone Number",
        description: "Phone number must be exactly 11 digits including country code"
      })
      return
    }

    try {
      setCreating(true)
      
      // Call Supabase auth function to create user
      const supabaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co'
      const supabaseAnonKey = process.env.NEXT_PUBLIC_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4amZxdmRocGhrdWd1dGtvdmFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgyMTEzMjMsImV4cCI6MjA0Mzc4NzMyM30.sLdFz4jnaQVkBBrPqUMF92Yl_uPDDpc_0VjNXIIjmSI'
      
      const response = await fetch(`${supabaseUrl}/functions/v1/auth`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          phone_number: formData.phone,
          role: 'user',
          email: formData.email,
          unique_id: '', // Let the backend handle unique_id generation
          action: 'login', // Using login as it handles both signup and login
          password: formData.password
        })
      })

      const data = await response.json()

      if (response.ok && data.user) {
        // Refresh users list
        await fetchUsers()
        setIsDialogOpen(false)
        setFormData({ name: '', email: '', phone: '', password: '', role: 'user' })
        toast({
          variant: "success",
          title: "Success",
          description: "Customer created successfully"
        })
      } else {
        toast({
          variant: "destructive",
          title: "Creation Failed",
          description: data.message || data.error || "Failed to create customer"
        })
      }
    } catch (error) {
      console.error('Error creating customer:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create customer"
      })
    } finally {
      setCreating(false)
    }
  }

  const handleExportUsers = async () => {
    try {
      setIsExporting(true)
      
      if (filteredUsers.length === 0) {
        toast({
          variant: "destructive",
          title: "No Data",
          description: "No users available to export"
        })
        return
      }
      
      bulkExport({
        data: filteredUsers,
        type: 'users'
      })
      
      toast({
        variant: "success",
        title: "Export Successful",
        description: `Successfully exported ${filteredUsers.length} users to CSV`
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export users data"
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground">
              Manage customer information and loan histories.
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNewUser}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Customer
                </Button>
              </DialogTrigger>
            </Dialog>
            
            <Button 
              variant="outline" 
              onClick={() => setIsBulkImportOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Bulk Import
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleExportUsers}
              disabled={isExporting || filteredUsers.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Customer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="e.g. +91(829)234-5678 → 91829234567"
                    value={formData.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Will be formatted to 11 digits: {formData.phone || 'Enter phone number'}
                    {formData.phone && formData.phone.length !== 11 && (
                      <span className="text-red-500 ml-2">
                        ({formData.phone.length}/11 digits)
                      </span>
                    )}
                    {formData.phone && formData.phone.length === 11 && (
                      <span className="text-green-500 ml-2">✓ Valid format</span>
                    )}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => handleFormChange('password', e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmitUser}
                    disabled={creating || !formData.name || !formData.email || !formData.phone || !formData.password}
                  >
                    {creating ? 'Creating...' : 'Create Customer'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <BulkImportModal
            isOpen={isBulkImportOpen}
            onClose={() => setIsBulkImportOpen(false)}
            onSuccess={() => {
              fetchUsers()
              toast({
                variant: "success",
                title: "Import Complete",
                description: "Users have been imported successfully"
              })
            }}
          />
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Customers ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-muted-foreground">Loading customers...</div>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-red-500">{error}</div>
              </div>
            ) : (
              <>
                <UsersTable
                  users={paginatedUsers}
                />
                
                {totalPages > 1 && (
                  <div className="flex items-center justify-between py-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} customers
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
      </div>
    </DashboardLayout>
  )
}