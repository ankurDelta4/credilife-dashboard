"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Download, Users, AlertCircle, CheckCircle, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface BulkImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface ParsedUser {
  name: string
  email: string
  phone_number: string
  role: string
  errors?: string[]
}

interface ImportResult {
  success: number
  failed: number
  errors: Array<{ row: number; error: string }>
}

export function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')
  const { toast } = useToast()

  const formatPhoneNumber = (phone: string): string => {
    const digitsOnly = phone.replace(/\D/g, '')
    
    if (digitsOnly.length === 11) {
      if (digitsOnly.startsWith('91')) {
        return digitsOnly
      } else {
        return '91' + digitsOnly.slice(-10)
      }
    } else if (digitsOnly.length === 10) {
      return '91' + digitsOnly
    } else if (digitsOnly.length > 11) {
      return digitsOnly.slice(-11)
    } else {
      return digitsOnly
    }
  }

  const validateUser = (user: any, rowIndex: number): ParsedUser => {
    const errors: string[] = []
    
    if (!user.name || user.name.trim() === '') {
      errors.push('Name is required')
    }
    
    if (!user.email || user.email.trim() === '') {
      errors.push('Email is required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      errors.push('Invalid email format')
    }
    
    const phone = formatPhoneNumber(user.phone_number || user.phone || '')
    if (phone.length !== 11) {
      errors.push('Phone number must be 11 digits')
    }
    
    return {
      name: user.name?.trim() || '',
      email: user.email?.trim().toLowerCase() || '',
      phone_number: phone,
      role: user.role?.toLowerCase() || 'user',
      errors: errors.length > 0 ? errors : undefined
    }
  }

  const parseCSV = (text: string): ParsedUser[] => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const users: ParsedUser[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const userObj: any = {}
      
      headers.forEach((header, index) => {
        userObj[header] = values[index] || ''
      })
      
      users.push(validateUser(userObj, i + 1))
    }
    
    return users
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please upload a CSV file."
      })
      return
    }
    
    setSelectedFile(file)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const parsed = parseCSV(text)
        setParsedUsers(parsed)
        setStep('preview')
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Parse Error",
          description: "Failed to parse CSV file. Please check the format."
        })
      }
    }
    reader.readAsText(file)
  }

  const downloadTemplate = () => {
    const csvContent = "name,email,phone_number,role\nJohn Doe,john@example.com,91829234567,user\nJane Smith,jane@example.com,91809876543,user"
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bulk_users_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleBulkImport = async () => {
    const validUsers = parsedUsers.filter(user => !user.errors)
    
    if (validUsers.length === 0) {
      toast({
        variant: "destructive",
        title: "No Valid Users",
        description: "Please fix the errors in your data before importing."
      })
      return
    }
    
    try {
      setImporting(true)
      
      const response = await fetch('/api/users/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ users: validUsers })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setImportResult({
          success: result.data.created,
          failed: result.data.failed,
          errors: result.data.errors || []
        })
        setStep('result')
        
        if (result.data.created > 0) {
          toast({
            variant: "success",
            title: "Import Successful",
            description: `Successfully imported ${result.data.created} users.`
          })
        }
      } else {
        toast({
          variant: "destructive",
          title: "Import Failed",
          description: result.error || "Failed to import users"
        })
      }
    } catch (error) {
      console.error('Bulk import error:', error)
      toast({
        variant: "destructive",
        title: "Import Error",
        description: "An error occurred during import."
      })
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setParsedUsers([])
    setImportResult(null)
    setStep('upload')
    onClose()
  }

  const handleComplete = () => {
    handleClose()
    onSuccess()
  }

  const validUsers = parsedUsers.filter(user => !user.errors)
  const invalidUsers = parsedUsers.filter(user => user.errors)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Users</DialogTitle>
          <DialogDescription>
            Import multiple users from a CSV file
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="text-lg font-medium mb-2">Upload CSV File</div>
                <div className="text-gray-600 mb-4">
                  Select a CSV file with user data to import
                </div>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <Button
                  onClick={() => document.getElementById('csv-upload')?.click()}
                  className="mb-2"
                >
                  Choose CSV File
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Need a template? 
              </div>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">CSV Format Requirements:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>name:</strong> Full name (required)</li>
                <li>• <strong>email:</strong> Valid email address (required)</li>
                <li>• <strong>phone_number:</strong> Phone number with country code (required)</li>
                <li>• <strong>role:</strong> user, admin, manager, agent (optional, defaults to 'user')</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Import Preview</h3>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  {validUsers.length} Valid
                </Badge>
                {invalidUsers.length > 0 && (
                  <Badge variant="destructive">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    {invalidUsers.length} Invalid
                  </Badge>
                )}
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {parsedUsers.map((user, index) => (
                <Card key={index} className={`mb-2 ${user.errors ? 'border-red-200' : 'border-green-200'}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-600">{user.email} • {user.phone_number}</div>
                      </div>
                      {user.errors ? (
                        <div className="text-right">
                          <X className="h-4 w-4 text-red-500 mb-1" />
                          <div className="text-xs text-red-600">
                            {user.errors.join(', ')}
                          </div>
                        </div>
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleBulkImport}
                disabled={importing || validUsers.length === 0}
              >
                {importing ? 'Importing...' : `Import ${validUsers.length} Users`}
              </Button>
            </div>
          </div>
        )}

        {step === 'result' && importResult && (
          <div className="space-y-4">
            <div className="text-center">
              <Users className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Import Complete</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                  <div className="text-sm text-gray-600">Successfully Imported</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </CardContent>
              </Card>
            </div>

            {importResult.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-red-600 mb-2">Errors:</h4>
                <div className="max-h-32 overflow-y-auto bg-red-50 p-2 rounded">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-700">
                      Row {error.row}: {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleComplete}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}