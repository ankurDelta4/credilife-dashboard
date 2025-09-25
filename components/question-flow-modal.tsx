"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Upload, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { uploadToSupabaseStorage, uploadMultipleFiles } from "@/lib/utils/supabase-storage"

interface Question {
  q: string
  storing_variable: string
  type: string
  options?: string[]
}

interface ConditionalBlock {
  condition: string
  questions: Question[]
}

interface QuestionFlow {
  questions: (Question | ConditionalBlock)[]
}

interface QuestionFlowModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Record<string, any>) => void
  isLoading: boolean
  initialLoanData: {
    user_id: string
    requested_amount: string
    loan_purpose?: string
    tenure: string
    repayment_type: string
    interest_amount: number
    principal_amount: number
    closing_fees: number
    total_repayment: number
    id_number: string
    questions_count: number
    is_renewal: boolean
  }
  onSuccess?: () => void
  onError?: (error: string) => void
}

const questionFlowData: QuestionFlow = {
  "questions": [
    { "q": "What is your first name?", "storing_variable": "first_name", "type": "text" },
    { "q": "What is your last name?", "storing_variable": "last_name", "type": "text" },
    { "q": "Your mobile number with WhatsApp (11 digits)", "storing_variable": "whatsapp_number", "type": "phone" },
    { "q": "Your ID number (11 digits)", "storing_variable": "id_number", "type": "id_number" },
    { "q": "Front photo of your ID card", "storing_variable": "id_card_front", "type": "file" },
    { "q": "Your Email address", "storing_variable": "email", "type": "email" },
    { "q": "Address (Street, Number, Sector)", "storing_variable": "address", "type": "text" },
    { "q": "What is your province?", "storing_variable": "province", "type": "select", "options": ["Azua", "Baoruco", "Barahona", "Dajabón", "Distrito Nacional", "Duarte", "Elías Piña", "El Seibo", "Espaillat", "Hato Mayor", "Hermanas Mirabal", "Independencia", "La Altagracia", "La Romana", "La Vega", "María Trinidad Sánchez", "Monseñor Nouel", "Monte Cristi", "Monte Plata", "Pedernales", "Peravia", "Puerto Plata", "Samaná", "Sánchez Ramírez", "San Cristóbal", "San José de Ocoa", "San Juan", "San Pedro de Macorís", "Santiago", "Santiago Rodríguez", "Santo Domingo", "Valverde"] },
    { "q": "Type of housing", "storing_variable": "house_type", "type": "select", "options": ["Owned", "Rented"] },
    { "q": "Time living at that address", "storing_variable": "living_time_at_address", "type": "text" },
    { "q": "Marital Status", "storing_variable": "marital_status", "type": "select", "options": ["Single", "Married", "Common-law union"] },
    { "q": "How many children do you have?", "storing_variable": "children_count", "type": "number" },
    { "q": "Family reference (Name, relationship, and phone)", "storing_variable": "family_reference", "type": "text" },
    { "q": "Personal reference (Name and phone number of a friend)", "storing_variable": "personal_reference", "type": "text" },
    { "q": "What is your employment status?", "storing_variable": "employment_status", "type": "select", "options": ["Employed", "Self working"] },
    {
      "condition": "employment_status != 'Self working'",
      "questions": [
        { "q": "Supervisor (Name and mobile number)", "storing_variable": "supervisor_name", "type": "text" },
        { "q": "Time in the Company", "storing_variable": "time_in_company", "type": "text" },
        { "q": "Company's payment method", "storing_variable": "company_payment_method", "type": "select", "options": ["Cash", "Bank transfer"] },
        { "q": "Monthly Income", "storing_variable": "monthly_income", "type": "number" },
        { "q": "How much money do you have left every month?", "storing_variable": "month_end_saving", "type": "number" },
        { "q": "Payment date", "storing_variable": "payment_date", "type": "text" },
        { "q": "Company name", "storing_variable": "company_name", "type": "text" },
        { "q": "Company Phone Number", "storing_variable": "company_number", "type": "phone" },
        { "q": "Company email or HR department email", "storing_variable": "hr_email", "type": "email" },
        { "q": "Company website", "storing_variable": "company_site", "type": "text" },
        { "q": "Company address", "storing_variable": "company_address", "type": "text" },
        { "q": "Occupation / Position", "storing_variable": "occupation", "type": "text" },
        { "q": "Upload your bank statements of last 3 months", "storing_variable": "bank_statements_employed", "type": "file_multiple" },
        { "q": "Upload employment letter issued within the last 2 months", "storing_variable": "employment_letter", "type": "file" }
      ]
    },
    {
      "condition": "employment_status == 'Self working'",
      "questions": [
        { "q": "Your business activity or business you do", "storing_variable": "business_activity", "type": "text" },
        { "q": "Duration of the business / How long the business has been operating", "storing_variable": "business_duration", "type": "text" },
        { "q": "Monthly income", "storing_variable": "business_income", "type": "number" },
        { "q": "How much money do you have left per month?", "storing_variable": "business_savings", "type": "number" },
        { "q": "Instagram link of your business", "storing_variable": "business_insta", "type": "text" },
        { "q": "Instagram username of your business", "storing_variable": "business_insta_handle", "type": "text" },
        { "q": "Tell us a little about what you do, be descriptive.", "storing_variable": "business_description", "type": "text" },
        { "q": "Upload photos of your business location", "storing_variable": "business_location_photos", "type": "file_multiple" },
        { "q": "Upload photos of products you sell (if applicable)", "storing_variable": "product_photos", "type": "file_multiple" },
        { "q": "Upload supplier invoices and business location reference", "storing_variable": "supplier_invoices", "type": "file_multiple" },
        { "q": "Upload your bank statements of last 3 months", "storing_variable": "bank_statements_self", "type": "file_multiple" }
      ]
    }
  ]
}

