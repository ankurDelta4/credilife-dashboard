"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Upload } from "lucide-react"

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
    loan_purpose: string
    tenure: string
    repayment_type: string
    interest_amount: string
    principal_amount: string
    closing_fees: string
    total_repayment: string
    id_number: string
    questions_count: string
    is_renewal: boolean
  }
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
        { "q": "Occupation / Position", "storing_variable": "occupation", "type": "text" }
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
        { "q": "Tell us a little about what you do, be descriptive.", "storing_variable": "business_description", "type": "text" }
      ]
    }
  ]
}

export function QuestionFlowModal({ isOpen, onClose, onSubmit, isLoading, initialLoanData }: QuestionFlowModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [flattenedQuestions, setFlattenedQuestions] = useState<Question[]>([])
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

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
      setUploadedFile(null)
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
        return uploadedFile !== null
      default:
        return value.trim().length > 0
    }
  }

  const handleNext = () => {
    if (!currentQuestion) return

    const isValid = currentQuestion.type === 'file' 
      ? uploadedFile !== null 
      : validateInput(currentQuestion.type, currentAnswer)

    if (!isValid) {
      let errorMessage = `Please provide a valid ${currentQuestion.type === 'file' ? 'file' : currentQuestion.type}`
      if (currentQuestion.type === 'phone') {
        errorMessage = 'Please provide a valid Dominican Republic phone number (11 digits starting with 1809, 1829, or 1849)'
      } else if (currentQuestion.type === 'id_number') {
        errorMessage = 'Please provide a valid Dominican Republic ID number (11 digits)'
      }
      alert(errorMessage)
      return
    }

    // Store the answer
    const newAnswers = {
      ...answers,
      [currentQuestion.storing_variable]: currentQuestion.type === 'file' 
        ? uploadedFile?.name || 'uploaded_file.jpg'
        : currentQuestion.type === 'number' 
          ? parseFloat(currentAnswer)
          : currentAnswer
    }
    setAnswers(newAnswers)

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // All questions completed, submit the form
      handleSubmit(newAnswers)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmit = (finalAnswers: Record<string, any>) => {
    const submissionData = {
      ...initialLoanData,
      user_data: finalAnswers,
      questions_count: totalQuestions
    }
    onSubmit(submissionData)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
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
        return (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="text-sm text-gray-600 mb-4">
                {uploadedFile ? `Selected: ${uploadedFile.name}` : 'Click to upload your ID card photo'}
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Choose File
              </Button>
            </div>
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
                {currentQuestion.type === 'file' && (
                  <p className="text-sm text-gray-600">Please upload a clear photo of the front of your ID card</p>
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
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleNext}
              disabled={isLoading}
            >
              {isLoading ? 'Submitting...' : currentQuestionIndex === totalQuestions - 1 ? 'Submit Application' : 'Next'}
              {currentQuestionIndex < totalQuestions - 1 && <ChevronRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}