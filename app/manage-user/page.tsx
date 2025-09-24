"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
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
  Users, 
  Shield, 
  Settings
} from "lucide-react"
import {
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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


// Custom Staff Table Component
function StaffTable({ 
  users, 
  onChangeRole 
}: {
  users: SystemUser[]
  onChangeRole: (user: SystemUser) => void
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Staff ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No staff members found.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell className="text-blue-600">{user.email}</TableCell>
                <TableCell>{user.phone_number || user.phone || 'N/A'}</TableCell>
                <TableCell>
                  <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                </TableCell>
                <TableCell>
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : user.createdAt || 'N/A'}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onChangeRole(user)}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Change Role
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

const getRoleColor = (role: string) => {
  const roleColors = {
    admin: "bg-purple-100 text-purple-800",
    manager: "bg-blue-100 text-blue-800",
    agent: "bg-green-100 text-green-800",
  }
  return roleColors[role as keyof typeof roleColors] || "bg-gray-100 text-gray-800"
}

export default function ManageStaffPage() {
  const [users, setUsers] = useState<SystemUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: ''
  })
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [newRole, setNewRole] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchSystemUsers()
  }, [])

  const fetchSystemUsers = async () => {
    try {
      setLoading(true)
      // Use local staff API endpoint
      const response = await fetch('/api/staff')
      const data = await response.json()
      
      if (data.success && data.data?.users) {
        console.log('Staff data fetched:', data.data.users.length)
        setUsers(data.data.users || [])
      } else {
        setError(data.error || 'Failed to fetch staff data')
      }
    } catch (err) {
      setError('Failed to fetch staff data')
      console.error('Error fetching staff:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.id.toString().toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    
    return matchesSearch && matchesRole
  })


  const handleChangeRole = (user: SystemUser) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setIsRoleModalOpen(true)
  }

  const handleRoleUpdate = async () => {
    if (!selectedUser) return
    
    try {
      setUpdating(true)
      const response = await fetch(`/api/staff/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          role: newRole
        })
      })

      const data = await response.json()

      if (data.success) {
        // Refresh users list
        await fetchSystemUsers()
        setIsRoleModalOpen(false)
        setSelectedUser(null)
        console.log("Role updated successfully")
      } else {
        console.error("Failed to update role:", data.error)
      }
    } catch (error) {
      console.error("Error updating role:", error)
    } finally {
      setUpdating(false)
    }
  }

  const handleCreateUser = () => {
    setFormData({ name: '', email: '', phone: '', password: '', role: '' })
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
    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.role) {
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
      console.log("Creating staff member")
      
      // Use the server-side API endpoint (proper Next.js approach)
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone_number: formData.phone,
          password: formData.password,
          role: formData.role
        })
      })

      const data = await response.json()

      if (data.success) {
        console.log('Staff created successfully:', data)
        // Refresh users list
        await fetchSystemUsers()
        setIsDialogOpen(false)
        setFormData({ name: '', email: '', phone: '', password: '', role: '' })
        alert('Staff member created successfully!')
      } else {
        console.error('Failed to create staff:', data.error)
        alert(data.error || 'Failed to create staff member')
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
    }
  }


  const roleCounts = getRoleCounts()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Staff</h1>
            <p className="text-muted-foreground">
              Manage staff members, roles, and permissions.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateUser}>
                <Plus className="mr-2 h-4 w-4" />
                Create Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Staff Member</DialogTitle>
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
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => handleFormChange('role', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
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
                    disabled={creating || !formData.name || !formData.email || !formData.phone || !formData.password || !formData.role}
                  >
                    {creating ? 'Creating...' : 'Create Staff'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Staff
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
Staff members
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
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Staff Members ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-muted-foreground">Loading staff members...</div>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-red-500">{error}</div>
              </div>
            ) : (
          
              <StaffTable
                users={filteredUsers}
                onChangeRole={handleChangeRole}
              />
            )}
          </CardContent>
        </Card>

        {/* Role Change Modal */}
        <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Staff Role</DialogTitle>
              <DialogDescription>
                Update the role for {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Select Role:</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsRoleModalOpen(false)}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRoleUpdate}
                disabled={updating || !newRole}
              >
                {updating ? "Updating..." : "Update Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}