"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  DollarSign,
  Building,
  MapPin,
  Briefcase,
  Users,
  Home,
  Hash,
  CalendarDays,
  Banknote,
  TrendingUp,
  FileCheck,
  Upload,
  Download,
  Eye,
  ChevronRight
} from "lucide-react"
import { KYCDocumentItem } from "./kyc-document-item"

interface LoanApplicationDashboardProps {
  applicationId: string | number
  applicationData: any
}

export function LoanApplicationDashboard({ applicationId, applicationData }: LoanApplicationDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Parse user data with memoization to prevent infinite re-renders
  const userData = useMemo(() => {
    if (!applicationData.user_data) return {}
    
    if (typeof applicationData.user_data === 'string') {
      try {
        return JSON.parse(applicationData.user_data)
      } catch (e) {
        console.error('Failed to parse user_data:', e)
        return {}
      }
    }
    
    return applicationData.user_data
  }, [applicationData.user_data])

  // Derive KYC documents directly from userData
  const kycDocuments = userData.kyc_docs || []

  const refreshApplication = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch(`/api/loan-applications/${applicationId}`)
      const data = await response.json()
      if (data.success && data.data) {
        // Update the application data
        window.location.reload() // Simple refresh for now
      }
    } catch (error) {
      console.error('Failed to refresh:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Calculate progress based on verification status
  const calculateProgress = () => {
    let totalItems = 0
    let completedItems = 0

    // Basic information
    if (userData.first_name) { totalItems++; completedItems++ }
    if (userData.last_name) { totalItems++; completedItems++ }
    if (userData.email) { totalItems++; completedItems++ }
    if (userData.whatsapp_number || userData.whatsapp) { totalItems++; completedItems++ }
    if (userData.id_number) { totalItems++; completedItems++ }
    
    // Address information
    if (userData.address) { totalItems++; completedItems++ }
    if (userData.province) { totalItems++; completedItems++ }
    
    // Employment information
    if (userData.employment_status) { totalItems++; completedItems++ }
    if (userData.monthly_income || userData.business_income) { totalItems++; completedItems++ }
    
    // Documents
    const requiredDocs = ['id_card_front', 'bank_statements', 'employment_letter', 'business_photos']
    requiredDocs.forEach(doc => {
      totalItems++
      if (userData[doc] || kycDocuments.some((d: any) => d.type === doc)) {
        completedItems++
      }
    })

    return totalItems > 0 ? (completedItems / totalItems) * 100 : 0
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'verified': return 'bg-teal-100 text-teal-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'processing': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStageIcon = (stage: string) => {
    switch (stage?.toLowerCase()) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'verified': return <CheckCircle className="h-4 w-4" />
      case 'approved': return <FileCheck className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  // Map complex stages to simplified stages
  const getSimplifiedStage = (currentStage: string) => {
    const stage = currentStage?.toLowerCase() || ''
    
    if (['application_submitted', 'documents_uploaded', 'under_review', 'creating', 'processing', 'pending'].includes(stage)) {
      return 'pending'
    }
    if (stage === 'verified' || stage === 'verification' || stage === 'under-verification' || stage === 'under_verification') {
      return 'verified'
    }
    if (stage === 'approved' || stage === 'disbursed') {
      return 'approved'
    }
    if (stage === 'rejected' || stage === 'declined') {
      return 'rejected'
    }
    
    // Default to pending for unknown stages
    return 'pending'
  }

  const formatCurrency = (amount: number | string) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0)
  }

  const formatDate = (date: string) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#0BA5AA] to-[#06888D] rounded-lg p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {userData.full_name || `${userData.first_name} ${userData.last_name}` || 'Customer'}
            </h2>
            <div className="flex items-center gap-4 text-gray-100">
              <span className="flex items-center gap-1">
                <Hash className="h-4 w-4" />
                ID: {userData.id_number || applicationData.user_id}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Applied: {formatDate(applicationData.created_at)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold mb-1">
              {formatCurrency(applicationData.requested_amount || userData.loan_amount)}
            </div>
            <Badge className={`${getStatusColor(applicationData.status)} border-0`}>
              {applicationData.status?.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Application Progress</span>
            <span>{Math.round(calculateProgress())}% Complete</span>
          </div>
          <Progress value={calculateProgress()} className="h-2 bg-[#086569]" />
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Loan Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(applicationData.requested_amount || userData.loan_amount)}</div>
                <p className="text-xs text-gray-500 mt-1">Principal amount requested</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Total Repayment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(applicationData.total_repayment || 
                    (parseFloat(userData.installment_amount || 0) * parseInt(userData.number_of_installments || 0)))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Including interest & fees</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Monthly Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(userData.installment_amount || 0)}</div>
                <p className="text-xs text-gray-500 mt-1">{userData.number_of_installments || applicationData.tenure} installments</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button variant="outline" className="justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline" className="justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Customer
                </Button>
                <Button variant="outline" className="justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button variant="outline" className="justify-start" onClick={refreshApplication} disabled={isRefreshing}>
                  <Download className="h-4 w-4 mr-2" />
                  {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current Stage */}
          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const currentSimplifiedStage = getSimplifiedStage(applicationData.current_stage || applicationData.status)
                const stages = ['pending', 'verified', 'approved']
                const isRejected = currentSimplifiedStage === 'rejected'
                
                // If rejected, show different flow
                if (isRejected) {
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                        <XCircle className="h-6 w-6 text-red-600" />
                        <div>
                          <p className="font-semibold text-red-900">Application Rejected</p>
                          <p className="text-sm text-red-700">This application has been rejected and cannot proceed further.</p>
                        </div>
                      </div>
                    </div>
                  )
                }
                
                const currentStageIndex = stages.indexOf(currentSimplifiedStage)
                
                return (
                  <div className="space-y-4">
                    {/* Current Status Badge */}
                    <div className="flex items-center gap-3 mb-6">
                      {getStageIcon(currentSimplifiedStage)}
                      <span className="font-semibold text-lg capitalize">
                        {currentSimplifiedStage === 'pending' ? 'Application Pending' :
                         currentSimplifiedStage === 'verified' ? 'Documents Verified' :
                         currentSimplifiedStage === 'approved' ? 'Application Approved' : 
                         currentSimplifiedStage}
                      </span>
                    </div>
                    
                    {/* Progress Steps */}
                    <div className="relative">
                      {/* Progress Line */}
                      <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gray-300"></div>
                      
                      {/* Stages */}
                      <div className="space-y-6">
                        {stages.map((stage, index) => {
                          const isCompleted = index < currentStageIndex
                          const isCurrent = index === currentStageIndex
                          const isPending = index > currentStageIndex
                          
                          return (
                            <div key={stage} className="flex items-center gap-4">
                              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                                isCompleted ? 'bg-green-600 text-white' :
                                isCurrent ? 'bg-[#0BA5AA] text-white' :
                                'bg-gray-300 text-gray-600'
                              }`}>
                                {isCompleted ? (
                                  <CheckCircle className="h-5 w-5" />
                                ) : (
                                  <span className="text-sm font-semibold">{index + 1}</span>
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <p className={`font-medium ${
                                  isCompleted ? 'text-green-600' :
                                  isCurrent ? 'text-[#0BA5AA]' :
                                  'text-gray-500'
                                }`}>
                                  {stage === 'pending' ? 'Application Submitted' :
                                   stage === 'verified' ? 'KYC Verification Complete' :
                                   stage === 'approved' ? 'Loan Approved' : 
                                   stage}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {stage === 'pending' ? 'Your application is under review' :
                                   stage === 'verified' ? 'All documents have been verified' :
                                   stage === 'approved' ? 'Your loan has been approved for disbursement' : 
                                   ''}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personal Information Tab */}
        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{userData.full_name || `${userData.first_name} ${userData.last_name}`}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Hash className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">ID Number</p>
                    <p className="font-medium">{userData.id_number || applicationData.id_number}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{userData.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">WhatsApp</p>
                    <p className="font-medium">{userData.whatsapp_number || userData.whatsapp}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{userData.address || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Province</p>
                    <p className="font-medium">{userData.province || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Home className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Housing Type</p>
                    <p className="font-medium">{userData.house_type || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Time at Address</p>
                    <p className="font-medium">{userData.living_time_at_address || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Marital Status</p>
                    <p className="font-medium">{userData.marital_status || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Number of Children</p>
                    <p className="font-medium">{userData.children_count || '0'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Family Reference</p>
                    <p className="font-medium">{userData.family_reference || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Personal Reference</p>
                    <p className="font-medium">{userData.personal_reference || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Information Tab */}
        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Employment Status</p>
                    <p className="font-medium">{userData.employment_status || 'Not provided'}</p>
                  </div>
                </div>
                {userData.employment_status === 'Employed' ? (
                  <>
                    <div className="flex items-start gap-3">
                      <Building className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Company Name</p>
                        <p className="font-medium">{userData.company_name || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Briefcase className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Position</p>
                        <p className="font-medium">{userData.occupation || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Time in Company</p>
                        <p className="font-medium">{userData.time_in_company || 'Not provided'}</p>
                      </div>
                    </div>
                  </>
                ) : userData.employment_status === 'Self working' ? (
                  <>
                    <div className="flex items-start gap-3">
                      <Briefcase className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Business Activity</p>
                        <p className="font-medium">{userData.business_activity || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Business Duration</p>
                        <p className="font-medium">{userData.business_duration || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Building className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Business Description</p>
                        <p className="font-medium">{userData.business_description || 'Not provided'}</p>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Income & Loan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Monthly Income</p>
                    <p className="font-medium">
                      {formatCurrency(userData.monthly_income || userData.business_income || 0)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Monthly Savings</p>
                    <p className="font-medium">
                      {formatCurrency(userData.month_end_saving || userData.business_savings || 0)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Loan Purpose</p>
                    <p className="font-medium">{applicationData.loan_purpose || 'Personal Loan'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarDays className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">First Due Date</p>
                    <p className="font-medium">{formatDate(userData.installment_due_date)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loan Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Principal Amount</span>
                  <span className="font-semibold">
                    {formatCurrency(applicationData.principal_amount || applicationData.requested_amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Interest Amount</span>
                  <span className="font-semibold">
                    {formatCurrency(applicationData.interest_amount || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Closing Fees</span>
                  <span className="font-semibold">
                    {formatCurrency(applicationData.closing_fees || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 text-lg">
                  <span className="font-semibold">Total Repayment</span>
                  <span className="font-bold text-[#0BA5AA]">
                    {formatCurrency(applicationData.total_repayment || 
                      (parseFloat(userData.installment_amount || 0) * parseInt(userData.number_of_installments || 0)))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>KYC Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Required Documents */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <KYCDocumentItem
                  documentType="id_card_front"
                  documentUrl={userData.id_card_front}
                  applicationId={applicationId}
                  isVerified={userData.document_verification?.id_card_front?.verified}
                  onDocumentUpload={() => refreshApplication()}
                />
                <KYCDocumentItem
                  documentType="id_card_back"
                  documentUrl={userData.id_card_back}
                  applicationId={applicationId}
                  isVerified={userData.document_verification?.id_card_back?.verified}
                  onDocumentUpload={() => refreshApplication()}
                />
                <KYCDocumentItem
                  documentType="proof_of_address"
                  documentUrl={userData.proof_of_address}
                  applicationId={applicationId}
                  isVerified={userData.document_verification?.proof_of_address?.verified}
                  onDocumentUpload={() => refreshApplication()}
                />
                <KYCDocumentItem
                  documentType="selfie_with_id"
                  documentUrl={userData.selfie_with_id}
                  applicationId={applicationId}
                  isVerified={userData.document_verification?.selfie_with_id?.verified}
                  onDocumentUpload={() => refreshApplication()}
                />
              </div>

              {/* Employment Documents */}
              {userData.employment_status === 'Employed' && (
                <>
                  <h4 className="font-medium text-gray-700 mt-6">Employment Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <KYCDocumentItem
                      documentType="employment_letter"
                      documentUrl={userData.employment_letter}
                      applicationId={applicationId}
                      isVerified={userData.document_verification?.employment_letter?.verified}
                      onDocumentUpload={() => refreshApplication()}
                    />
                    <KYCDocumentItem
                      documentType="bank_statements"
                      documentUrl={userData.bank_statements_employed}
                      applicationId={applicationId}
                      isVerified={userData.document_verification?.bank_statements?.verified}
                      onDocumentUpload={() => refreshApplication()}
                    />
                  </div>
                </>
              )}

              {/* Business Documents */}
              {userData.employment_status === 'Self working' && (
                <>
                  <h4 className="font-medium text-gray-700 mt-6">Business Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <KYCDocumentItem
                      documentType="business_photos"
                      documentUrl={userData.business_location_photos}
                      applicationId={applicationId}
                      isVerified={userData.document_verification?.business_photos?.verified}
                      onDocumentUpload={() => refreshApplication()}
                    />
                    <KYCDocumentItem
                      documentType="product_photos"
                      documentUrl={userData.product_photos}
                      applicationId={applicationId}
                      isVerified={userData.document_verification?.product_photos?.verified}
                      onDocumentUpload={() => refreshApplication()}
                    />
                    <KYCDocumentItem
                      documentType="supplier_invoices"
                      documentUrl={userData.supplier_invoices}
                      applicationId={applicationId}
                      isVerified={userData.document_verification?.supplier_invoices?.verified}
                      onDocumentUpload={() => refreshApplication()}
                    />
                    <KYCDocumentItem
                      documentType="bank_statements_business"
                      documentUrl={userData.bank_statements_self}
                      applicationId={applicationId}
                      isVerified={userData.document_verification?.bank_statements_business?.verified}
                      onDocumentUpload={() => refreshApplication()}
                    />
                  </div>
                </>
              )}

              {/* Additional Documents */}
              <h4 className="font-medium text-gray-700 mt-6">Additional Documents</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <KYCDocumentItem
                  documentType="additional_document_1"
                  documentUrl={userData.additional_document_1}
                  applicationId={applicationId}
                  isVerified={userData.document_verification?.additional_document_1?.verified}
                  onDocumentUpload={() => refreshApplication()}
                />
                <KYCDocumentItem
                  documentType="additional_document_2"
                  documentUrl={userData.additional_document_2}
                  applicationId={applicationId}
                  isVerified={userData.document_verification?.additional_document_2?.verified}
                  onDocumentUpload={() => refreshApplication()}
                />
              </div>

              {/* Verify All Button */}
              <div className="mt-6 flex justify-center">
                <Button 
                  variant="default" 
                  size="lg"
                  className="w-full md:w-auto"
                  onClick={async () => {
                    // Verify all documents logic here
                    console.log('Verifying all documents...')
                  }}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Verify All Documents
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-[#0BA5AA] text-white flex items-center justify-center">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="w-0.5 h-16 bg-gray-300"></div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Application Submitted</h4>
                    <p className="text-sm text-gray-500">{formatDate(applicationData.created_at)}</p>
                    <p className="text-sm mt-1">Initial application received with amount {formatCurrency(applicationData.requested_amount)}</p>
                  </div>
                </div>

                {applicationData.updated_at !== applicationData.created_at && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <div className="w-0.5 h-16 bg-gray-300"></div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Last Updated</h4>
                      <p className="text-sm text-gray-500">{formatDate(applicationData.updated_at)}</p>
                      <p className="text-sm mt-1">Application details were updated</p>
                    </div>
                  </div>
                )}

                {applicationData.status === 'approved' && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center">
                        <Banknote className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Loan Approved</h4>
                      <p className="text-sm text-gray-500">Pending disbursement</p>
                      <p className="text-sm mt-1">Loan has been approved and is ready for disbursement</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#0BA5AA] rounded-full"></div>
                    <span className="text-sm">Application created</span>
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(applicationData.created_at)}</span>
                </div>
                {applicationData.questions_count > 0 && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">{applicationData.questions_count} questions answered</span>
                    </div>
                    <span className="text-xs text-gray-500">Completed</span>
                  </div>
                )}
                {userData.id_card_front && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm">ID documents uploaded</span>
                    </div>
                    <span className="text-xs text-gray-500">Completed</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}