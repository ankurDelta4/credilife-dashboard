"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, DollarSign, TrendingUp, User, Clock, CheckCircle2, AlertCircle, HandCoins, XCircle } from "lucide-react"

interface LoanDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    loan: any | null
}

export function LoanDetailsModal({
    isOpen,
    onClose,
    loan,
}: LoanDetailsModalProps) {
    const [loanDetails, setLoanDetails] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showSettlementDialog, setShowSettlementDialog] = useState(false)
    const [showTerminateDialog, setShowTerminateDialog] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        if (loan && isOpen) {
            fetchLoanDetails()
        }
    }, [loan?.id, isOpen])

    const fetchLoanDetails = async () => {
        if (!loan?.id) return
        
        try {
            setLoading(true)
            setError(null)
            const response = await fetch(`/api/loans/${loan.id}`)
            const data = await response.json()
            
            if (data.success) {
                setLoanDetails(data.data)
            } else {
                setError(data.error || 'Failed to fetch loan details')
            }
        } catch (err) {
            setError('Failed to fetch loan details')
            console.error('Error fetching loan details:', err)
        } finally {
            setLoading(false)
        }
    }

    if (!loan) return null

    // Calculate loan details using real Supabase data
    const calculateLoanDetails = () => {
        // Use API data if available, otherwise fall back to loan data
        const apiData = loanDetails?.loan || loan
        const principalAmount = apiData?.principal_amount || apiData?.amount || 0
        const termMonths = apiData?.tenure || (typeof loan.termMonths === 'string' ? parseInt(loan.termMonths) || 12 : loan.termMonths || 12)
        const repaymentFrequency = apiData?.repayment_type || loan.repaymentType || 'monthly'
        
        // Use real API values from Supabase
        const closingFee = apiData?.closing_fees || 0
        const totalInterest = apiData?.interest_amount || 0
        const totalAmount = apiData?.total_repayment || 0
        const paidAmount = apiData?.amount_paid || 0
        
        // Calculate installments based on installments data
        const installmentsData = apiData?.installments || []
        const totalInstallments = termMonths // Based on tenure
        
        // Calculate paid installments from installments data
        const paidInstallments = installmentsData.filter((inst: any) => inst.payment_verified === true).length
        const remainingInstallments = totalInstallments - paidInstallments
        
        // Calculate installment amount
        const installmentAmount = totalInstallments > 0 ? totalAmount / totalInstallments : 0
        
        const remainingAmount = totalAmount - paidAmount
        const progressPercentage = totalInstallments > 0 ? (paidInstallments / totalInstallments) * 100 : 0

        // Calculate interest rate based on actual data
        const monthlyRatePercent = principalAmount > 0 ? ((totalInterest / principalAmount) / termMonths * 100).toFixed(2) : "0.00"

        return {
            emi: Math.round(installmentAmount),
            totalAmount: Math.round(totalAmount),
            totalInterest: Math.round(totalInterest),
            closingFee: Math.round(closingFee),
            paidEMIs: paidInstallments,
            remainingEMIs: remainingInstallments,
            paidAmount: Math.round(paidAmount),
            remainingAmount: Math.round(remainingAmount),
            progressPercentage: Math.round(progressPercentage),
            termMonths,
            installments: totalInstallments,
            principalAmount,
            monthlyRatePercent,
            installmentsData
        }
    }

    const calculatedDetails = calculateLoanDetails()

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount)
    }

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        } catch {
            return dateString
        }
    }

    const getStatusColor = (status: string) => {
        const colors = {
            active: "bg-green-100 text-green-800",
            running: "bg-green-100 text-green-800",
            pending: "bg-yellow-100 text-yellow-800",
            overdue: "bg-red-100 text-red-800",
            completed: "bg-green-100 text-green-800",
            settled: "bg-green-100 text-green-800",
            terminated: "bg-red-100 text-red-800",
            rejected: "bg-red-100 text-red-800",
        }
        return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
    }

    const handleSettlement = async () => {
        if (!loan?.id) return
        
        try {
            setActionLoading(true)
            const response = await fetch(`/api/loans/${loan.id}/settle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            
            const data = await response.json()
            
            if (data.success) {
                setShowSettlementDialog(false)
                // Refresh loan details
                await fetchLoanDetails()
                alert('Loan settled successfully!')
            } else {
                alert(data.error || 'Failed to settle loan')
            }
        } catch (error) {
            console.error('Error settling loan:', error)
            alert('Failed to settle loan')
        } finally {
            setActionLoading(false)
        }
    }

    const handleTermination = async () => {
        if (!loan?.id) return
        
        try {
            setActionLoading(true)
            const response = await fetch(`/api/loans/${loan.id}/terminate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            
            const data = await response.json()
            
            if (data.success) {
                setShowTerminateDialog(false)
                // Refresh loan details
                await fetchLoanDetails()
                alert('Loan terminated successfully!')
            } else {
                alert(data.error || 'Failed to terminate loan')
            }
        } catch (error) {
            console.error('Error terminating loan:', error)
            alert('Failed to terminate loan')
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-7xl w-[98vw] max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Loan Details - {loan.id}</span>
                        <Badge className={getStatusColor((loanDetails?.loan || loan)?.status || loan.status)}>
                            {((loanDetails?.loan || loan)?.status || loan.status)?.charAt(0).toUpperCase() + ((loanDetails?.loan || loan)?.status || loan.status)?.slice(1)}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        Comprehensive loan information and payment details
                    </DialogDescription>
                </DialogHeader>

                {loading && (
                    <div className="flex justify-center items-center py-8">
                        <div className="text-muted-foreground">Loading loan details...</div>
                    </div>
                )}

                {error && (
                    <div className="flex justify-center items-center py-8">
                        <div className="text-red-500">{error}</div>
                    </div>
                )}

                {!loading && !error && (
                    <div className="space-y-6">
                {/* Customer Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Customer Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <span className="text-sm font-medium text-gray-600">Customer ID:</span>
                            <p className="text-lg font-semibold break-all">{(loanDetails?.loan || loan)?.user_id || loan.userId || 'N/A'}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-600">Loan ID:</span>
                            <p className="text-lg font-semibold break-all">{loan.id}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-600">Start Date:</span>
                            <p className="text-sm">{formatDate((loanDetails?.loan || loan)?.start_date || loan.createdAt)}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-600">End Date:</span>
                            <p className="text-sm">{formatDate((loanDetails?.loan || loan)?.end_date || loan.endDate || loan.updatedAt)}</p>
                        </div>
                    </CardContent>
                </Card>
    
                {/* Loan Amount Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Loan Amount Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg border">
                            <p className="text-sm font-medium text-gray-600">Principal Amount</p>
                            <p className="text-xl lg:text-2xl font-bold text-black">{formatCurrency(calculatedDetails.principalAmount)}</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg border">
                            <p className="text-sm font-medium text-gray-600">Total Interest</p>
                            <p className="text-xl lg:text-2xl font-bold text-black">{formatCurrency(calculatedDetails.totalInterest)}</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg border">
                            <p className="text-sm font-medium text-gray-600">Closing Fee</p>
                            <p className="text-xl lg:text-2xl font-bold text-black">{formatCurrency(calculatedDetails.closingFee)}</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg border">
                            <p className="text-sm font-medium text-gray-600">Total Amount</p>
                            <p className="text-xl lg:text-2xl font-bold text-black">{formatCurrency(calculatedDetails.totalAmount)}</p>
                        </div>
                    </CardContent>
                </Card>
    
                {/* Installment Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Installment Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                                <span className="text-sm font-medium text-gray-600">Installment Amount:</span>
                                <p className="text-lg lg:text-xl font-bold text-black">{formatCurrency(calculatedDetails.emi)}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-600">Tenure:</span>
                                <p className="text-lg lg:text-xl font-bold">{calculatedDetails.termMonths} months</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-600">Interest Rate:</span>
                                <p className="text-lg lg:text-xl font-bold">{calculatedDetails.monthlyRatePercent}% per month</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-600">Repayment Type:</span>
                                <p className="text-lg lg:text-xl font-bold">{loan.repaymentType || 'Monthly'}</p>
                            </div>
                        </div>
    
                        {/* Payment Progress */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Payment Progress</span>
                                <span className="text-sm text-gray-600">{calculatedDetails.progressPercentage}% completed</span>
                            </div>
                            <Progress value={calculatedDetails.progressPercentage} className="h-3" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-gray-600" />
                                    <span>Paid Installments: {calculatedDetails.paidEMIs}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-gray-600" />
                                    <span>Remaining Installments: {calculatedDetails.remainingEMIs}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
    
                {/* Payment Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Payment Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Amount Paid:</span>
                                <span className="font-semibold text-black">{formatCurrency(calculatedDetails.paidAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Remaining Amount:</span>
                                <span className="font-semibold text-black">{formatCurrency(calculatedDetails.remainingAmount)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                                <span className="font-medium">Total Loan Amount:</span>
                                <span className="font-bold">{formatCurrency(calculatedDetails.totalAmount)}</span>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Next Installment Due</p>
                                <p className="font-bold text-lg">{formatCurrency(calculatedDetails.emi)}</p>
                                <p className="text-xs text-gray-500">
                                    {loan.status === 'overdue' ? 'Overdue!' : 'Due on next payment date'}
                                </p>
                            </div>
                            {loan.status === 'overdue' && (
                                <div className="flex items-center gap-2 text-gray-800 bg-gray-100 p-3 rounded-lg border">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="text-sm font-medium">Payment Overdue</span>
                                </div>
                            )}
                        </div>
    
                        {/* Additional space for better layout on larger screens */}
                        <div className="hidden lg:block"></div>
                    </CardContent>
                </Card>

                        {/* Action Buttons for Active Loans (not completed or terminated) */}
                        {((loanDetails?.loan || loan)?.status !== 'completed') && 
                         ((loanDetails?.loan || loan)?.status !== 'terminated') &&
                         ((loanDetails?.loan || loan)?.status !== 'settled') && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Loan Actions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-4">
                                        <Button 
                                            onClick={() => setShowSettlementDialog(true)}
                                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                                            disabled={actionLoading}
                                        >
                                            <HandCoins className="h-4 w-4" />
                                            Settlement
                                        </Button>
                                        <Button 
                                            onClick={() => setShowTerminateDialog(true)}
                                            variant="destructive"
                                            className="flex items-center gap-2"
                                            disabled={actionLoading}
                                        >
                                            <XCircle className="h-4 w-4" />
                                            Terminate Loan
                                        </Button>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Settlement: Mark loan as fully paid | Terminate: Cancel the loan
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex justify-end pt-4 border-t">
                            <Button variant="outline" onClick={onClose}>
                                Close
                            </Button>
                        </div>

                        {/* Settlement Confirmation Dialog */}
                        <Dialog open={showSettlementDialog} onOpenChange={setShowSettlementDialog}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Settlement Confirmation</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to settle this loan? This action will mark the loan as fully paid and completed.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <h4 className="font-medium text-green-800">Settlement Details:</h4>
                                        <ul className="text-sm text-green-700 mt-2 space-y-1">
                                            <li>• Loan will be marked as completed</li>
                                            <li>• Remaining amount: {formatCurrency(calculatedDetails.remainingAmount)}</li>
                                            <li>• Customer will be notified</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setShowSettlementDialog(false)}
                                        disabled={actionLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        onClick={() => handleSettlement()}
                                        className="bg-green-600 hover:bg-green-700"
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Processing...' : 'Confirm Settlement'}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* Terminate Confirmation Dialog */}
                        <Dialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Terminate Loan Confirmation</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to terminate this loan? This action cannot be undone.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <h4 className="font-medium text-red-800">Termination Details:</h4>
                                        <ul className="text-sm text-red-700 mt-2 space-y-1">
                                            <li>• Loan will be cancelled immediately</li>
                                            <li>• All future payments will be stopped</li>
                                            <li>• Customer will be notified</li>
                                            <li>• This action cannot be reversed</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setShowTerminateDialog(false)}
                                        disabled={actionLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        variant="destructive"
                                        onClick={() => handleTermination()}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Processing...' : 'Confirm Termination'}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}