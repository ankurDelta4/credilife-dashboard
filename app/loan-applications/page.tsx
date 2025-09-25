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
import { Eye, Check, X, Search, Filter, ChevronLeft, ChevronRight, Download, ExternalLink } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { bulkExport } from "@/lib/utils/export-utils"
import { ImageGallery } from "@/components/image-gallery"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
} from "@/components/ui/pagination"

interface LoanApplication {
    id: string | number
    customerName: string
    email: string
    amount: number
    status: "creating" | "pending" | "approved" | "rejected"
    tenure: number | string
    repaymentType: string
    submitDate: string
    currentStage?: string
    interestAmount?: number
    principalAmount?: number
    closingFees?: number
    totalRepayment?: number
    loanPurpose?: string
    user_data?: string
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

    let userData = null
    console.log('Application data:', application)
    console.log('User data string:', application.user_data)
    
    if (application.user_data) {
        try {
            userData = JSON.parse(application.user_data)
            console.log('Parsed user data:', userData)
        } catch (e) {
            console.error('Failed to parse user_data:', e)
            console.error('Raw user_data:', application.user_data)
        }
    } else {
        console.log('No user_data field in application')
    }

    const formatFieldName = (fieldName: string) => {
        return fieldName
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
    }

    const isURL = (str: string) => {
        if (!str || typeof str !== 'string') return false
        try {
            new URL(str)
            return true
        } catch {
            return false
        }
    }

    const isImageOrFileField = (fieldName: string) => {
        const linkOnlyFields = ['business_insta', 'company_site']
        return !linkOnlyFields.includes(fieldName)
    }

    const isDocumentField = (fieldName: string) => {
        const documentFields = [
            'id_card_front',
            'bank_statements_employed', 
            'employment_letter',
            'business_location_photos',
            'product_photos', 
            'supplier_invoices',
            'bank_statements_self'
        ]
        return documentFields.includes(fieldName)
    }

