"use client"

import { useState, useEffect, use } from "react"
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
import { KYCDocumentItem } from "@/components/kyc-document-item"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoanApplicationDashboard } from "@/components/loan-application-dashboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

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
    const resolvedParams = use(params)
    const id = resolvedParams.id
    const [application, setApplication] = useState<LoanApplication | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [chatLink, setChatLink] = useState("")
    const [isApproving, setIsApproving] = useState(false)
    const [agents, setAgents] = useState<Array<{ id: number; name: string; email: string }>>([])
    const [selectedAgentId, setSelectedAgentId] = useState<string>("")
    const router = useRouter()
    const { toast } = useToast()

    useEffect(() => {
        if (id) {
            fetchApplicationDetails()
        }
    }, [id])

    useEffect(() => {
        // Fetch agents for assignment from staff table
        const fetchAgents = async () => {
            try {
                console.log('[LOAN APP] Fetching agents from staff table...')
                const response = await fetch('/api/staff?role=agent')
                console.log('[LOAN APP] Response status:', response.status)
                console.log('[LOAN APP] Response ok:', response.ok)

                const data = await response.json()
                console.log('[LOAN APP] Staff API response:', data)

                if (!data.success) {
                    console.error('[LOAN APP] API returned error:', {
                        error: data.error,
                        code: data.code,
                        details: data.details,
                        status: data.status
                    })
                }

                console.log('[LOAN APP] Agents data:', data.data?.users)
                console.log('[LOAN APP] Number of agents:', data.data?.users?.length || 0)

                if (data.success && data.data?.users) {
                    setAgents(data.data.users)
                    console.log('[LOAN APP] Agents set successfully:', data.data.users.length)
                } else {
                    console.warn('[LOAN APP] No agents found or API call failed:', data)
                }
            } catch (error) {
                console.error('[LOAN APP] Error fetching agents:', error)
            }
        }
        fetchAgents()
    }, [])

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
        if (!chatLink.trim()) {
            toast({
                variant: "destructive",
                title: "Chat Link Required",
                description: "Please enter the chat link for KYC verification"
            })
            return
        }

        setIsApproving(true)
        try {
            // First approve the loan
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
                // Get user data for email
                let userName = "Customer"
                let userEmail = ""
                
                if (userData) {
                    userName = userData.first_name || userData.name || "Customer"
                    userEmail = userData.email || ""
                }

                // Send pre-approval email with chat link
                const emailResponse = await fetch('/api/notifications/pre-approval-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        applicationId: application?.id || id,
                        userName,
                        userEmail,
                        chatLink: chatLink.trim()
                    })
                })

                const emailData = await emailResponse.json()
                
                setApplication(prev => prev ? { ...prev, status: "approved" as const } : null)
                
                if (emailData.success) {
                    toast({
                        variant: "success",
                        title: "Success",
                        description: "Loan pre-approved and email sent successfully"
                    })
                } else {
                    toast({
                        variant: "success",
                        title: "Partial Success",
                        description: "Loan approved but email failed to send. Please contact customer manually."
                    })
                }
                
                setChatLink("") // Clear the chat link input
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
        } finally {
            setIsApproving(false)
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
                        onClick={() => router.back()}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
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
                        onClick={() => router.back()}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
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

    let userData: any = null
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
                            onClick={() => router.back()}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">
                                Loan Application Details
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Application ID: #{application.id}
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

                {/* Use the new Dashboard Component */}
                <LoanApplicationDashboard 
                    applicationId={application.id}
                    applicationData={application}
                />

                {/* Action Buttons */}
                {application.status !== "approved" && application.status !== "rejected" && (
                    <div className="pt-4 border-t space-y-4">
                        {/* Chat Link Input for KYC */}
                        {(application.status === "pending" || application.status === "creating" || !application.status) && (
                            <div className="bg-teal-50 p-4 rounded-lg">
                                <Label htmlFor="chat-link" className="text-sm font-medium mb-2 block">
                                    KYC Verification Chat Link (Required to Start Verification)
                                </Label>
                                <Input
                                    id="chat-link"
                                    type="url"
                                    placeholder="https://example.com/chat/kyc-verification"
                                    value={chatLink}
                                    onChange={(e) => setChatLink(e.target.value)}
                                    className="w-full"
                                />
                                <p className="text-xs text-gray-600 mt-2">
                                    Enter the chat link that will be sent to the customer for KYC verification.
                                </p>
                            </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <Button
                                variant="destructive"
                                onClick={handleReject}
                                className="flex items-center gap-2"
                            >
                                <X className="h-4 w-4" />
                                Reject Application
                            </Button>
                            
                            {/* Show Start Verification for pending status */}
                            {(application.status === "pending" || application.status === "creating" || !application.status) && (
                                <Button
                                    onClick={async () => {
                                        if (!chatLink.trim()) {
                                            toast({
                                                variant: "destructive",
                                                title: "Chat Link Required",
                                                description: "Please enter the KYC verification chat link"
                                            })
                                            return
                                        }
                                        
                                        setIsApproving(true)
                                        try {
                                            // Update status to under-verification
                                            const statusResponse = await fetch(`/api/loan-applications/${id}/status`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ status: 'under-verification' })
                                            })
                                            
                                            if (statusResponse.ok) {
                                                // Send verification email
                                                let userName = "Customer"
                                                let userEmail = ""
                                                
                                                if (userData) {
                                                    userName = userData.first_name || userData.name || "Customer"
                                                    userEmail = userData.email || ""
                                                }
                                                
                                                const emailResponse = await fetch('/api/notifications/pre-approval-email', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        applicationId: application.id,
                                                        userName,
                                                        userEmail,
                                                        chatLink: chatLink.trim()
                                                    })
                                                })
                                                
                                                if (emailResponse.ok) {
                                                    toast({
                                                        variant: "success",
                                                        title: "Verification Started",
                                                        description: "KYC verification link has been sent to the customer"
                                                    })
                                                    setApplication(prev => prev ? { ...prev, status: "under-verification" as any } : null)
                                                    setChatLink("")
                                                } else {
                                                    toast({
                                                        variant: "destructive",
                                                        title: "Email Failed",
                                                        description: "Failed to send verification email. Please try again."
                                                    })
                                                }
                                            }
                                        } catch (error) {
                                            toast({
                                                variant: "destructive",
                                                title: "Error",
                                                description: "Failed to start verification process"
                                            })
                                        } finally {
                                            setIsApproving(false)
                                        }
                                    }}
                                    disabled={isApproving || !chatLink.trim()}
                                    className="flex items-center gap-2 bg-[#0BA5AA] hover:bg-[#06888D] text-white"
                                >
                                    {isApproving ? (
                                        <>
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Starting Verification...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4" />
                                            Start Verification
                                        </>
                                    )}
                                </Button>
                            )}
                            
                            {/* Show Approve Loan for under-verification status */}
                            {(application.status === "under-verification" || application.status === "under_verification" ||
                              application.status === "verified" || application.status === "verification") && (
                                <>
                                    {/* Agent Selection */}
                                    <div className="flex-1">
                                        <Label htmlFor="agent-select" className="text-sm font-medium mb-2 block">
                                            Assign Agent to Loan
                                        </Label>
                                        <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                                            <SelectTrigger id="agent-select" className="w-full">
                                                <SelectValue placeholder="Select an agent to assign" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {agents.length === 0 ? (
                                                    <SelectItem value="no-agents" disabled>No agents available</SelectItem>
                                                ) : (
                                                    agents.map((agent) => (
                                                        <SelectItem key={agent.id} value={agent.id.toString()}>
                                                            {agent.name} ({agent.email})
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-gray-600 mt-1">
                                            Select an agent who will be assigned to manage this loan and customer.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Approve Loan Button */}
                        {(application.status === "under-verification" || application.status === "under_verification" ||
                          application.status === "verified" || application.status === "verification") && (
                            <div className="flex gap-4">
                                <Button
                                    onClick={async () => {
                                        if (!selectedAgentId) {
                                            toast({
                                                variant: "destructive",
                                                title: "Agent Required",
                                                description: "Please select an agent to assign to this loan before approving"
                                            })
                                            return
                                        }

                                        if (!confirm('Are you sure you want to approve this loan application?')) {
                                            return
                                        }

                                        setIsApproving(true)
                                        try {
                                            const response = await fetch(`/api/loans/${id}/approve`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    status: 'approved',
                                                    assigned_agent_id: parseInt(selectedAgentId)
                                                })
                                            })
                                            
                                            const data = await response.json()
                                            
                                            if (data.success) {
                                                setApplication(prev => prev ? { ...prev, status: "approved" as const } : null)
                                                toast({
                                                    variant: "success",
                                                    title: "Loan Approved",
                                                    description: "The loan application has been approved successfully"
                                                })
                                            } else {
                                                toast({
                                                    variant: "destructive",
                                                    title: "Error",
                                                    description: data.error || "Failed to approve loan"
                                                })
                                            }
                                        } catch (error) {
                                            toast({
                                                variant: "destructive",
                                                title: "Error",
                                                description: "Failed to approve loan application"
                                            })
                                        } finally {
                                            setIsApproving(false)
                                        }
                                    }}
                                    disabled={isApproving}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {isApproving ? (
                                        <>
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Approving...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4" />
                                            Approve Loan
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}

                        {/* Status Message */}
                        {(application.status === "under-verification" || application.status === "under_verification") && (
                            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                                <p className="text-sm text-teal-800">
                                    <strong>Status:</strong> KYC verification is in progress. Once you're satisfied with the verification, click "Approve Loan" to finalize the approval.
                                </p>
                            </div>
                        )}
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