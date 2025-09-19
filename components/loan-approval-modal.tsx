"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loan } from "@/lib/mock-data"
import { CheckCircle, XCircle } from "lucide-react"

interface LoanApprovalModalProps {
    isOpen: boolean
    onClose: () => void
    loan: Loan | null
    onApprove: (loan: Loan) => void
    onReject: (loan: Loan) => void
}

export function LoanApprovalModal({
    isOpen,
    onClose,
    loan,
    onApprove,
    onReject,
}: LoanApprovalModalProps) {
    if (!loan) return null

    const handleApprove = () => {
        onApprove(loan)
        onClose()
    }

    const handleReject = () => {
        onReject(loan)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Loan Application Review
                        <Badge
                            variant={loan.status === "pending" ? "secondary" : "default"}
                            className="capitalize"
                        >
                            {loan.status}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        Review the loan application details and decide whether to approve or reject this loan.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-muted-foreground">Customer:</span>
                            <p className="font-medium">{loan.name}</p>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">Loan Amount:</span>
                            <p className="font-medium">
                                {new Intl.NumberFormat("en-US", {
                                    style: "currency",
                                    currency: "USD",
                                }).format(loan.loanAmount)}
                            </p>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">Installments:</span>
                            <p className="font-medium">{loan.installments} months</p>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">Interest Rate:</span>
                            <p className="font-medium">{loan.interestRate}%</p>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">Created:</span>
                            <p className="font-medium">{loan.createdTime.toLocaleDateString()}</p>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">End Date:</span>
                            <p className="font-medium">{loan.endDate.toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                            <strong>Monthly Payment:</strong>{" "}
                            {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "USD",
                            }).format(loan.monthlyPayment)}
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="w-full sm:w-auto"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleReject}
                        className="w-full sm:w-auto"
                    >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject Loan
                    </Button>
                    <Button
                        onClick={handleApprove}
                        className="w-full sm:w-auto"
                    >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve Loan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