    const handleDownload = async (url: string, fileName: string) => {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/octet-stream',
                },
            })
            
            if (!response.ok) {
                throw new Error('Failed to fetch file')
            }
            
            const blob = await response.blob()
            const downloadUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = fileName || 'download'
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(downloadUrl)
        } catch (error) {
            console.error('Download failed:', error)
            // Fallback to opening in new tab
            window.open(url, '_blank')
        }
    }

    const renderFieldValue = (key: string, value: any) => {
        const stringValue = String(value)
        
        if (value === null || value === '') {
            return <span className="text-gray-500">N/A</span>
        }
        
        if (typeof value === 'object') {
            return <pre className="text-xs bg-gray-100 p-2 rounded">{JSON.stringify(value, null, 2)}</pre>
        }
        
        if (isURL(stringValue)) {
            if (isImageOrFileField(key)) {
                // Image/file field - show download button
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(stringValue, `${key}_${application.id}`)}
                            className="flex items-center gap-1"
                        >
                            <Download className="h-3 w-3" />
                            Download
                        </Button>
                        {/* <span className="text-xs text-gray-500 truncate max-w-32" title={stringValue}>
                            {stringValue}
                        </span> */}
                    </div>
                )
            } else {
                // Business/company links - show external link
                return (
                    <div className="flex items-center gap-2">
                        <a
                            href={stringValue}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                        >
                            <ExternalLink className="h-3 w-3" />
                            Visit Link
                        </a>
                        {/* <span className="text-xs text-gray-500 truncate max-w-32" title={stringValue}>
                            {stringValue}
                        </span> */}
                    </div>
                )
            }
        }
        
        return <span className="text-gray-900">{stringValue}</span>
    }

    const userDataFieldOrder = [
        "first_name",
        "last_name",
        "whatsapp_number",
        "id_number",
        "id_card_front",
        "email",
        "address",
        "province",
        "house_type",
        "maratial_status",
        "partner_name",
        "children_count",
        "family_reference",
        "personal_reference",
        "employment_status",
        "company_name",
        "company_number",
        "hr_email",
        "company_site",
        "company_address",
        "occupation",
        "living_time_at_address",
        "application_id",
        "supervisor_name",
        "time_in_company",
        "company_payment_method",
        "monthly_income",
        "month_end_saving",
        "payment_date"
      ];
      

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Loan Application Review</DialogTitle>
                    <DialogDescription>
                        Review the loan application for {application.customerName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-semibold mb-3 text-blue-900">Application Details</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium">Application ID:</span> {application.id}
                            </div>
                            <div>
                                <span className="font-medium">Status:</span>
                                <Badge className={`ml-2 ${
                                    application.status === "creating" ? "bg-blue-100 text-blue-800" :
                                    application.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                    application.status === "approved" ? "bg-green-100 text-green-800" :
                                    application.status === "rejected" ? "bg-red-100 text-red-800" :
                                    "bg-gray-100 text-gray-800"
                                }`}>
                                    {application.status}
                                </Badge>
                            </div>
                            <div>
                                <span className="font-medium">Requested Amount:</span> ${application.amount.toLocaleString()}
                            </div>
                            <div>
                                <span className="font-medium">Submit Date:</span> {new Date(application.submitDate).toLocaleDateString('en-US')}
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
                                <span className="font-medium">Tenure:</span> {application.tenure || 'N/A'} {application.tenure ? 'months' : ''}
                            </div>
                            <div>
                                <span className="font-medium">Repayment Type:</span> {application.repaymentType || 'N/A'}
                            </div>
                            <div>
                                <span className="font-medium">Current Stage:</span> {application.currentStage || 'N/A'}
                            </div>
                            <div>
                                <span className="font-medium">Loan Purpose:</span> {application.loanPurpose || 'N/A'}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold mb-3 text-gray-900">Applicant Information</h3>
                        {userData ? (
                            <div className="space-y-6">
                                {/* Basic Information */}
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    {userDataFieldOrder
                                        .filter(key => key in userData && !isDocumentField(key))
                                        .map((key) => {
                                            const value = userData[key]
                                            return (
                                                <div key={key} className="flex flex-col">
                                                    <span className="font-medium text-gray-600">
                                                        {formatFieldName(key)}:
                                                    </span>
                                                    <div className="mt-1">
                                                        {renderFieldValue(key, value)}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    {Object.entries(userData)
                                        .filter(([key]) => !userDataFieldOrder.includes(key) && !isDocumentField(key))
                                        .map(([key, value]) => (
                                            <div key={key} className="flex flex-col">
                                                <span className="font-medium text-gray-600">
                                                    {formatFieldName(key)}:
                                                </span>
                                                <div className="mt-1">
                                                    {renderFieldValue(key, value)}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                                
                                {/* Documents Section */}
                                <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-4 text-gray-900">Uploaded Documents</h4>
                                    <div className="space-y-6">
                                        {[...userDataFieldOrder, ...Object.keys(userData)]
                                            .filter((key, index, arr) => arr.indexOf(key) === index) // Remove duplicates
                                            .filter(key => key in userData && isDocumentField(key))
                                            .map((key) => (
                                                <ImageGallery
                                                    key={key}
                                                    files={userData[key]}
                                                    label={formatFieldName(key)}
                                                    fieldName={key}
                                                    applicationId={application.id}
                                                />
                                            ))}
                                        {[...userDataFieldOrder, ...Object.keys(userData)]
                                            .filter((key, index, arr) => arr.indexOf(key) === index)
                                            .filter(key => key in userData && isDocumentField(key)).length === 0 && (
                                            <div className="text-sm text-gray-500 italic">
                                                No documents uploaded
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500">
                                No additional applicant information available. 
                                {!application.user_data}
                            </div>
                        )}
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
            creating: "bg-blue-100 text-blue-800",
            pending: "bg-yellow-100 text-yellow-800",
            approved: "bg-green-100 text-green-800",
            rejected: "bg-red-100 text-red-800",
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
    const [currentPage, setCurrentPage] = useState(1)
    const [isExporting, setIsExporting] = useState(false)
    const { toast } = useToast()
    const itemsPerPage = 10

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

    const totalPages = Math.ceil(filteredApplications.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedApplications = filteredApplications.slice(startIndex, endIndex)

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, statusFilter])

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

    const handleExportApplications = async () => {
        try {
            setIsExporting(true)
            
            if (filteredApplications.length === 0) {
                toast({
                    variant: "destructive",
                    title: "No Data",
                    description: "No loan applications available to export"
                })
                return
            }
            
            // Transform application data for export
            const exportData = filteredApplications.map(app => ({
                id: app.id,
                user_id: app.customerName, // Using customerName as user identifier
                user_name: app.customerName,
                requested_amount: app.amount,
                loan_purpose: app.loanPurpose || 'N/A',
                tenure: app.tenure,
                repayment_type: app.repaymentType,
                principal_amount: app.principalAmount || app.amount,
                interest_amount: app.interestAmount || 0,
                closing_fees: app.closingFees || 0,
                total_repayment: app.totalRepayment || app.amount,
                status: app.status,
                current_stage: app.currentStage || 'application_submitted',
                questions_count: 0,
                is_renewal: false,
                created_at: app.submitDate,
                updated_at: app.submitDate
            }))
            
            bulkExport({
                data: exportData,
                type: 'applications'
            })
            
            toast({
                variant: "success",
                title: "Export Successful",
                description: `Successfully exported ${filteredApplications.length} loan applications to CSV`
            })
        } catch (error) {
            console.error('Export error:', error)
            toast({
                variant: "destructive",
                title: "Export Failed",
                description: "Failed to export loan applications data"
            })
        } finally {
            setIsExporting(false)
        }
    }

    const getStatusCounts = () => {
        return {
            all: applications.length,
            creating: applications.filter(app => app.status === "creating").length,
            pending: applications.filter(app => app.status === "pending").length,
            approved: applications.filter(app => app.status === "approved").length,
            rejected: applications.filter(app => app.status === "rejected").length,
        }
    }

    const statusCounts = getStatusCounts()

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Loan Applications</h1>
                        <p className="text-muted-foreground">
                            Review and manage loan applications from customers
                        </p>
                    </div>
                    <Button 
                        variant="outline" 
                        onClick={handleExportApplications}
                        disabled={isExporting || filteredApplications.length === 0}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        {isExporting ? 'Exporting...' : 'Export CSV'}
                    </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {Object.entries(statusCounts).map(([status, count]) => {
                        const isActive = statusFilter === status
                        const statusStyles = {
                            all: isActive ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                            creating: isActive ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700 hover:bg-blue-200",
                            pending: isActive ? "bg-yellow-600 text-white" : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
                            approved: isActive ? "bg-green-600 text-white" : "bg-green-100 text-green-700 hover:bg-green-200",
                            rejected: isActive ? "bg-red-600 text-white" : "bg-red-100 text-red-700 hover:bg-red-200",
                        }
                        return (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-full font-medium text-sm transition-colors ${
                                    statusStyles[status as keyof typeof statusStyles]
                                }`}
                            >
                                {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)} ({count})
                            </button>
                        )
                    })}
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
                            <SelectItem value="creating">Creating</SelectItem>
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
                    <>
                        <LoanApplicationsTable
                            applications={paginatedApplications}
                            onViewApplication={handleViewApplication}
                        />
                        
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between py-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {startIndex + 1} to {Math.min(endIndex, filteredApplications.length)} of {filteredApplications.length} applications
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