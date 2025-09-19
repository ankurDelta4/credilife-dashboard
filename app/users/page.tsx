"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable, Column } from "@/components/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"

interface User {
  id: number
  name: string
  email: string
  role: string
  status: string
  createdAt: string
  phone_number?: string
  unique_id?: number
  totalLoans?: number
  created_at?: Date
}

const usersColumns: Column[] = [
  { key: "id", label: "Id", width: "100px" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone_number", label: "Phone Number", width: "150px" },
  { key: "unique_id", label: "Unique Id", width: "120px" },
  { key: "totalLoans", label: "Total Loans", width: "120px" },
  { key: "status", label: "Status", width: "120px" },
  { key: "created_at", label: "Join Date" },
]

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      const data = await response.json()
      console.log("Fetch users data", data)
      if (data.success) {
        setUsers(data.data.users)
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

  const handleViewUser = (user: unknown) => {
    console.log("View user:", user)
  }

  const handleEditUser = (user: unknown) => {
    console.log("Edit user:", user)
  }

  const handleDeleteUser = (user: unknown) => {
    console.log("Delete user:", user)
  }

  const handleNewUser = () => {
    console.log("Create new user")
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground">
              Manage user information and loan histories.
            </p>
          </div>
          <Button onClick={handleNewUser}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-muted-foreground">Loading users...</div>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-red-500">{error}</div>
              </div>
            ) : (
              <DataTable
                columns={usersColumns}
                data={filteredUsers}
                onView={handleViewUser}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}