"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
    Check, 
    X, 
    Upload, 
    Download, 
    Eye,
    FileText,
    Image as ImageIcon,
    Loader2,
    Trash2
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { uploadToSupabaseStorage } from "@/lib/utils/supabase-storage"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface KYCDocumentItemProps {
    documentType: string
    documentUrl?: string | string[]
    applicationId: string | number
    isVerified?: boolean
    onVerificationChange?: (verified: boolean) => void
    onDocumentUpload?: (url: string) => void
}

export function KYCDocumentItem({
    documentType,
    documentUrl,
    applicationId,
    isVerified = false,
    onVerificationChange,
    onDocumentUpload
}: KYCDocumentItemProps) {
    const [verified, setVerified] = useState(isVerified)
    const [isUploading, setIsUploading] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const { toast } = useToast()

    const formatDocumentName = (type: string) => {
        return type
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const result = await uploadToSupabaseStorage(file, `kyc/${applicationId}`)
            
            if (result.success && result.url) {
                setUploadedUrl(result.url)
                onDocumentUpload?.(result.url)
                
                toast({
                    variant: "success",
                    title: "Document Uploaded",
                    description: `${formatDocumentName(documentType)} uploaded successfully`
                })

                // Update the document in the backend
                const response = await fetch(`/api/loan-applications/${applicationId}/update-document`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        documentType,
                        documentUrl: result.url
                    })
                })

                if (!response.ok) {
                    throw new Error('Failed to update document in database')
                }
            } else {
                throw new Error(result.error || 'Upload failed')
            }
        } catch (error) {
            console.error('Upload error:', error)
            toast({
                variant: "destructive",
                title: "Upload Failed",
                description: error instanceof Error ? error.message : "Failed to upload document"
            })
        } finally {
            setIsUploading(false)
        }
    }

    const handleVerificationToggle = async () => {
        setIsVerifying(true)
        const newVerificationStatus = !verified

        try {
            const response = await fetch(`/api/loan-applications/${applicationId}/verify-document`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    documentType,
                    isVerified: newVerificationStatus,
                    status: newVerificationStatus ? 'verified' : 'pending',
                    current_stage: newVerificationStatus ? 'verified' : 'pending'
                })
            })

            const data = await response.json()

            if (data.success) {
                setVerified(newVerificationStatus)
                onVerificationChange?.(newVerificationStatus)
                
                toast({
                    variant: "success",
                    title: newVerificationStatus ? "Document Verified" : "Verification Removed",
                    description: `${formatDocumentName(documentType)} ${newVerificationStatus ? 'verified' : 'unverified'} successfully`
                })
            } else {
                throw new Error(data.error || 'Verification failed')
            }
        } catch (error) {
            console.error('Verification error:', error)
            toast({
                variant: "destructive",
                title: "Verification Failed",
                description: error instanceof Error ? error.message : "Failed to update verification status"
            })
        } finally {
            setIsVerifying(false)
        }
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const response = await fetch(
                `/api/loan-applications/${applicationId}/delete-document?documentType=${documentType}`,
                {
                    method: 'DELETE'
                }
            )

            const data = await response.json()

            if (data.success) {
                setUploadedUrl(null)
                setVerified(false)
                setShowDeleteConfirm(false)
                
                toast({
                    variant: "success",
                    title: "Document Removed",
                    description: `${formatDocumentName(documentType)} has been deleted successfully`
                })
                
                // Trigger parent refresh
                onDocumentUpload?.('')
            } else {
                throw new Error(data.error || 'Failed to delete document')
            }
        } catch (error) {
            console.error('Delete error:', error)
            toast({
                variant: "destructive",
                title: "Delete Failed",
                description: error instanceof Error ? error.message : "Failed to delete document"
            })
        } finally {
            setIsDeleting(false)
            setShowDeleteConfirm(false)
        }
    }

    const handleDownload = async (url: string) => {
        try {
            const response = await fetch(url)
            const blob = await response.blob()
            const downloadUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = `${documentType}_${applicationId}`
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(downloadUrl)
        } catch (error) {
            console.error('Download failed:', error)
            window.open(url, '_blank')
        }
    }

    const getDocumentUrl = () => {
        if (uploadedUrl) return uploadedUrl
        if (typeof documentUrl === 'string') return documentUrl
        if (Array.isArray(documentUrl) && documentUrl.length > 0) return documentUrl[0]
        return null
    }

    const currentDocumentUrl = getDocumentUrl()
    const hasDocument = !!currentDocumentUrl

    return (
        <div className="border rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <h4 className="font-medium text-sm">{formatDocumentName(documentType)}</h4>
                    {hasDocument && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                            verified 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                        }`}>
                            {verified ? 'Verified' : 'Pending'}
                        </span>
                    )}
                </div>
            </div>

            {hasDocument ? (
                <div className="space-y-3">
                    {currentDocumentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                        <div 
                            className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                            onClick={() => setSelectedImage(currentDocumentUrl)}
                        >
                            <img 
                                src={currentDocumentUrl} 
                                alt={documentType}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                    
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => currentDocumentUrl && handleDownload(currentDocumentUrl)}
                                className="flex-1"
                            >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                            </Button>
                            
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedImage(currentDocumentUrl)}
                                className="flex-1"
                            >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                            </Button>

                            <Button
                                variant={verified ? "secondary" : "default"}
                                size="sm"
                                onClick={handleVerificationToggle}
                                disabled={isVerifying}
                                className={`flex-1 ${
                                    verified 
                                        ? 'bg-gray-500 hover:bg-gray-600 text-white' 
                                        : 'bg-[#0BA5AA] hover:bg-[#06888D] text-white'
                                }`}
                            >
                                {isVerifying ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : verified ? (
                                    <>
                                        <X className="h-4 w-4 mr-1" />
                                        Unverified
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 mr-1" />
                                        Verify
                                    </>
                                )}
                            </Button>
                        </div>
                        
                        {/* Delete button row */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={isDeleting}
                            className="w-full text-gray-600 hover:text-red-600 hover:border-red-300"
                        >
                            {isDeleting ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4 mr-1" />
                            )}
                            Remove Document
                        </Button>
                    </div>

                    <div className="mt-3">
                        <label className="text-xs text-gray-500 block mb-1">
                            Replace Document
                        </label>
                        <div className="relative">
                            <Input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                                className="hidden"
                                id={`upload-${documentType}`}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById(`upload-${documentType}`)?.click()}
                                disabled={isUploading}
                                className="w-full"
                            >
                                {isUploading ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                    <Upload className="h-4 w-4 mr-1" />
                                )}
                                {isUploading ? 'Uploading...' : 'Upload New'}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 mb-3">No document uploaded</p>
                    
                    <div className="relative">
                        <Input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                            className="hidden"
                            id={`upload-${documentType}`}
                        />
                        <Button
                            variant="outline"
                            onClick={() => document.getElementById(`upload-${documentType}`)?.click()}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Document
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Document Deletion</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-gray-600">
                            Are you sure you want to delete <strong>{formatDocumentName(documentType)}</strong>?
                        </p>
                        <p className="text-sm text-red-600 mt-2">
                            This action cannot be undone and the document will be permanently removed.
                        </p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Document
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Image View Dialog */}
            <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>{formatDocumentName(documentType)}</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-auto">
                        {selectedImage && (
                            selectedImage.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <img 
                                    src={selectedImage} 
                                    alt={documentType}
                                    className="w-full h-auto"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <FileText className="h-16 w-16 text-gray-400 mb-4" />
                                    <p className="text-gray-600">Cannot preview this file type</p>
                                    <Button
                                        variant="outline"
                                        onClick={() => selectedImage && handleDownload(selectedImage)}
                                        className="mt-4"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download to View
                                    </Button>
                                </div>
                            )
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}