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
import { Eye, Check, X, ChevronLeft, ChevronRight } from "lucide-react"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
} from "@/components/ui/pagination"

// Receipt interface
interface Receipt {
    id: string | number
    username: string
    loanAmount: number
    receiptImage: string
    status: "pending" | "approved" | "rejected"
    submittedDate: string
    loanId: string
}

// Mock receipt data
const mockReceipts: Receipt[] = [
    {
        id: "R001",
        username: "Alice Johnson",
        loanAmount: 50000,
        receiptImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop",
        status: "pending",
        submittedDate: "2024-09-19",
        loanId: "L001"
    },
    {
        id: "R002",
        username: "Bob Smith",
        loanAmount: 25000,
        receiptImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop",
        status: "pending",
        submittedDate: "2024-09-18",
        loanId: "L002"
    },
    {
        id: "R003",
        username: "Carol Davis",
        loanAmount: 75000,
        receiptImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop",
        status: "approved",
        submittedDate: "2024-09-17",
        loanId: "L003"
    },
    {
        id: "R004",
        username: "David Wilson",
        loanAmount: 30000,
        receiptImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop",
        status: "rejected",
        submittedDate: "2024-09-16",
        loanId: "L004"
    },
    {
        id: "R005",
        username: "Eva Brown",
        loanAmount: 15000,
        receiptImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop",
        status: "pending",
        submittedDate: "2024-09-15",
        loanId: "L005"
    }
]

// Receipt Modal Component
interface ReceiptModalProps {
    receipt: Receipt | null
    isOpen: boolean
    onClose: () => void
    onApprove: (receiptId: string) => void
    onReject: (receiptId: string) => void
}

function ReceiptModal({ receipt, isOpen, onClose, onApprove, onReject }: ReceiptModalProps) {
    if (!receipt) return null

    const handleApprove = () => {
        onApprove(String(receipt.id))
        onClose()
    }

    const handleReject = () => {
        onReject(String(receipt.id))
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Receipt Review</DialogTitle>
                    <DialogDescription>
                        Review the receipt for {receipt.username} - Loan Amount: ${receipt.loanAmount.toLocaleString()}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex justify-center">
                        <img
                            src={receipt.receiptImage}
                            alt={`Receipt for ${receipt.username}`}
                            className="max-w-full h-auto rounded-lg border shadow-sm"
                            style={{ maxHeight: "400px" }}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium">Username:</span> {receipt.username}
                        </div>
                        <div>
                            <span className="font-medium">Loan Amount:</span> ${receipt.loanAmount.toLocaleString()}
                        </div>
                        <div>
                            <span className="font-medium">Submitted Date:</span> {new Date(receipt.submittedDate).toLocaleDateString('en-US')}
                        </div>
                        <div>
                            <span className="font-medium">Status:</span>
                            <Badge className={`ml-2 ${receipt.status === "approved" ? "bg-green-100 text-green-800" :
                                receipt.status === "rejected" ? "bg-red-100 text-red-800" :
                                    "bg-yellow-100 text-yellow-800"
                                }`}>
                                {receipt.status}
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
                    {receipt.status === "pending" && (
                        <>
                            <Button
                                variant="destructive"
                                onClick={handleReject}
                                className="flex items-center gap-2"
                            >
                                <X className="h-4 w-4" />
                                Reject
                            </Button>
                            <Button
                                onClick={handleApprove}
                                className="flex items-center gap-2"
                            >
                                <Check className="h-4 w-4" />
                                Approve
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// Receipts Table Component
interface ReceiptsTableProps {
    receipts: Receipt[]
    onViewReceipt: (receipt: Receipt) => void
}

function ReceiptsTable({ receipts, onViewReceipt }: ReceiptsTableProps) {
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
                        <TableHead>Username</TableHead>
                        <TableHead>Loan Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted Date</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {receipts.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No receipts found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        receipts.map((receipt) => (
                            <TableRow key={receipt.id}>
                                <TableCell className="font-medium">{receipt.username}</TableCell>
                                <TableCell>{formatCurrency(receipt.loanAmount)}</TableCell>
                                <TableCell>{getStatusBadge(receipt.status)}</TableCell>
                                <TableCell>{new Date(receipt.submittedDate).toLocaleDateString('en-US')}</TableCell>
                                <TableCell>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onViewReceipt(receipt)}
                                        className="flex items-center gap-2"
                                    >
                                        <Eye className="h-4 w-4" />
                                        View Receipt
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

// Main Receipts Page Component
export default function Receipts() {
    const [receipts, setReceipts] = useState<Receipt[]>([])
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    useEffect(() => {
        fetchReceipts()
    }, [])

    const fetchReceipts = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/receipts?limit=100')
            const data = await response.json()
            
            if (data.success) {
                setReceipts(data.data.receipts || [])
            } else {
                setError(data.error || 'Failed to fetch receipts')
            }
        } catch (err) {
            setError('Failed to fetch receipts')
            console.error('Error fetching receipts:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleViewReceipt = (receipt: Receipt) => {
        setSelectedReceipt(receipt)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setSelectedReceipt(null)
    }

    const handleApprove = async (receiptId: string | number) => {
        try {
            const response = await fetch('/api/receipts', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    receiptId,
                    status: 'approved'
                })
            })

            const data = await response.json()
            
            if (data.success) {
                setReceipts(prev =>
                    prev.map(receipt =>
                        receipt.id === receiptId
                            ? { ...receipt, status: "approved" as const }
                            : receipt
                    )
                )
                console.log("Receipt approved:", receiptId)
            } else {
                console.error("Failed to approve receipt:", data.error)
            }
        } catch (error) {
            console.error("Error approving receipt:", error)
        }
    }

    const handleReject = async (receiptId: string | number) => {
        try {
            const response = await fetch('/api/receipts', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    receiptId,
                    status: 'rejected'
                })
            })

            const data = await response.json()
            
            if (data.success) {
                setReceipts(prev =>
                    prev.map(receipt =>
                        receipt.id === receiptId
                            ? { ...receipt, status: "rejected" as const }
                            : receipt
                    )
                )
                console.log("Receipt rejected:", receiptId)
            } else {
                console.error("Failed to reject receipt:", data.error)
            }
        } catch (error) {
            console.error("Error rejecting receipt:", error)
        }
    }

    const totalPages = Math.ceil(receipts.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedReceipts = receipts.slice(startIndex, endIndex)

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Receipts</h1>
                    <p className="text-muted-foreground">
                        Review and manage loan payment receipts
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="text-muted-foreground">Loading receipts...</div>
                    </div>
                ) : error ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="text-red-500">{error}</div>
                    </div>
                ) : (
                    <>
                        <ReceiptsTable
                            receipts={paginatedReceipts}
                            onViewReceipt={handleViewReceipt}
                        />
                        
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between py-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {startIndex + 1} to {Math.min(endIndex, receipts.length)} of {receipts.length} receipts
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

                <ReceiptModal
                    receipt={selectedReceipt}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onApprove={handleApprove}
                    onReject={handleReject}
                />
            </div>
        </DashboardLayout>
 
)
}