export function QuestionFlowModal({ isOpen, onClose, onSubmit, isLoading, initialLoanData, onSuccess, onError }: QuestionFlowModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [flattenedQuestions, setFlattenedQuestions] = useState<Question[]>([])
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({})
  const [uploadedUrls, setUploadedUrls] = useState<Record<string, string[]>>({})
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Flatten questions based on conditions and employment status
  useEffect(() => {
    const flattenQuestions = (answers: Record<string, any>): Question[] => {
      const flattened: Question[] = []
      
      for (const item of questionFlowData.questions) {
        if ('condition' in item) {
          // This is a conditional block
          const condition = item.condition
          const employmentStatus = answers.employment_status
          
          if (condition === "employment_status != 'Self working'" && employmentStatus && employmentStatus !== 'Self working') {
            flattened.push(...item.questions)
          } else if (condition === "employment_status == 'Self working'" && employmentStatus === 'Self working') {
            flattened.push(...item.questions)
          }
        } else {
          // This is a regular question
          flattened.push(item)
        }
      }
      
      return flattened
    }

    const flattened = flattenQuestions(answers)
    setFlattenedQuestions(flattened)
    
    // If we're past the employment status question, re-flatten to include conditional questions
    if (answers.employment_status && currentQuestionIndex >= 14) {
      const newFlattened = flattenQuestions(answers)
      if (newFlattened.length !== flattened.length) {
        setFlattenedQuestions(newFlattened)
      }
    }
  }, [answers, currentQuestionIndex])

  // Initialize current answer when question changes
  useEffect(() => {
    if (flattenedQuestions[currentQuestionIndex]) {
      const variable = flattenedQuestions[currentQuestionIndex].storing_variable
      setCurrentAnswer(answers[variable] || "")
      setUploadedFiles(prev => ({ ...prev, [variable]: [] }))
    }
  }, [currentQuestionIndex, flattenedQuestions, answers])

  const currentQuestion = flattenedQuestions[currentQuestionIndex]
  const totalQuestions = flattenedQuestions.length
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0

  const validateInput = (type: string, value: string): boolean => {
    switch (type) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      case 'phone':
        // Dominican Republic phone validation: 11 digits starting with 1, area codes 809/829/849
        const phoneDigits = value.replace(/\D/g, '')
        return phoneDigits.length === 11 && phoneDigits.startsWith('1') && 
               (phoneDigits.startsWith('1809') || phoneDigits.startsWith('1829') || phoneDigits.startsWith('1849'))
      case 'id_number':
        // Dominican Republic ID number: exactly 11 digits
        const idDigits = value.replace(/\D/g, '')
        return idDigits.length === 11
      case 'number':
        return !isNaN(parseFloat(value)) && isFinite(parseFloat(value))
      case 'text':
      case 'select':
        return value.trim().length > 0
      case 'file':
        return uploadedUrls[currentQuestion.storing_variable]?.length > 0
      case 'file_multiple':
        return uploadedUrls[currentQuestion.storing_variable]?.length > 0
      default:
        return value.trim().length > 0
    }
  }

  const handleNext = () => {
    if (!currentQuestion) return

    const isValid = (currentQuestion.type === 'file' || currentQuestion.type === 'file_multiple')
      ? uploadedUrls[currentQuestion.storing_variable]?.length > 0
      : validateInput(currentQuestion.type, currentAnswer)

    if (!isValid) {
      let errorMessage = `Please provide a valid ${currentQuestion.type === 'file' || currentQuestion.type === 'file_multiple' ? 'file' : currentQuestion.type}`
      if (currentQuestion.type === 'phone') {
        errorMessage = 'Please provide a valid Dominican Republic phone number (11 digits starting with 1809, 1829, or 1849)'
      } else if (currentQuestion.type === 'id_number') {
        errorMessage = 'Please provide a valid Dominican Republic ID number (11 digits)'
      } else if (currentQuestion.type === 'file' || currentQuestion.type === 'file_multiple') {
        errorMessage = 'Please upload at least one file'
      }
      
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: errorMessage
      })
      return
    }

    // Store the answer
    let answerValue: any = currentAnswer
    
    if (currentQuestion.type === 'file' || currentQuestion.type === 'file_multiple') {
      const urls = uploadedUrls[currentQuestion.storing_variable] || []
      if (urls.length > 0) {
        // Store URLs for single file as string, multiple files as array
        answerValue = currentQuestion.type === 'file_multiple' ? urls : urls[0]
      } else {
        answerValue = 'no_files_uploaded'
      }
    } else if (currentQuestion.type === 'number') {
      answerValue = parseFloat(currentAnswer)
    }
    
    const newAnswers = {
      ...answers,
      [currentQuestion.storing_variable]: answerValue
    }
    setAnswers(newAnswers)

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // Check if all questions have been answered before submission
      const allQuestionsAnswered = flattenedQuestions.every(question => {
        const answer = newAnswers[question.storing_variable]
        if (question.type === 'file' || question.type === 'file_multiple') {
          return uploadedUrls[question.storing_variable]?.length > 0
        }
        return answer !== undefined && answer !== '' && answer !== null
      })

      if (!allQuestionsAnswered) {
        toast({
          variant: "destructive",
          title: "Incomplete Application",
          description: "Please answer all questions before submitting your application."
        })
        return
      }

      // All questions completed and answered, submit the form
      handleSubmit(newAnswers)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmit = async (finalAnswers: Record<string, any>) => {
    try {
      setIsSubmitting(true)
      
      const submissionData = {
        user_id: initialLoanData.user_id,
        requested_amount: parseFloat(initialLoanData.requested_amount),
        ...(initialLoanData.loan_purpose && { loan_purpose: initialLoanData.loan_purpose }),
        tenure: parseFloat(initialLoanData.tenure),
        repayment_type: initialLoanData.repayment_type,
        interest_amount: initialLoanData.interest_amount,
        principal_amount: initialLoanData.principal_amount,
        closing_fees: initialLoanData.closing_fees,
        total_repayment: initialLoanData.total_repayment,
        id_number: finalAnswers.id_number ? parseFloat(finalAnswers.id_number) : null,
        questions_count: totalQuestions,
        is_renewal: initialLoanData.is_renewal,
        status: 'pending',
        current_stage: 'application_submitted',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_data: finalAnswers
      }
      
      const response = await fetch('/api/loan-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      })

      const data = await response.json()

      if (data.success) {
        onSuccess?.()
        onSubmit(submissionData) // For backward compatibility
      } else {
        onError?.(data.error || 'Failed to create loan application')
      }
    } catch (error) {
      console.error('Error creating loan application:', error)
      onError?.('Failed to create loan application')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && currentQuestion) {
      const variable = currentQuestion.storing_variable
      const fileArray = Array.from(files)
      
      // Set uploading state
      setIsUploading(prev => ({ ...prev, [variable]: true }))
      
      try {
        // Determine folder based on file type
        const folder = variable.includes('bank_statements') ? 'bank-statements' : 
                      variable.includes('employment') ? 'employment-docs' :
                      variable.includes('business') ? 'business-docs' :
                      variable.includes('id_card') ? 'id-documents' :
                      variable.includes('invoice') ? 'invoices' : 'documents'
        
        let uploadResults: string[] = []
        
        if (currentQuestion.type === 'file_multiple') {
          // Upload multiple files
          const result = await uploadMultipleFiles(fileArray, folder)
          if (result.success) {
            uploadResults = result.urls
            setUploadedFiles(prev => ({
              ...prev,
              [variable]: [...(prev[variable] || []), ...fileArray]
            }))
            setUploadedUrls(prev => ({
              ...prev,
              [variable]: [...(prev[variable] || []), ...result.urls]
            }))
            
            toast({
              variant: "success",
              title: "Upload Successful",
              description: `${result.urls.length} file(s) uploaded successfully`
            })
          } else {
            throw new Error(result.errors.join(', '))
          }
        } else {
          // Upload single file
          const result = await uploadToSupabaseStorage(fileArray[0], folder)
          if (result.success && result.url) {
            uploadResults = [result.url]
            setUploadedFiles(prev => ({
              ...prev,
              [variable]: [fileArray[0]]
            }))
            setUploadedUrls(prev => ({
              ...prev,
              [variable]: [result.url!]
            }))
            
            toast({
              variant: "success",
              title: "Upload Successful",
              description: "File uploaded successfully"
            })
          } else {
            throw new Error(result.error || 'Upload failed')
          }
        }
      } catch (error) {
        console.error('Upload error:', error)
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: error instanceof Error ? error.message : 'Failed to upload file(s)'
        })
      } finally {
        setIsUploading(prev => ({ ...prev, [variable]: false }))
      }
    }
  }

  const removeFile = (variable: string, index: number) => {
    setUploadedFiles(prev => ({
      ...prev,
      [variable]: prev[variable].filter((_, i) => i !== index)
    }))
    setUploadedUrls(prev => ({
      ...prev,
      [variable]: (prev[variable] || []).filter((_, i) => i !== index)
    }))
  }

  const renderInput = () => {
    if (!currentQuestion) return null

    const commonProps = {
      value: currentAnswer,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCurrentAnswer(e.target.value),
      placeholder: `Enter your ${currentQuestion.storing_variable.replace('_', ' ')}`,
      className: "w-full"
    }

    switch (currentQuestion.type) {
      case 'select':
        return (
          <Select value={currentAnswer} onValueChange={setCurrentAnswer}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${currentQuestion.storing_variable.replace('_', ' ')}`} />
            </SelectTrigger>
            <SelectContent>
              {currentQuestion.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case 'file':
      case 'file_multiple':
        const files = uploadedFiles[currentQuestion.storing_variable] || []
        const isMultiple = currentQuestion.type === 'file_multiple'
        const acceptType = currentQuestion.storing_variable.includes('bank_statements') || 
                          currentQuestion.storing_variable.includes('invoice') || 
                          currentQuestion.storing_variable.includes('letter') 
                          ? 'image/*,.pdf' : 'image/*'
        
        const isCurrentlyUploading = isUploading[currentQuestion.storing_variable] || false
        
        return (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              {isCurrentlyUploading ? (
                <>
                  <Loader2 className="mx-auto h-12 w-12 text-blue-500 mb-4 animate-spin" />
                  <div className="text-sm text-blue-600 mb-4 text-center">
                    Uploading files to secure storage...
                  </div>
                </>
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="text-sm text-gray-600 mb-4 text-center">
                    {files.length > 0 
                      ? `${files.length} file(s) uploaded successfully`
                      : `Click to upload ${isMultiple ? 'files' : 'file'}`
                    }
                  </div>
                </>
              )}
              
              {files.length > 0 && !isCurrentlyUploading && (
                <div className="space-y-2 mb-4">
                  {files.map((file, index) => {
                    const hasUrl = uploadedUrls[currentQuestion.storing_variable]?.[index]
                    return (
                      <div key={index} className="flex items-center justify-between bg-green-50 border border-green-200 p-2 rounded">
                        <div className="flex items-center flex-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-sm truncate flex-1">{file.name}</span>
                          <span className="text-xs text-green-600 ml-2">✓ Uploaded</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(currentQuestion.storing_variable, index)}
                          className="text-red-500 hover:text-red-700"
                          disabled={isCurrentlyUploading}
                        >
                          Remove
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
              
              <Input
                type="file"
                accept={acceptType}
                onChange={handleFileUpload}
                multiple={isMultiple}
                className="hidden"
                id={`file-upload-${currentQuestion.storing_variable}`}
              />
              <div className="text-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById(`file-upload-${currentQuestion.storing_variable}`)?.click()}
                  disabled={isCurrentlyUploading}
                >
                  {isCurrentlyUploading ? 'Uploading...' : 
                   files.length > 0 && isMultiple ? 'Add More Files' : 'Choose File'}
                </Button>
              </div>
            </div>
            {isMultiple && (
              <p className="text-xs text-gray-500 text-center">
                You can select multiple files. Accepted formats: Images and PDFs
              </p>
            )}
          </div>
        )
      case 'text':
        if (currentQuestion.storing_variable.includes('description') || currentQuestion.storing_variable.includes('reference')) {
          return <Textarea {...commonProps} rows={3} />
        }
        return <Input {...commonProps} />
      case 'email':
        return <Input {...commonProps} type="email" />
      case 'phone':
        return (
          <div className="space-y-2">
            <Input 
              {...commonProps} 
              type="tel" 
              placeholder="18091234567 (Dominican Republic format)" 
            />
            <p className="text-xs text-gray-500">
              Format: 11 digits starting with 1809, 1829, or 1849
            </p>
          </div>
        )
      case 'id_number':
        return (
          <div className="space-y-2">
            <Input 
              {...commonProps} 
              type="text" 
              placeholder="12345678901 (11 digits)" 
              maxLength={11}
            />
            <p className="text-xs text-gray-500">
              Dominican Republic ID: exactly 11 digits
            </p>
          </div>
        )
      case 'number':
        return <Input {...commonProps} type="number" />
      default:
        return <Input {...commonProps} />
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Loan Application - Question {currentQuestionIndex + 1} of {totalQuestions}</DialogTitle>
          <DialogDescription>
            Please answer all questions to complete your loan application
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Question */}
          {currentQuestion && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-lg font-medium">{currentQuestion.q}</Label>
                {currentQuestion.type === 'file' && currentQuestion.storing_variable === 'id_card_front' && (
                  <p className="text-sm text-gray-600">Please upload a clear photo of the front of your ID card</p>
                )}
                {currentQuestion.type === 'file_multiple' && currentQuestion.storing_variable.includes('bank_statements') && (
                  <p className="text-sm text-gray-600">Please upload bank statements from the last 3 months (as images or PDFs)</p>
                )}
                {currentQuestion.type === 'file' && currentQuestion.storing_variable === 'employment_letter' && (
                  <p className="text-sm text-gray-600">Please upload an employment letter issued within the last 2 months</p>
                )}
                {currentQuestion.type === 'file_multiple' && currentQuestion.storing_variable.includes('business_location') && (
                  <p className="text-sm text-gray-600">Please upload clear photos of your business location</p>
                )}
                {currentQuestion.type === 'file_multiple' && currentQuestion.storing_variable.includes('product') && (
                  <p className="text-sm text-gray-600">Upload product photos if applicable to your business</p>
                )}
              </div>
              {renderInput()}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading || isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleNext}
              disabled={isLoading || isSubmitting}
            >
              {isSubmitting ? 'Submitting Application...' : isLoading ? 'Processing...' : currentQuestionIndex === totalQuestions - 1 ? 'Submit Application' : 'Next'}
              {currentQuestionIndex < totalQuestions - 1 && <ChevronRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}