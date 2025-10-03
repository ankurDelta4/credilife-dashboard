"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, AlertCircle, User, Phone, Mail, MapPin, Building, DollarSign, Calculator } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { calculateInstallments } from "@/lib/utils/loan-calculations"

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

export default function EditLoanApplicationPage({ 
    params 
}: { 
    params: Promise<{ id: string }> 
}) {
    const [id, setId] = useState<string>("")
    const [application, setApplication] = useState<LoanApplication | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        requested_amount: "",
        loan_purpose: "",
        tenure: "",
        repayment_type: "",
        status: "",
        interest_amount: "",
        principal_amount: "",
        closing_fees: "",
        total_repayment: ""
    })
    const [userData, setUserData] = useState<any>(null)
    const [userDataError, setUserDataError] = useState<string | null>(null)
    
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
                const app = data.data.application
                setApplication(app)
                
                // Check if application can be edited
                if (app.status === 'approved') {
                    setError('Cannot edit approved loan applications')
                    return
                }
                
                // Populate form data
                setFormData({
                    requested_amount: app.requested_amount?.toString() || "",
                    loan_purpose: app.loan_purpose || "",
                    tenure: app.tenure?.toString() || "",
                    repayment_type: app.repayment_type || "",
                    status: app.status || "",
                    interest_amount: app.interest_amount?.toString() || "0",
                    principal_amount: app.principal_amount?.toString() || app.requested_amount?.toString() || "",
                    closing_fees: app.closing_fees?.toString() || "0",
                    total_repayment: app.total_repayment?.toString() || app.requested_amount?.toString() || ""
                })

                // Parse user_data
                if (app.user_data) {
                    try {
                        let parsedUserData = app.user_data
                        if (typeof app.user_data === 'string') {
                            parsedUserData = JSON.parse(app.user_data)
                        }
                        setUserData(parsedUserData)
                        setUserDataError(null)
                    } catch (e) {
                        console.error('Failed to parse user_data:', e)
                        setUserDataError('Invalid JSON format in user data')
                        setUserData(app.user_data) // Keep the raw string for editing
                    }
                } else {
                    setUserData({})
                }
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

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => {
            const updated = {
                ...prev,
                [field]: value
            }
            
            // Auto-calculate financial details when amount or tenure changes
            if ((field === 'requested_amount' || field === 'tenure' || field === 'repayment_type') && 
                updated.requested_amount && updated.tenure && updated.repayment_type) {
                try {
                    const amount = parseFloat(updated.requested_amount)
                    const tenure = parseInt(updated.tenure)
                    
                    if (amount >= 2500 && amount <= 30000 && (tenure === 3 || tenure === 6)) {
                        const calculation = calculateInstallments(amount, tenure, updated.repayment_type)
                        
                        return {
                            ...updated,
                            principal_amount: calculation.principal.toString(),
                            interest_amount: calculation.totalInterest.toString(),
                            closing_fees: calculation.closingFee.toString(),
                            total_repayment: calculation.totalRepayment.toString()
                        }
                    }
                } catch (error) {
                    console.error('Calculation error:', error)
                }
            }
            
            return updated
        })
    }

    const handleUserDataChange = (field: string, value: string) => {
        setUserData((prev: any) => ({
            ...prev,
            [field]: value
        }))
        setUserDataError(null)
    }

    const validateUserData = () => {
        if (!userData) return true
        
        try {
            if (typeof userData === 'string') {
                JSON.parse(userData)
            }
            return true
        } catch (e) {
            setUserDataError('Invalid JSON format')
            return false
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            
            // Validate required fields
            if (!formData.requested_amount || !formData.tenure) {
                toast({
                    variant: "destructive",
                    title: "Validation Error",
                    description: "Please fill in all required fields: Requested Amount and Tenure"
                })
                return
            }

            // Validate amount range
            const amount = parseFloat(formData.requested_amount)
            if (amount < 2500 || amount > 30000) {
                toast({
                    variant: "destructive",
                    title: "Invalid Amount",
                    description: "Requested amount must be between $2,500 and $30,000"
                })
                return
            }

            // Validate user data
            if (!validateUserData()) {
                toast({
                    variant: "destructive",
                    title: "Validation Error",
                    description: "Please fix user data format errors"
                })
                return
            }

            const updateData = {
                requested_amount: parseFloat(formData.requested_amount),
                loan_purpose: formData.loan_purpose,
                tenure: parseInt(formData.tenure),
                repayment_type: formData.repayment_type,
                status: formData.status,
                interest_amount: parseFloat(formData.interest_amount) || 0,
                principal_amount: parseFloat(formData.principal_amount) || parseFloat(formData.requested_amount),
                closing_fees: parseFloat(formData.closing_fees) || 0,
                total_repayment: parseFloat(formData.total_repayment) || parseFloat(formData.requested_amount),
                user_data: userData
            }
            
            const response = await fetch(`/api/loan-applications/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            })
            
            const data = await response.json()
            
            if (data.success) {
                toast({
                    variant: "success",
                    title: "Success",
                    description: "Loan application updated successfully"
                })
                router.push(`/loan-applications/${id}`)
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: data.error || "Failed to update loan application"
                })
            }
        } catch (error) {
            console.error('Error updating loan application:', error)
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update loan application"
            })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center py-8">
                    <div className="text-muted-foreground">Loading loan application...</div>
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
                        onClick={() => router.push(`/loan-applications/${id}`)}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Details
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
                            The loan application you're trying to edit doesn't exist.
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="outline" 
                            onClick={() => router.push(`/loan-applications/${id}`)}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Details
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                Edit Loan Application #{application.id}
                            </h1>
                            <p className="text-muted-foreground">
                                Update loan application details
                            </p>
                        </div>
                    </div>
                    
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>

                {/* Edit Form */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>
                                Update the basic loan application details
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="requested_amount">Requested Amount * (Min: $2,500 - Max: $30,000)</Label>
                                <Input
                                    id="requested_amount"
                                    type="number"
                                    min="2500"
                                    max="30000"
                                    value={formData.requested_amount}
                                    onChange={(e) => handleInputChange('requested_amount', e.target.value)}
                                    placeholder="2500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="loan_purpose">Loan Purpose</Label>
                                <Input
                                    id="loan_purpose"
                                    value={formData.loan_purpose}
                                    onChange={(e) => handleInputChange('loan_purpose', e.target.value)}
                                    placeholder="Enter loan purpose"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tenure">Tenure *</Label>
                                <Select value={formData.tenure} onValueChange={(value) => handleInputChange('tenure', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select tenure" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="3">3 months</SelectItem>
                                        <SelectItem value="6">6 months</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="repayment_type">Repayment Type</Label>
                                <Select value={formData.repayment_type} onValueChange={(value) => handleInputChange('repayment_type', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select repayment type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="creating">Creating</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Financial Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calculator className="h-5 w-5" />
                                Financial Details
                            </CardTitle>
                            <CardDescription>
                                Financial breakdown - automatically calculated based on amount and tenure
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="principal_amount">Principal Amount (Auto-calculated)</Label>
                                <Input
                                    id="principal_amount"
                                    type="number"
                                    value={formData.principal_amount}
                                    onChange={(e) => handleInputChange('principal_amount', e.target.value)}
                                    placeholder="Auto-calculated from requested amount"
                                    className="bg-gray-50"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="interest_amount">Interest Amount (Auto-calculated)</Label>
                                <Input
                                    id="interest_amount"
                                    type="number"
                                    value={formData.interest_amount}
                                    onChange={(e) => handleInputChange('interest_amount', e.target.value)}
                                    placeholder="Auto-calculated based on tenure"
                                    className="bg-gray-50"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="closing_fees">Closing Fees (Auto-calculated)</Label>
                                <Input
                                    id="closing_fees"
                                    type="number"
                                    value={formData.closing_fees}
                                    onChange={(e) => handleInputChange('closing_fees', e.target.value)}
                                    placeholder="Auto-calculated (5% of principal)"
                                    className="bg-gray-50"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="total_repayment">Total Repayment (Auto-calculated)</Label>
                                <Input
                                    id="total_repayment"
                                    type="number"
                                    value={formData.total_repayment}
                                    onChange={(e) => handleInputChange('total_repayment', e.target.value)}
                                    placeholder="Auto-calculated total"
                                    className="bg-gray-50"
                                />
                            </div>

                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                                <div className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                                    <Calculator className="h-4 w-4" />
                                    Auto-Calculation Summary:
                                </div>
                                <div className="space-y-1 text-blue-700">
                                    <div>Principal: ${parseFloat(formData.principal_amount || "0").toLocaleString()}</div>
                                    <div>Interest (20% monthly): ${parseFloat(formData.interest_amount || "0").toLocaleString()}</div>
                                    <div>Closing Fees (5%): ${parseFloat(formData.closing_fees || "0").toLocaleString()}</div>
                                    <div className="border-t border-blue-300 pt-1 font-medium">
                                        Total Repayment: ${(
                                            parseFloat(formData.principal_amount || "0") + 
                                            parseFloat(formData.interest_amount || "0") + 
                                            parseFloat(formData.closing_fees || "0")
                                        ).toLocaleString()}
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-blue-600">
                                    💡 Values update automatically when you change amount, tenure, or repayment type
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* User Data */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                User Information
                            </CardTitle>
                            <CardDescription>
                                Update applicant personal and contact information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {userData && typeof userData === 'object' && !Array.isArray(userData) ? (
                                <div className="space-y-4">
                                    {/* Personal Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="first_name" className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                First Name
                                            </Label>
                                            <Input
                                                id="first_name"
                                                value={userData.first_name || ""}
                                                onChange={(e) => handleUserDataChange('first_name', e.target.value)}
                                                placeholder="Enter first name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="last_name" className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                Last Name
                                            </Label>
                                            <Input
                                                id="last_name"
                                                value={userData.last_name || ""}
                                                onChange={(e) => handleUserDataChange('last_name', e.target.value)}
                                                placeholder="Enter last name"
                                            />
                                        </div>
                                    </div>

                                    {/* Contact Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="flex items-center gap-1">
                                                <Mail className="h-3 w-3" />
                                                Email
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={userData.email || ""}
                                                onChange={(e) => handleUserDataChange('email', e.target.value)}
                                                placeholder="Enter email address"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="whatsapp_number" className="flex items-center gap-1">
                                                <Phone className="h-3 w-3" />
                                                WhatsApp Number
                                            </Label>
                                            <Input
                                                id="whatsapp_number"
                                                value={userData.whatsapp_number || ""}
                                                onChange={(e) => handleUserDataChange('whatsapp_number', e.target.value)}
                                                placeholder="Enter WhatsApp number"
                                            />
                                        </div>
                                    </div>

                                    {/* Address Information */}
                                    <div className="space-y-2">
                                        <Label htmlFor="address" className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            Address
                                        </Label>
                                        <Textarea
                                            id="address"
                                            value={userData.address || ""}
                                            onChange={(e) => handleUserDataChange('address', e.target.value)}
                                            placeholder="Enter full address"
                                            rows={2}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="province">Province</Label>
                                            <Select value={userData.province || ""} onValueChange={(value) => handleUserDataChange('province', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select province" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Azua">Azua</SelectItem>
                                                    <SelectItem value="Baoruco">Baoruco</SelectItem>
                                                    <SelectItem value="Barahona">Barahona</SelectItem>
                                                    <SelectItem value="Dajabón">Dajabón</SelectItem>
                                                    <SelectItem value="Distrito Nacional">Distrito Nacional</SelectItem>
                                                    <SelectItem value="Duarte">Duarte</SelectItem>
                                                    <SelectItem value="Elías Piña">Elías Piña</SelectItem>
                                                    <SelectItem value="El Seibo">El Seibo</SelectItem>
                                                    <SelectItem value="Espaillat">Espaillat</SelectItem>
                                                    <SelectItem value="Hato Mayor">Hato Mayor</SelectItem>
                                                    <SelectItem value="Hermanas Mirabal">Hermanas Mirabal</SelectItem>
                                                    <SelectItem value="Independencia">Independencia</SelectItem>
                                                    <SelectItem value="La Altagracia">La Altagracia</SelectItem>
                                                    <SelectItem value="La Romana">La Romana</SelectItem>
                                                    <SelectItem value="La Vega">La Vega</SelectItem>
                                                    <SelectItem value="María Trinidad Sánchez">María Trinidad Sánchez</SelectItem>
                                                    <SelectItem value="Monseñor Nouel">Monseñor Nouel</SelectItem>
                                                    <SelectItem value="Monte Cristi">Monte Cristi</SelectItem>
                                                    <SelectItem value="Monte Plata">Monte Plata</SelectItem>
                                                    <SelectItem value="Pedernales">Pedernales</SelectItem>
                                                    <SelectItem value="Peravia">Peravia</SelectItem>
                                                    <SelectItem value="Puerto Plata">Puerto Plata</SelectItem>
                                                    <SelectItem value="Samaná">Samaná</SelectItem>
                                                    <SelectItem value="Sánchez Ramírez">Sánchez Ramírez</SelectItem>
                                                    <SelectItem value="San Cristóbal">San Cristóbal</SelectItem>
                                                    <SelectItem value="San José de Ocoa">San José de Ocoa</SelectItem>
                                                    <SelectItem value="San Juan">San Juan</SelectItem>
                                                    <SelectItem value="San Pedro de Macorís">San Pedro de Macorís</SelectItem>
                                                    <SelectItem value="Santiago">Santiago</SelectItem>
                                                    <SelectItem value="Santiago Rodríguez">Santiago Rodríguez</SelectItem>
                                                    <SelectItem value="Santo Domingo">Santo Domingo</SelectItem>
                                                    <SelectItem value="Valverde">Valverde</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="id_number">ID Number (11 digits)</Label>
                                            <Input
                                                id="id_number"
                                                maxLength={11}
                                                value={userData.id_number || ""}
                                                onChange={(e) => handleUserDataChange('id_number', e.target.value)}
                                                placeholder="12345678901"
                                            />
                                        </div>
                                    </div>

                                    {/* Personal Details */}
                                    <div className="border-t pt-4 space-y-4">
                                        <h4 className="font-medium">Personal Details</h4>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="house_type">Type of Housing</Label>
                                                <Select value={userData.house_type || ""} onValueChange={(value) => handleUserDataChange('house_type', value)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select housing type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Owned">Owned</SelectItem>
                                                        <SelectItem value="Rented">Rented</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="living_time_at_address">Time Living at Address</Label>
                                                <Input
                                                    id="living_time_at_address"
                                                    value={userData.living_time_at_address || ""}
                                                    onChange={(e) => handleUserDataChange('living_time_at_address', e.target.value)}
                                                    placeholder="e.g., 2 years"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="marital_status">Marital Status</Label>
                                                <Select value={userData.marital_status || ""} onValueChange={(value) => handleUserDataChange('marital_status', value)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select marital status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Single">Single</SelectItem>
                                                        <SelectItem value="Married">Married</SelectItem>
                                                        <SelectItem value="Common-law union">Common-law union</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="children_count">Number of Children</Label>
                                                <Input
                                                    id="children_count"
                                                    type="number"
                                                    value={userData.children_count || ""}
                                                    onChange={(e) => handleUserDataChange('children_count', e.target.value)}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="family_reference">Family Reference</Label>
                                                <Textarea
                                                    id="family_reference"
                                                    value={userData.family_reference || ""}
                                                    onChange={(e) => handleUserDataChange('family_reference', e.target.value)}
                                                    placeholder="Name, relationship, and phone"
                                                    rows={2}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="personal_reference">Personal Reference</Label>
                                                <Textarea
                                                    id="personal_reference"
                                                    value={userData.personal_reference || ""}
                                                    onChange={(e) => handleUserDataChange('personal_reference', e.target.value)}
                                                    placeholder="Name and phone number of a friend"
                                                    rows={2}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Employment Information */}
                                    <div className="border-t pt-4 space-y-4">
                                        <h4 className="font-medium flex items-center gap-2">
                                            <Building className="h-4 w-4" />
                                            Employment Details
                                        </h4>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="employment_status">Employment Status</Label>
                                                <Select 
                                                    value={userData.employment_status || ""} 
                                                    onValueChange={(value) => handleUserDataChange('employment_status', value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select employment status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Employed">Employed</SelectItem>
                                                        <SelectItem value="Self working">Self working</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="company_name">Company Name</Label>
                                                <Input
                                                    id="company_name"
                                                    value={userData.company_name || ""}
                                                    onChange={(e) => handleUserDataChange('company_name', e.target.value)}
                                                    placeholder="Enter company name"
                                                />
                                            </div>
                                        </div>

                                        {/* Conditional fields based on employment status */}
                                        {userData.employment_status === "Employed" && (
                                            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border">
                                                <h5 className="font-medium text-blue-800">Employment Details</h5>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="supervisor_name">Supervisor (Name and mobile)</Label>
                                                        <Input
                                                            id="supervisor_name"
                                                            value={userData.supervisor_name || ""}
                                                            onChange={(e) => handleUserDataChange('supervisor_name', e.target.value)}
                                                            placeholder="Name and mobile number"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="time_in_company">Time in Company</Label>
                                                        <Input
                                                            id="time_in_company"
                                                            value={userData.time_in_company || ""}
                                                            onChange={(e) => handleUserDataChange('time_in_company', e.target.value)}
                                                            placeholder="e.g., 2 years"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="company_payment_method">Company Payment Method</Label>
                                                        <Select value={userData.company_payment_method || ""} onValueChange={(value) => handleUserDataChange('company_payment_method', value)}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select payment method" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Cash">Cash</SelectItem>
                                                                <SelectItem value="Bank transfer">Bank transfer</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="payment_date">Payment Date</Label>
                                                        <Input
                                                            id="payment_date"
                                                            value={userData.payment_date || ""}
                                                            onChange={(e) => handleUserDataChange('payment_date', e.target.value)}
                                                            placeholder="e.g., 15th of each month"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="monthly_income">Monthly Income</Label>
                                                        <Input
                                                            id="monthly_income"
                                                            type="number"
                                                            value={userData.monthly_income || ""}
                                                            onChange={(e) => handleUserDataChange('monthly_income', e.target.value)}
                                                            placeholder="Enter monthly income"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="month_end_saving">Monthly Savings</Label>
                                                        <Input
                                                            id="month_end_saving"
                                                            type="number"
                                                            value={userData.month_end_saving || ""}
                                                            onChange={(e) => handleUserDataChange('month_end_saving', e.target.value)}
                                                            placeholder="Money left each month"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="company_number">Company Phone Number</Label>
                                                        <Input
                                                            id="company_number"
                                                            value={userData.company_number || ""}
                                                            onChange={(e) => handleUserDataChange('company_number', e.target.value)}
                                                            placeholder="18091234567"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="hr_email">HR Email</Label>
                                                        <Input
                                                            id="hr_email"
                                                            type="email"
                                                            value={userData.hr_email || ""}
                                                            onChange={(e) => handleUserDataChange('hr_email', e.target.value)}
                                                            placeholder="hr@company.com"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="company_site">Company Website</Label>
                                                        <Input
                                                            id="company_site"
                                                            value={userData.company_site || ""}
                                                            onChange={(e) => handleUserDataChange('company_site', e.target.value)}
                                                            placeholder="https://company.com"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="occupation">Occupation/Position</Label>
                                                        <Input
                                                            id="occupation"
                                                            value={userData.occupation || ""}
                                                            onChange={(e) => handleUserDataChange('occupation', e.target.value)}
                                                            placeholder="Your job title"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="company_address">Company Address</Label>
                                                    <Textarea
                                                        id="company_address"
                                                        value={userData.company_address || ""}
                                                        onChange={(e) => handleUserDataChange('company_address', e.target.value)}
                                                        placeholder="Full company address"
                                                        rows={2}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {userData.employment_status === "Self working" && (
                                            <div className="space-y-4 p-4 bg-green-50 rounded-lg border">
                                                <h5 className="font-medium text-green-800">Business Details</h5>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="business_activity">Business Activity</Label>
                                                        <Input
                                                            id="business_activity"
                                                            value={userData.business_activity || ""}
                                                            onChange={(e) => handleUserDataChange('business_activity', e.target.value)}
                                                            placeholder="What business do you do"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="business_duration">Business Duration</Label>
                                                        <Input
                                                            id="business_duration"
                                                            value={userData.business_duration || ""}
                                                            onChange={(e) => handleUserDataChange('business_duration', e.target.value)}
                                                            placeholder="How long operating"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="business_income">Monthly Income</Label>
                                                        <Input
                                                            id="business_income"
                                                            type="number"
                                                            value={userData.business_income || ""}
                                                            onChange={(e) => handleUserDataChange('business_income', e.target.value)}
                                                            placeholder="Business monthly income"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="business_savings">Monthly Savings</Label>
                                                        <Input
                                                            id="business_savings"
                                                            type="number"
                                                            value={userData.business_savings || ""}
                                                            onChange={(e) => handleUserDataChange('business_savings', e.target.value)}
                                                            placeholder="Money left per month"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="business_insta">Business Instagram</Label>
                                                        <Input
                                                            id="business_insta"
                                                            value={userData.business_insta || ""}
                                                            onChange={(e) => handleUserDataChange('business_insta', e.target.value)}
                                                            placeholder="Instagram link"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="business_insta_handle">Instagram Username</Label>
                                                        <Input
                                                            id="business_insta_handle"
                                                            value={userData.business_insta_handle || ""}
                                                            onChange={(e) => handleUserDataChange('business_insta_handle', e.target.value)}
                                                            placeholder="@username"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="business_description">Business Description</Label>
                                                    <Textarea
                                                        id="business_description"
                                                        value={userData.business_description || ""}
                                                        onChange={(e) => handleUserDataChange('business_description', e.target.value)}
                                                        placeholder="Tell us about your business, be descriptive"
                                                        rows={3}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Show additional fields if they exist */}
                                    {(() => {
                                        const handledFields = [
                                            'first_name', 'last_name', 'email', 'whatsapp_number', 'address', 'province', 'id_number',
                                            'house_type', 'living_time_at_address', 'marital_status', 'children_count',
                                            'family_reference', 'personal_reference', 'employment_status', 'company_name', 
                                            'occupation', 'monthly_income', 'supervisor_name', 'time_in_company',
                                            'company_payment_method', 'payment_date', 'month_end_saving', 'company_number',
                                            'hr_email', 'company_site', 'company_address', 'business_activity', 'business_duration',
                                            'business_income', 'business_savings', 'business_insta', 'business_insta_handle',
                                            'business_description'
                                        ]
                                        
                                        const documentFields = [
                                            'id_card_front',
                                            'bank_statements_employed', 
                                            'employment_letter',
                                            'business_location_photos',
                                            'product_photos', 
                                            'supplier_invoices',
                                            'bank_statements_self'
                                        ]
                                        
                                        const additionalFields = Object.keys(userData).filter(key => 
                                            !handledFields.includes(key) && !documentFields.includes(key)
                                        )
                                        
                                        return additionalFields.length > 0 && (
                                            <div className="border-t pt-4">
                                                <h4 className="font-medium mb-3">Additional Fields</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {additionalFields.map((key) => (
                                                        <div key={key} className="space-y-2">
                                                            <Label htmlFor={key} className="capitalize">
                                                                {key.replace(/_/g, ' ')}
                                                            </Label>
                                                            <Input
                                                                id={key}
                                                                value={userData[key] as string || ""}
                                                                onChange={(e) => handleUserDataChange(key, e.target.value)}
                                                                placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })()}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex items-center gap-2 text-yellow-800">
                                            <AlertCircle className="h-4 w-4" />
                                            <span className="font-medium">Raw Data Mode</span>
                                        </div>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            User data is in raw format. Edit carefully to maintain JSON structure.
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="user_data_raw">User Data (JSON)</Label>
                                        <Textarea
                                            id="user_data_raw"
                                            value={typeof userData === 'string' ? userData : JSON.stringify(userData, null, 2)}
                                            onChange={(e) => {
                                                try {
                                                    const parsed = JSON.parse(e.target.value)
                                                    setUserData(parsed)
                                                    setUserDataError(null)
                                                } catch (err) {
                                                    setUserData(e.target.value)
                                                    setUserDataError('Invalid JSON format')
                                                }
                                            }}
                                            rows={10}
                                            className={`font-mono text-sm ${userDataError ? 'border-red-500' : ''}`}
                                            placeholder='{"first_name": "John", "last_name": "Doe", ...}'
                                        />
                                        {userDataError && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {userDataError}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Save Button (Bottom) */}
                <div className="flex justify-end pt-4 border-t">
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/loan-applications/${id}`)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}