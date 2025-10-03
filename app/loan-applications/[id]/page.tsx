"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
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
import { 
    ArrowLeft, 
    Edit, 
    Trash2, 
    Check, 
    X, 
    Download, 
    ExternalLink,
    AlertCircle
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ImageGallery } from "@/components/image-gallery"

interface LoanApplication {
    id: string | number
    user_id: string | number
    requested_amount: number
    status: "creating" | "pending" | "approved" | "rejected"
    tenure: number | string
    repayment_type: string
    created_at: string
    updated_at: string
    current_stage?: string
    interest_amount?: number
    principal_amount?: number
    closing_fees?: number
    total_repayment?: number
    loan_purpose?: string
    user_data?: string
    questions_count?: number
    is_renewal?: boolean
}

interface DeleteConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    applicationId: string | number
}

function DeleteConfirmDialog({ isOpen, onClose, onConfirm, applicationId }: DeleteConfirmDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        Confirm Deletion
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete loan application #{applicationId}? 
                        This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={onConfirm}>
                        Delete Application
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function LoanApplicationDetailsPage({ 
    params 
}: { 
    params: Promise<{ id: string }> 
}) {
    const [id, setId] = useState<string>("")
    const [application, setApplication] = useState<LoanApplication | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()
    const { toast } = useToast()

    useEffect(() => {
        const resolveParams = async () => {
            const resolvedParams = await params
            setId(resolvedParams.id)
        }
        resolveParams()
    }, [params])

    useEffect(() => {
        if (id) {
            fetchApplicationDetails()
        }
    }, [id])

    const fetchApplicationDetails = async () => {
        try {
            setLoading(true)
            setError(null)
            
            const response = await fetch(`/api/loan-applications/${id}`)
            const data = await response.json()
            
            if (data.success) {
                setApplication(data.data.application)
            } else {
                setError(data.error || 'Failed to fetch loan application')
            }
        } catch (err) {
            setError('Failed to fetch loan application details')
            console.error('Error fetching loan application:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = () => {
        // Navigate to edit page (to be implemented)
        router.push(`/loan-applications/${id}/edit`)
    }

    const handleDelete = async () => {
        try {
            setIsDeleting(true)
            
            const response = await fetch(`/api/loan-applications/${id}`, {
                method: 'DELETE'
            })
            
            const data = await response.json()
            
            if (data.success) {
                toast({
                    variant: "success",
                    title: "Success",
                    description: "Loan application deleted successfully"
                })
                router.push('/loan-applications')
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: data.error || "Failed to delete loan application"
                })
            }
        } catch (error) {
            console.error('Error deleting loan application:', error)
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete loan application"
            })
        } finally {
            setIsDeleting(false)
            setIsDeleteDialogOpen(false)
        }
    }

    const handleApprove = async () => {
        try {
            const response = await fetch(`/api/loans/${id}/approve`, {
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
                setApplication(prev => prev ? { ...prev, status: "approved" as const } : null)
                toast({
                    variant: "success",
                    title: "Success",
                    description: "Loan application approved successfully"
                })
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: data.error || "Failed to approve loan application"
                })
            }
        } catch (error) {
            console.error("Error approving loan application:", error)
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to approve loan application"
            })
        }
    }

    const handleReject = async () => {
        try {
            const response = await fetch(`/api/loans/${id}/reject`, {
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
                setApplication(prev => prev ? { ...prev, status: "rejected" as const } : null)
                toast({
                    variant: "success",
                    title: "Success",
                    description: "Loan application rejected successfully"
                })
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: data.error || "Failed to reject loan application"
                })
            }
        } catch (error) {
            console.error("Error rejecting loan application:", error)
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to reject loan application"
            })
        }
    }

    const handleVerifyKYC = async () => {
        if (!confirm('Are you sure you want to verify KYC for this application?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/loans/${id}/verify`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'verification'
                })
            })

            const data = await response.json()
            
            if (data.success) {
                setApplication(prev => prev ? { ...prev, status: "verification" as any } : null)
                toast({
                    variant: "success",
                    title: "KYC Verified",
                    description: "Application moved to verification stage"
                })
            } else {
                toast({
                    variant: "destructive",
                    title: "Verification Failed",
                    description: data.error || "Failed to verify KYC"
                })
            }
        } catch (error) {
            console.error("Error verifying KYC:", error)
            toast({
                variant: "destructive",
                title: "Verification Failed",
                description: "An error occurred while verifying KYC"
            })
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center py-8">
                    <div className="text-muted-foreground">Loading loan application details...</div>
                </div>
            </DashboardLayout>
        )
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="space-y-4">
                    <Button 
                        variant="outline" 
                        onClick={() => router.push('/loan-applications')}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Applications
                    </Button>
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <AlertCircle className="h-12 w-12 text-red-500" />
                        <div className="text-red-500 text-lg font-semibold">Error</div>
                        <div className="text-muted-foreground">{error}</div>
                        <Button onClick={fetchApplicationDetails}>
                            Try Again
                        </Button>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    if (!application) {
        return (
            <DashboardLayout>
                <div className="space-y-4">
                    <Button 
                        variant="outline" 
                        onClick={() => router.push('/loan-applications')}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Applications
                    </Button>
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <AlertCircle className="h-12 w-12 text-gray-400" />
                        <div className="text-lg font-semibold">Application Not Found</div>
                        <div className="text-muted-foreground">
                            The loan application you're looking for doesn't exist.
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    let userData = null
    if (application.user_data) {
        try {
            userData = JSON.parse(application.user_data)
        } catch (e) {
            console.error('Failed to parse user_data:', e)
        }
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
            window.open(url, '_blank')
        }
    }

    const renderFieldValue = (key: string, value: any) => {
        const stringValue = String(value)
        
        if (value === null || value === '') {
            return <span className="text-gray-500">N/A</span>
        }
        
        if (typeof value === 'object') {
            return <pre className="text-xs bg-gray-100 p-2 rounded max-w-md overflow-auto">{JSON.stringify(value, null, 2)}</pre>
        }
        
        if (isURL(stringValue)) {
            if (isImageOrFileField(key)) {
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
                    </div>
                )
            } else {
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
                    </div>
                )
            }
        }
        
        return <span className="text-gray-900 break-words">{stringValue}</span>
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
    ]

    const canEditOrDelete = application.status !== "approved"

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="outline" 
                            onClick={() => router.push('/loan-applications')}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Applications
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                Loan Application #{application.id}
                            </h1>
                            <p className="text-muted-foreground">
                                Review loan application details
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {canEditOrDelete && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={handleEdit}
                                    className="flex items-center gap-2"
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => setIsDeleteDialogOpen(true)}
                                    className="flex items-center gap-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Application Details */}
                <div className="p-6 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold mb-4 text-blue-900">Application Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
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
                            <span className="font-medium">Requested Amount:</span> ${application.requested_amount?.toLocaleString()}
                        </div>
                        <div>
                            <span className="font-medium">Submit Date:</span> {new Date(application.created_at).toLocaleDateString('en-US')}
                        </div>
                        <div>
                            <span className="font-medium">Principal Amount:</span> ${(application.principal_amount || application.requested_amount)?.toLocaleString()}
                        </div>
                        <div>
                            <span className="font-medium">Interest Amount:</span> ${(application.interest_amount || 0)?.toLocaleString()}
                        </div>
                        <div>
                            <span className="font-medium">Closing Fees:</span> ${(application.closing_fees || 0)?.toLocaleString()}
                        </div>
                        <div>
                            <span className="font-medium">Total Repayment:</span> ${(application.total_repayment || 0)?.toLocaleString()}
                        </div>
                        <div>
                            <span className="font-medium">Tenure:</span> {application.tenure || 'N/A'} {application.tenure ? 'months' : ''}
                        </div>
                        <div>
                            <span className="font-medium">Repayment Type:</span> {application.repayment_type || 'N/A'}
                        </div>
                        <div>
                            <span className="font-medium">Current Stage:</span> {application.current_stage || 'N/A'}
                        </div>
                        <div>
                            <span className="font-medium">Loan Purpose:</span> {application.loan_purpose || 'N/A'}
                        </div>
                    </div>
                </div>

                {/* Applicant Information */}
                <div className="p-6 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-4 text-gray-900">Applicant Information</h3>
                    {userData ? (
                        <div className="space-y-6">
                            {/* Basic Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {userDataFieldOrder
                                    .filter(key => key in userData && !isDocumentField(key))
                                    .map((key) => {
                                        const value = userData[key]
                                        return (
                                            <div key={key} className="flex flex-col">
                                                <span className="font-medium text-gray-600 mb-1">
                                                    {formatFieldName(key)}:
                                                </span>
                                                <div className="overflow-hidden">
                                                    {renderFieldValue(key, value)}
                                                </div>
                                            </div>
                                        )
                                    })}
                                {Object.entries(userData)
                                    .filter(([key]) => !userDataFieldOrder.includes(key) && !isDocumentField(key))
                                    .map(([key, value]) => (
                                        <div key={key} className="flex flex-col">
                                            <span className="font-medium text-gray-600 mb-1">
                                                {formatFieldName(key)}:
                                            </span>
                                            <div className="overflow-hidden">
                                                {renderFieldValue(key, value)}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                            
                            {/* Documents Section */}
                            <div className="border-t pt-6">
                                <h4 className="font-semibold mb-4 text-gray-900">Uploaded Documents</h4>
                                <div className="space-y-6">
                                    {[...userDataFieldOrder, ...Object.keys(userData)]
                                        .filter((key, index, arr) => arr.indexOf(key) === index)
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
                            
                            {/* KYC Documents Section with Verify Button */}
                            <div className="border-t pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold text-gray-900">KYC Documents</h4>
                                    <Button
                                        onClick={() => handleVerifyKYC()}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                        size="sm"
                                    >
                                        <Check className="h-4 w-4 mr-2" />
                                        Verify Manually
                                    </Button>
                                </div>
                                <div className="text-sm text-gray-600 mb-3">
                                    Review the following KYC documents before verification:
                                </div>
                                <div className="space-y-4">
                                    {['id_card', 'passport', 'driving_license', 'aadhar_card', 'pan_card', 'address_proof', 'bank_statement', 'salary_slip', 'income_certificate', 'utility_bill'].map(docType => {
                                        const docData = userData && userData[docType];
                                        return docData ? (
                                            <div key={docType} className="bg-gray-50 p-3 rounded">
                                                <ImageGallery
                                                    files={docData}
                                                    label={`KYC: ${formatFieldName(docType)}`}
                                                    fieldName={docType}
                                                    applicationId={application.id}
                                                />
                                            </div>
                                        ) : null;
                                    })}
                                    {userData && ['id_card', 'passport', 'driving_license', 'aadhar_card', 'pan_card', 'address_proof', 'bank_statement', 'salary_slip', 'income_certificate', 'utility_bill'].every(doc => !userData[doc]) && (
                                        <div className="text-sm text-gray-500 italic">
                                            No KYC documents uploaded
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500">
                            No additional applicant information available.
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                {application.status !== "approved" && (
                    <div className="flex gap-4 pt-4 border-t">
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
                    </div>
                )}

                {/* Delete Confirmation Dialog */}
                <DeleteConfirmDialog
                    isOpen={isDeleteDialogOpen}
                    onClose={() => setIsDeleteDialogOpen(false)}
                    onConfirm={handleDelete}
                    applicationId={application.id}
                />
            </div>
        </DashboardLayout>
    )
}