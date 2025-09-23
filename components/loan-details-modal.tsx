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
import { Calendar, DollarSign, TrendingUp, User, Clock, CheckCircle2, AlertCircle } from "lucide-react"

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
            active: "bg-gray-100 text-gray-800",
            running: "bg-gray-100 text-gray-800",
            pending: "bg-gray-200 text-gray-900",
            overdue: "bg-gray-300 text-black",
            completed: "bg-gray-100 text-gray-800",
            rejected: "bg-gray-200 text-gray-900",
        }
        return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
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

                        <div className="flex justify-end pt-4 border-t">
                            <Button variant="outline" onClick={onClose}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}