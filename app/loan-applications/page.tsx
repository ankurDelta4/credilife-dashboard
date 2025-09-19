"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Check, X, Search, Filter } from "lucide-react"

interface LoanApplication {
    id: string | number
    customerName: string
    email: string
    amount: number
    status: "pending" | "approved" | "rejected"
    tenure: number | string
    repaymentType: string
    submitDate: string
    currentStage?: string
    interestAmount?: number
    principalAmount?: number
    closingFees?: number
    totalRepayment?: number
    loanPurpose?: string
}

function LoanApplicationModal({ 
    application, 
    isOpen, 
    onClose, 
    onApprove, 
    onReject 
}: {
    application: LoanApplication | null
    isOpen: boolean
    onClose: () => void
    onApprove: (applicationId: string | number) => void
    onReject: (applicationId: string | number) => void
}) {
    if (!application) return null

    const handleApprove = () => {
        onApprove(application.id)
        onClose()
    }

    const handleReject = () => {
        onReject(application.id)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Loan Application Review</DialogTitle>
                    <DialogDescription>
                        Review the loan application for {application.customerName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium">Customer Name:</span> {application.customerName}
                        </div>
                        <div>
                            <span className="font-medium">Email:</span> {application.email}
                        </div>
                        <div>
                            <span className="font-medium">Requested Amount:</span> ${application.amount.toLocaleString()}
                        </div>
                        <div>
                            <span className="font-medium">Principal Amount:</span> ${(application.principalAmount || application.amount).toLocaleString()}
                        </div>
                        <div>
                            <span className="font-medium">Interest Amount:</span> ${(application.interestAmount || 0).toLocaleString()}
                        </div>
                        <div>
                            <span className="font-medium">Closing Fees:</span> ${(application.closingFees || 0).toLocaleString()}
                        </div>
                        <div>
                            <span className="font-medium">Total Repayment:</span> ${(application.totalRepayment || 0).toLocaleString()}
                        </div>
                        <div>
                            <span className="font-medium">Tenure:</span> {application.tenure} months
                        </div>
                        <div>
                            <span className="font-medium">Repayment Type:</span> {application.repaymentType || 'N/A'}
                        </div>
                        <div>
                            <span className="font-medium">Current Stage:</span> {application.currentStage || 'N/A'}
                        </div>
                        <div>
                            <span className="font-medium">Submit Date:</span> {new Date(application.submitDate).toLocaleDateString('en-US')}
                        </div>
                        <div>
                            <span className="font-medium">Status:</span>
                            <Badge className={`ml-2 ${
                                application.status === "approved" ? "bg-green-100 text-green-800" :
                                application.status === "rejected" ? "bg-red-100 text-red-800" :
                                "bg-yellow-100 text-yellow-800"
                            }`}>
                                {application.status}
                            </Badge>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    {application.status !== "approved" && (
                        <>
                            <Button
                                variant="destructive"
                                onClick={handleReject}
                                className="flex items-center gap-2"
                            >
                                <X className="h-4 w-4" />
                                Reject Loan
                            </Button>
                            <Button
                                onClick={handleApprove}
                                className="flex items-center gap-2"
                            >
                                <Check className="h-4 w-4" />
                                Approve Loan
                            </Button>
                        </>
                    )}
                    {/* Debug info - remove after testing */}
                    <div className="text-xs text-gray-500 hidden">
                        Status: "{application.status}" | Type: {typeof application.status}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function LoanApplicationsTable({ 
    applications, 
    onViewApplication 
}: {
    applications: LoanApplication[]
    onViewApplication: (application: LoanApplication) => void
}) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount)
    }

    const getStatusBadge = (status: string) => {
        const statusColors = {
            approved: "bg-green-100 text-green-800",
            rejected: "bg-red-100 text-red-800",
            pending: "bg-yellow-100 text-yellow-800",
        }
        return (
            <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
                {status}
            </Badge>
        )
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Customer Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Loan Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tenure</TableHead>
                        <TableHead>Submit Date</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {applications.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                                No loan applications found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        applications.map((application) => (
                            <TableRow key={application.id}>
                                <TableCell 
                                    className="font-medium cursor-pointer hover:text-blue-600"
                                    onClick={() => onViewApplication(application)}
                                >
                                    {application.customerName}
                                </TableCell>
                                <TableCell>{application.email}</TableCell>
                                <TableCell>{formatCurrency(application.amount)}</TableCell>
                                <TableCell>{getStatusBadge(application.status)}</TableCell>
                                <TableCell>{application.tenure}</TableCell>
                                <TableCell>{new Date(application.submitDate).toLocaleDateString('en-US')}</TableCell>
                                <TableCell>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onViewApplication(application)}
                                        className="flex items-center gap-2"
                                    >
                                        <Eye className="h-4 w-4" />
                                        View Details
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

export default function LoanApplicationsPage() {
    const [applications, setApplications] = useState<LoanApplication[]>([])
    const [selectedApplication, setSelectedApplication] = useState<LoanApplication | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")

    useEffect(() => {
        fetchApplications()
    }, [])

    const fetchApplications = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/loans?type=applications&limit=100')
            const data = await response.json()
            
            if (data.success) {
                setApplications(data.data.applications || [])
            } else {
                setError(data.error || 'Failed to fetch loan applications')
            }
        } catch (err) {
            setError('Failed to fetch loan applications')
            console.error('Error fetching loan applications:', err)
        } finally {
            setLoading(false)
        }
    }

    const filteredApplications = applications.filter((application) => {
        const matchesSearch = application.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            application.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            application.id.toString().toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "all" || application.status === statusFilter

        return matchesSearch && matchesStatus
    })

    const handleViewApplication = (application: LoanApplication) => {
        setSelectedApplication(application)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setSelectedApplication(null)
    }

    const handleApprove = async (applicationId: string | number) => {
        try {
            const response = await fetch(`/api/loans/${applicationId}/approve`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'approved'
                })
            })

            const data = await response.json()
            
            if (data.success) {
                setApplications(prev =>
                    prev.map(app =>
                        app.id === applicationId
                            ? { ...app, status: "approved" as const }
                            : app
                    )
                )
                console.log("Loan application approved:", applicationId)
            } else {
                console.error("Failed to approve loan application:", data.error)
            }
        } catch (error) {
            console.error("Error approving loan application:", error)
        }
    }

    const handleReject = async (applicationId: string | number) => {
        try {
            const response = await fetch(`/api/loans/${applicationId}/reject`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'rejected'
                })
            })

            const data = await response.json()
            
            if (data.success) {
                setApplications(prev =>
                    prev.map(app =>
                        app.id === applicationId
                            ? { ...app, status: "rejected" as const }
                            : app
                    )
                )
                console.log("Loan application rejected:", applicationId)
            } else {
                console.error("Failed to reject loan application:", data.error)
            }
        } catch (error) {
            console.error("Error rejecting loan application:", error)
        }
    }

    const getStatusCounts = () => {
        return {
            all: applications.length,
            pending: applications.filter(app => app.status === "pending").length,
            approved: applications.filter(app => app.status === "approved").length,
            rejected: applications.filter(app => app.status === "rejected").length,
        }
    }

    const statusCounts = getStatusCounts()

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Loan Applications</h1>
                    <p className="text-muted-foreground">
                        Review and manage loan applications from customers
                    </p>
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
                            placeholder="Search applications..."
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
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="text-muted-foreground">Loading loan applications...</div>
                    </div>
                ) : error ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="text-red-500">{error}</div>
                    </div>
                ) : (
                    <LoanApplicationsTable
                        applications={filteredApplications}
                        onViewApplication={handleViewApplication}
                    />
                )}

                <LoanApplicationModal
                    application={selectedApplication}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onApprove={handleApprove}
                    onReject={handleReject}
                />
            </div>
        </DashboardLayout>
    )
}