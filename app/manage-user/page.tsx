"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable, Column } from "@/components/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Plus, 
  Search, 
  Filter, 
  UserPlus, 
  Users, 
  Shield, 
  UserCheck,
  UserX
} from "lucide-react"

interface SystemUser {
  id: number
  name: string
  email: string
  phone?: string
  phone_number?: string
  role: "admin" | "manager" | "agent" | "user"
  status: "active" | "inactive" | "suspended"
  lastLogin?: string
  last_login?: string
  createdAt?: string
  created_at?: string
}


const userColumns: Column[] = [
  { key: "id", label: "User ID", width: "100px" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone_number", label: "Phone Number", width: "150px" },
  { key: "role", label: "Role", width: "120px" },
  { key: "unique_id", label: "Unique ID", width: "120px" },
  { key: "assigned_agent_id", label: "Assigned Agent ID", width: "120px" },
  { key: "created_at", label: "Created" },
]

export default function ManageUserPage() {
  const [users, setUsers] = useState<SystemUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: ''
  })

  useEffect(() => {
    fetchSystemUsers()
  }, [])

  const fetchSystemUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      const data = await response.json()
      
      if (data.success && data.data?.users) {
        setUsers(data.data.users)
      } else {
        setError(data.error || 'Failed to fetch system users')
      }
    } catch (err) {
      setError('Failed to fetch system users')
      console.error('Error fetching system users:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.id.toString().toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleViewUser = (user: unknown) => {
    console.log("View user:", user)
  }

  const handleEditUser = (user: unknown) => {
    console.log("Edit user:", user)
  }

  const handleDeleteUser = (user: unknown) => {
    console.log("Delete user:", user)
  }

  const handleCreateUser = () => {
    setFormData({ name: '', email: '', phone: '', role: '' })
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
    if (!formData.name || !formData.email || !formData.phone || !formData.role) {
      alert('Please fill in all fields')
      return
    }

    // Validate phone number length
    if (formData.phone.length !== 11) {
      alert('Phone number must be exactly 11 digits including country code')
      return
    }

    try {
      setCreating(true)
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone_number: formData.phone,
          role: formData.role,
          status: 'active'
        })
      })

      const data = await response.json()

      if (data.success) {
        // Refresh users list
        await fetchSystemUsers()
        setIsDialogOpen(false)
        setFormData({ name: '', email: '', phone: '', role: '' })
        console.log('User created successfully')
      } else {
        alert(data.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  const getRoleCounts = () => {
    return {
      all: users.length,
      admin: users.filter(u => u.role === "admin").length,
      manager: users.filter(u => u.role === "manager").length,
      agent: users.filter(u => u.role === "agent").length,
      user: users.filter(u => u.role === "user").length,
    }
  }

  const getStatusCounts = () => {
    return {
      active: users.filter(u => u.status === "active").length,
      inactive: users.filter(u => u.status === "inactive").length,
      suspended: users.filter(u => u.status === "suspended").length,
    }
  }

  const roleCounts = getRoleCounts()
  const statusCounts = getStatusCounts()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
            <p className="text-muted-foreground">
              Manage system users, roles, and permissions.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateUser}>
                <Plus className="mr-2 h-4 w-4" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
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
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => handleFormChange('role', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
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
                    disabled={creating || !formData.name || !formData.email || !formData.phone || !formData.role}
                  >
                    {creating ? 'Creating...' : 'Create User'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                System users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Users
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statusCounts.active}</div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Admins
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{roleCounts.admin}</div>
              <p className="text-xs text-muted-foreground">
                System administrators
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Inactive Users
              </CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{statusCounts.inactive}</div>
              <p className="text-xs text-muted-foreground">
                Inactive/suspended
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex gap-2">
            <span className="text-sm font-medium">Roles:</span>
            {Object.entries(roleCounts).map(([role, count]) => (
              <Badge 
                key={role}
                variant={roleFilter === role ? "default" : "secondary"}
                className="cursor-pointer capitalize"
                onClick={() => setRoleFilter(role)}
              >
                {role}: {count}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-muted-foreground">Loading system users...</div>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-red-500">{error}</div>
              </div>
            ) : (
          
              <DataTable
                columns={userColumns}
                data={filteredUsers}
                onRowClick={handleViewUser}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}