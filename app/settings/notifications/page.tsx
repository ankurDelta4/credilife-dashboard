"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Save, Mail, MessageSquare, Plus, Edit2, Trash2, Eye, Code, Play, Square, RefreshCw, Send, Clock } from "lucide-react"

interface MessageTemplate {
  id: string
  name: string
  type: 'email' | 'whatsapp'
  category: 'payment_reminder' | 'pre_approval' | 'overdue' | 'custom'
  subject?: string
  body: string
  html?: string
  variables: string[]
  enabled: boolean
}

interface WhatsAppConnection {
  type: 'twilio' | 'whatsapp_business'
  status: 'connected' | 'disconnected' | 'pending'
  config?: any
}

export default function NotificationSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [whatsappConnection, setWhatsappConnection] = useState<WhatsAppConnection>({
    type: 'twilio',
    status: 'disconnected'
  })
  
  // Email configuration state
  const [emailConfig, setEmailConfig] = useState({
    smtpHost: '',
    smtpPort: '587',
    username: '',
    password: '',
    fromEmail: '',
    useTLS: true
  })
  const [isSavingEmail, setIsSavingEmail] = useState(false)
  const [schedulerInterval, setSchedulerInterval] = useState('60')
  const [schedulerIntervalUnit, setSchedulerIntervalUnit] = useState<'seconds' | 'minutes' | 'hours'>('minutes')
  const [schedulerStatus, setSchedulerStatus] = useState<'running' | 'stopped'>('stopped')
  const [isLoadingScheduler, setIsLoadingScheduler] = useState(false)
  const [scheduleType, setScheduleType] = useState<'interval' | 'daily' | 'custom_days'>('interval')
  const [dailyTime, setDailyTime] = useState('15:00')
  const [customDaysBeforeDue, setCustomDaysBeforeDue] = useState<number[]>([7, 3, 1])
  
  // Reminder schedules state
  const [reminderSchedules, setReminderSchedules] = useState<any[]>([])
  const [newScheduleName, setNewScheduleName] = useState('')
  const [newScheduleDays, setNewScheduleDays] = useState('0')
  const [newScheduleType, setNewScheduleType] = useState<'before' | 'due' | 'after'>('before')
  const [newScheduleEmail, setNewScheduleEmail] = useState(true)
  const [newScheduleWhatsapp, setNewScheduleWhatsapp] = useState(false)
  const [newScheduleTemplateId, setNewScheduleTemplateId] = useState('')
  const [testEmail, setTestEmail] = useState('')
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0])
  const [testTime, setTestTime] = useState('09:00')
  const [isTestingSchedule, setIsTestingSchedule] = useState(false)

  const [templateForm, setTemplateForm] = useState<Partial<MessageTemplate>>({
    name: '',
    type: 'email',
    category: 'payment_reminder',
    subject: '',
    body: '',
    html: '',
    variables: [],
    enabled: true
  })

  useEffect(() => {
    loadTemplates()
    loadEmailConfig()
    loadReminderSchedules()
    checkSchedulerStatus()
  }, [])

  const loadEmailConfig = async () => {
    try {
      const response = await fetch('/api/settings/email')
      if (response.ok) {
        const data = await response.json()
        if (data.config) {
          setEmailConfig(data.config)
        }
      }
    } catch (error) {
      console.error('Error loading email config:', error)
    }
  }

  const loadReminderSchedules = async () => {
    try {
      const response = await fetch('/api/settings/reminder-schedules')
      if (response.ok) {
        const data = await response.json()
        if (data.schedules) {
          // Transform database format to component format
          const transformedSchedules = data.schedules.map((schedule: any) => ({
            id: schedule.id,
            name: schedule.name,
            days: schedule.days,
            type: schedule.type,
            email: schedule.email,
            whatsapp: schedule.whatsapp,
            enabled: schedule.enabled,
            templateId: schedule.emailTemplateId || ''
          }))
          setReminderSchedules(transformedSchedules)
        }
      }
    } catch (error) {
      console.error('Error loading reminder schedules:', error)
      // Set default schedules if loading fails
      setReminderSchedules([
        { id: 'default-1', name: '7 Days Before Due', days: 7, type: 'before', email: true, whatsapp: false, enabled: true, templateId: '' },
        { id: 'default-2', name: '3 Days Before Due', days: 3, type: 'before', email: true, whatsapp: false, enabled: true, templateId: '' },
        { id: 'default-3', name: 'Due Date', days: 0, type: 'due', email: true, whatsapp: false, enabled: true, templateId: '' }
      ])
    }
  }

  const updateReminderSchedule = async (schedule: any, updates: any) => {
    try {
      const updatedSchedule = { ...schedule, ...updates }
      
      const response = await fetch('/api/settings/reminder-schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: schedule.id,
          name: updatedSchedule.name,
          days: updatedSchedule.days,
          type: updatedSchedule.type,
          email: updatedSchedule.email,
          whatsapp: updatedSchedule.whatsapp,
          enabled: updatedSchedule.enabled,
          emailTemplateId: updatedSchedule.templateId
        })
      })
      
      if (response.ok) {
        // Update local state
        setReminderSchedules(reminderSchedules.map(s => 
          s.id === schedule.id ? updatedSchedule : s
        ))
        return true
      } else {
        throw new Error('Failed to update schedule')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update reminder schedule",
        variant: "destructive"
      })
      return false
    }
  }

  const checkSchedulerStatus = async () => {
    try {
      const response = await fetch('/api/notifications/schedule')
      if (response.ok) {
        const data = await response.json()
        setSchedulerStatus(data.status)
      }
    } catch (error) {
      console.error('Error checking scheduler status:', error)
    }
  }

  const handleSaveEmailConfig = async () => {
    try {
      setIsSavingEmail(true)
      
      // Validate required fields
      if (!emailConfig.smtpHost || !emailConfig.smtpPort || !emailConfig.fromEmail) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please fill in all required fields"
        })
        return
      }
      
      const response = await fetch('/api/settings/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailConfig)
      })
      
      if (response.ok) {
        toast({
          variant: "success",
          title: "Email Configuration Saved",
          description: "Your email settings have been saved successfully"
        })
      } else {
        throw new Error('Failed to save email configuration')
      }
    } catch (error) {
      console.error('Error saving email config:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save email configuration"
      })
    } finally {
      setIsSavingEmail(false)
    }
  }

  const loadTemplates = async () => {
    try {
      setLoading(true)
      // Load saved templates from API
      const response = await fetch('/api/notification-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || getDefaultTemplates())
      } else {
        setTemplates(getDefaultTemplates())
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      setTemplates(getDefaultTemplates())
    } finally {
      setLoading(false)
    }
  }

  const getDefaultTemplates = (): MessageTemplate[] => [
    {
      id: '1',
      name: 'Payment Reminder - 7 Days Before',
      type: 'email',
      category: 'payment_reminder',
      subject: 'Payment Reminder: {{amount}} due in 7 days',
      body: `Dear {{customerName}},

This is a friendly reminder that your loan payment is coming up.

Loan Details:
- Loan ID: {{loanId}}
- Payment Amount: {{amount}}
- Due Date: {{dueDate}}
- Days Remaining: 7

Please ensure your payment is made on or before the due date to avoid any late fees.

Best regards,
CrediLife Team`,
      html: '',
      variables: ['customerName', 'loanId', 'amount', 'dueDate'],
      enabled: true
    },
    {
      id: '2',
      name: 'WhatsApp Payment Reminder',
      type: 'whatsapp',
      category: 'payment_reminder',
      body: `🔔 *Payment Reminder*

Hello {{customerName}},

Your loan payment is due in *{{daysBeforeDue}} days*.

📋 *Loan Details:*
• Loan ID: {{loanId}}
• Amount: {{amount}}
• Due Date: {{dueDate}}

Please ensure timely payment to avoid late fees.

- CrediLife Team`,
      variables: ['customerName', 'loanId', 'amount', 'dueDate', 'daysBeforeDue'],
      enabled: true
    }
  ]

  const handleSaveTemplate = async () => {
    if (!templateForm.name || !templateForm.body) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields"
      })
      return
    }

    try {
      const newTemplate: MessageTemplate = {
        id: selectedTemplate?.id || Date.now().toString(),
        name: templateForm.name!,
        type: templateForm.type!,
        category: templateForm.category!,
        subject: templateForm.subject,
        body: templateForm.body!,
        html: templateForm.html,
        variables: extractVariables(templateForm.body + (templateForm.subject || '')),
        enabled: templateForm.enabled !== false
      }

      if (editMode && selectedTemplate) {
        setTemplates(prev => prev.map(t => t.id === selectedTemplate.id ? newTemplate : t))
      } else {
        setTemplates(prev => [...prev, newTemplate])
      }

      toast({
        variant: "success",
        title: "Success",
        description: `Template ${editMode ? 'updated' : 'created'} successfully`
      })

      setIsTemplateModalOpen(false)
      resetForm()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save template"
      })
    }
  }

  const extractVariables = (text: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g
    const matches = text.matchAll(regex)
    const variables = new Set<string>()
    for (const match of matches) {
      variables.add(match[1])
    }
    return Array.from(variables)
  }

  const handleEditTemplate = (template: MessageTemplate) => {
    setSelectedTemplate(template)
    setTemplateForm(template)
    setEditMode(true)
    setIsTemplateModalOpen(true)
  }

  const handleDeleteTemplate = async (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates(prev => prev.filter(t => t.id !== id))
      toast({
        variant: "success",
        title: "Template Deleted",
        description: "Template has been deleted successfully"
      })
    }
  }

  const handlePreviewTemplate = (template: MessageTemplate) => {
    setSelectedTemplate(template)
    setIsPreviewModalOpen(true)
  }

  const resetForm = () => {
    setTemplateForm({
      name: '',
      type: 'email',
      category: 'payment_reminder',
      subject: '',
      body: '',
      html: '',
      variables: [],
      enabled: true
    })
    setSelectedTemplate(null)
    setEditMode(false)
  }

  const handleNewTemplate = () => {
    resetForm()
    setIsTemplateModalOpen(true)
  }

  const handleConnectWhatsApp = async (type: WhatsAppConnection['type']) => {
    toast({
      title: "Switching Integration",
      description: `Switching to ${type === 'twilio' ? 'Twilio' : type === 'whatsapp_business' ? 'WhatsApp Business API' : 'WhatsApp Web'}`
    })
    setWhatsappConnection({ type, status: 'disconnected' })
  }

  const generateHTMLPreview = (template: MessageTemplate) => {
    if (template.type === 'whatsapp') {
      return template.body.replace(/\*(.+?)\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')
    }
    
    if (template.html) {
      return template.html
    }
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #06888D; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2>${template.subject || 'Notification'}</h2>
        </div>
        <div style="background: #f9fafb; padding: 20px;">
          <div style="white-space: pre-wrap;">${template.body}</div>
        </div>
      </div>
    `
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
          <p className="text-muted-foreground">
            Configure email and WhatsApp message templates and integration settings
          </p>
        </div>

        <Tabs defaultValue="templates" className="space-y-4">
          <TabsList>
            <TabsTrigger value="templates">Message Templates</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp Integration</TabsTrigger>
            <TabsTrigger value="email">Email Configuration</TabsTrigger>
            <TabsTrigger value="scheduler">Notification Scheduler</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Message Templates</CardTitle>
                    <CardDescription>
                      Create and manage templates for automated notifications
                    </CardDescription>
                  </div>
                  <Button onClick={handleNewTemplate}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {templates.map((template) => (
                    <Card key={template.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{template.name}</h4>
                              <Badge variant={template.type === 'email' ? 'default' : 'secondary'}>
                                {template.type === 'email' ? <Mail className="mr-1 h-3 w-3" /> : <MessageSquare className="mr-1 h-3 w-3" />}
                                {template.type}
                              </Badge>
                              <Badge variant="outline">{template.category}</Badge>
                              {template.enabled ? (
                                <Badge variant="success">Active</Badge>
                              ) : (
                                <Badge variant="destructive">Disabled</Badge>
                              )}
                            </div>
                            {template.subject && (
                              <p className="text-sm text-muted-foreground">
                                <strong>Subject:</strong> {template.subject}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {template.body}
                            </p>
                            <div className="flex gap-2">
                              <p className="text-xs text-muted-foreground">
                                <strong>Variables:</strong> {template.variables.join(', ')}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handlePreviewTemplate(template)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEditTemplate(template)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteTemplate(template.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>WhatsApp Integration</CardTitle>
                <CardDescription>
                  Configure WhatsApp connection for sending notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <MessageSquare className="h-8 w-8 text-green-600" />
                      <div>
                        <h4 className="font-semibold">Current Connection</h4>
                        <p className="text-sm text-muted-foreground">
                          {whatsappConnection.type === 'twilio' && 'Twilio WhatsApp API'}
                          {whatsappConnection.type === 'whatsapp_business' && 'WhatsApp Business Cloud API'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={whatsappConnection.status === 'connected' ? 'success' : whatsappConnection.status === 'pending' ? 'warning' : 'destructive'}>
                      {whatsappConnection.status}
                    </Badge>
                  </div>

                  <Tabs defaultValue={whatsappConnection.type} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="twilio">Twilio</TabsTrigger>
                      <TabsTrigger value="whatsapp_business">Business API</TabsTrigger>
                    </TabsList>

                    {/* Twilio Configuration */}
                    <TabsContent value="twilio" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Twilio WhatsApp Configuration</CardTitle>
                          <CardDescription>
                            Use Twilio's WhatsApp Business API for reliable messaging
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="twilio-account-sid">Account SID</Label>
                              <Input
                                id="twilio-account-sid"
                                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                className="font-mono"
                              />
                            </div>
                            <div>
                              <Label htmlFor="twilio-auth-token">Auth Token</Label>
                              <Input
                                id="twilio-auth-token"
                                type="password"
                                placeholder="••••••••••••••••••••••••••••••••"
                                className="font-mono"
                              />
                            </div>
                            <div>
                              <Label htmlFor="twilio-whatsapp-number">WhatsApp Number (Twilio Sandbox or Approved)</Label>
                              <Input
                                id="twilio-whatsapp-number"
                                placeholder="+14155238886 (Twilio Sandbox) or your approved number"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                For testing, use Twilio's sandbox number. For production, use your approved WhatsApp Business number.
                              </p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-4">
                            <Button variant="outline" size="sm">
                              Test Connection
                            </Button>
                            <Button>
                              Save Twilio Configuration
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* WhatsApp Business API Configuration */}
                    <TabsContent value="whatsapp_business" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">WhatsApp Business Cloud API</CardTitle>
                          <CardDescription>
                            Direct integration with Meta's WhatsApp Business Platform
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="wa-business-token">Access Token</Label>
                              <Input
                                id="wa-business-token"
                                type="password"
                                placeholder="EAAxxxxxxx..."
                                className="font-mono"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Get this from Meta for Developers → Your App → WhatsApp → API Setup
                              </p>
                            </div>
                            <div>
                              <Label htmlFor="wa-phone-id">Phone Number ID</Label>
                              <Input
                                id="wa-phone-id"
                                placeholder="1234567890123456"
                                className="font-mono"
                              />
                            </div>
                            <div>
                              <Label htmlFor="wa-business-id">WhatsApp Business Account ID</Label>
                              <Input
                                id="wa-business-id"
                                placeholder="1234567890123456"
                                className="font-mono"
                              />
                            </div>
                            <div>
                              <Label htmlFor="wa-webhook-token">Webhook Verify Token (Optional)</Label>
                              <Input
                                id="wa-webhook-token"
                                placeholder="Your custom verify token"
                              />
                            </div>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-xs text-blue-800">
                              <strong>Prerequisites:</strong> You need a Meta Business account, WhatsApp Business Platform access, and a verified business phone number.
                            </p>
                          </div>
                          <div className="flex justify-between items-center pt-4">
                            <Button variant="outline" size="sm">
                              Verify Webhook
                            </Button>
                            <Button>
                              Save Business API Configuration
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* WhatsApp Web QR Code Configuration */}
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Configuration</CardTitle>
                <CardDescription>
                  Configure email server settings for sending notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-host">SMTP Host *</Label>
                      <Input 
                        id="smtp-host" 
                        placeholder="smtp.gmail.com" 
                        value={emailConfig.smtpHost}
                        onChange={(e) => setEmailConfig({...emailConfig, smtpHost: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">SMTP Port *</Label>
                      <Input 
                        id="smtp-port" 
                        placeholder="587" 
                        type="number" 
                        value={emailConfig.smtpPort}
                        onChange={(e) => setEmailConfig({...emailConfig, smtpPort: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-user">Username</Label>
                      <Input 
                        id="smtp-user" 
                        placeholder="username or email" 
                        type="text" 
                        value={emailConfig.username}
                        onChange={(e) => setEmailConfig({...emailConfig, username: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-pass">Password</Label>
                      <Input 
                        id="smtp-pass" 
                        type="password" 
                        placeholder="••••••••" 
                        value={emailConfig.password}
                        onChange={(e) => setEmailConfig({...emailConfig, password: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="from-email">From Email *</Label>
                    <Input 
                      id="from-email" 
                      placeholder="CrediLife <notifications@credilife.com>" 
                      value={emailConfig.fromEmail}
                      onChange={(e) => setEmailConfig({...emailConfig, fromEmail: e.target.value})}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="use-tls" 
                      checked={emailConfig.useTLS}
                      onCheckedChange={(checked) => setEmailConfig({...emailConfig, useTLS: checked})}
                    />
                    <Label htmlFor="use-tls">Use TLS/SSL</Label>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={handleSaveEmailConfig}
                    disabled={isSavingEmail}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSavingEmail ? 'Saving...' : 'Save Email Configuration'}
                  </Button>
                  
                  <div className="border-t pt-4 mt-4 space-y-3">
                    <h4 className="font-medium">Test Email Configuration</h4>
                    <div className="flex gap-2">
                      <Input 
                        type="email"
                        placeholder="Enter recipient email address"
                        id="test-recipient-email"
                        className="flex-1"
                      />
                      <Button 
                        variant="outline"
                        onClick={async () => {
                          const testEmailInput = document.getElementById('test-recipient-email') as HTMLInputElement;
                          const recipientEmail = testEmailInput?.value;
                          
                          if (!recipientEmail) {
                            toast({
                              variant: "destructive",
                              title: "Email Required",
                              description: "Please enter a recipient email address"
                            })
                            return
                          }
                          
                          // Validate email config first
                          if (!emailConfig.smtpHost || !emailConfig.password) {
                            toast({
                              variant: "destructive",
                              title: "Configuration Required",
                              description: "Please fill in and save your email configuration first"
                            })
                            return
                          }
                          
                          try {
                            const response = await fetch('/api/notifications/test-email', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({
                                to: recipientEmail,
                                config: emailConfig
                              })
                            })
                            
                            const data = await response.json()
                            
                            if (response.ok) {
                              toast({
                                title: "Test Email Sent",
                                description: `Test email has been sent to ${recipientEmail}`
                              })
                              testEmailInput.value = '';
                            } else {
                              throw new Error(data.details || data.error || 'Failed to send test email')
                            }
                          } catch (error) {
                            toast({
                              variant: "destructive",
                              title: "Error",
                              description: error instanceof Error ? error.message : "Failed to send test email. Please check your configuration."
                            })
                          }
                        }}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Send Test
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enter an email address where you want to receive the test email
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="scheduler" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Notification Scheduler</CardTitle>
                    <CardDescription>
                      Manage automated notification scheduling for payment reminders
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={schedulerStatus === 'running' ? 'default' : 'secondary'}
                    className={schedulerStatus === 'running' ? 'bg-green-500' : ''}
                  >
                    {schedulerStatus === 'running' ? (
                      <>
                        <div className="mr-2 h-2 w-2 rounded-full bg-white animate-pulse" />
                        Running
                      </>
                    ) : (
                      'Stopped'
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Reminder Schedules */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Reminder Schedules</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure when payment reminders are sent to customers
                    </p>
                  </div>
                  
                  {/* Reminder List */}
                  <div className="space-y-3">
                    {reminderSchedules.map((schedule) => (
                      <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                        <div className="flex-1">
                          <div className="font-medium">
                            {schedule.name}
                            <span className="ml-2 text-sm text-muted-foreground">
                              ({schedule.days} {schedule.days === 1 ? 'day' : 'days'} {schedule.type === 'before' ? 'before due' : schedule.type === 'after' ? 'overdue' : ''})
                            </span>
                          </div>
                          <div className="space-y-2 mt-2">
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <Switch
                                  checked={schedule.email}
                                  onCheckedChange={(checked) => {
                                    updateReminderSchedule(schedule, { email: checked })
                                  }}
                                />
                                <Mail className="h-4 w-4" />
                                <span className="text-sm">Email</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <Switch
                                  checked={schedule.whatsapp}
                                  onCheckedChange={(checked) => {
                                    updateReminderSchedule(schedule, { whatsapp: checked })
                                  }}
                                />
                                <MessageSquare className="h-4 w-4" />
                                <span className="text-sm">WhatsApp</span>
                              </label>
                            </div>
                            <Select 
                              value={schedule.templateId || 'default'}
                              onValueChange={(value) => {
                                setReminderSchedules(reminderSchedules.map(s => 
                                  s.id === schedule.id ? { ...s, templateId: value === 'default' ? '' : value } : s
                                ))
                              }}
                            >
                              <SelectTrigger className="w-full max-w-xs">
                                <SelectValue placeholder="Select template" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="default">Default Template</SelectItem>
                                {templates.filter(t => t.type === 'email').map(template => (
                                  <SelectItem key={template.id} value={template.id}>
                                    {template.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={schedule.enabled}
                            onCheckedChange={(checked) => {
                              updateReminderSchedule(schedule, { enabled: checked })
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/settings/reminder-schedules?id=${schedule.id}`, {
                                  method: 'DELETE'
                                })
                                
                                if (response.ok) {
                                  setReminderSchedules(reminderSchedules.filter(s => s.id !== schedule.id))
                                  toast({
                                    title: "Schedule Removed",
                                    description: `${schedule.name} has been removed`
                                  })
                                } else {
                                  throw new Error('Failed to delete schedule')
                                }
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: "Failed to delete reminder schedule",
                                  variant: "destructive"
                                })
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Add New Schedule */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Add New Schedule</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="Schedule name"
                        value={newScheduleName}
                        onChange={(e) => setNewScheduleName(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Days"
                          value={newScheduleDays}
                          onChange={(e) => setNewScheduleDays(e.target.value)}
                          className="w-24"
                        />
                        <Select value={newScheduleType} onValueChange={(value: 'before' | 'due' | 'after') => setNewScheduleType(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="before">Before Due</SelectItem>
                            <SelectItem value="due">Due Date</SelectItem>
                            <SelectItem value="after">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-3 mt-3">
                      <Select 
                        value={newScheduleTemplateId || 'default'}
                        onValueChange={(value) => setNewScheduleTemplateId(value === 'default' ? '' : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default Template</SelectItem>
                          {templates.filter(t => t.type === 'email').map(template => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2">
                            <Switch
                              checked={newScheduleEmail}
                              onCheckedChange={setNewScheduleEmail}
                            />
                            <Mail className="h-4 w-4" />
                            <span className="text-sm">Email</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <Switch
                              checked={newScheduleWhatsapp}
                              onCheckedChange={setNewScheduleWhatsapp}
                            />
                            <MessageSquare className="h-4 w-4" />
                            <span className="text-sm">WhatsApp</span>
                          </label>
                        </div>
                      <Button
                        onClick={async () => {
                          if (!newScheduleName || !newScheduleDays) {
                            toast({
                              variant: "destructive",
                              title: "Missing Information",
                              description: "Please enter a name and days"
                            })
                            return
                          }
                          
                          const newScheduleData = {
                            name: newScheduleName,
                            days: parseInt(newScheduleDays),
                            type: newScheduleType,
                            email: newScheduleEmail,
                            whatsapp: newScheduleWhatsapp,
                            enabled: true,
                            emailTemplateId: newScheduleTemplateId
                          }
                          
                          try {
                            const response = await fetch('/api/settings/reminder-schedules', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify(newScheduleData)
                            })
                            
                            if (response.ok) {
                              // Reload schedules to get the new one with proper ID
                              await loadReminderSchedules()
                              
                              setNewScheduleName('')
                              setNewScheduleDays('0')
                              setNewScheduleType('before')
                              setNewScheduleEmail(true)
                              setNewScheduleWhatsapp(false)
                              setNewScheduleTemplateId('')
                              
                              toast({
                                title: "Schedule Added",
                                description: `${newScheduleData.name} has been added`
                              })
                            } else {
                              throw new Error('Failed to create schedule')
                            }
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to add reminder schedule",
                              variant: "destructive"
                            })
                          }
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add
                      </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Scheduler Settings</h4>
                  <div className="flex items-end gap-2 mb-4">
                    <div className="flex-1">
                      <Label htmlFor="check-interval">Check Interval</Label>
                      <Input
                        id="check-interval"
                        type="number"
                        min="1"
                        value={schedulerInterval}
                        onChange={(e) => setSchedulerInterval(e.target.value)}
                        placeholder="60"
                      />
                    </div>
                    <Select value={schedulerIntervalUnit} onValueChange={(value: 'seconds' | 'minutes' | 'hours') => setSchedulerIntervalUnit(value)}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seconds">Seconds</SelectItem>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant={schedulerStatus === 'stopped' ? 'default' : 'outline'}
                      className={schedulerStatus === 'running' ? 'border-green-500 text-green-600' : ''}
                      disabled={schedulerStatus === 'running' || isLoadingScheduler}
                      onClick={async () => {
                        try {
                          setIsLoadingScheduler(true)
                          // Calculate interval in milliseconds
                          let intervalMs = parseInt(schedulerInterval) || 60;
                          if (schedulerIntervalUnit === 'minutes') {
                            intervalMs = intervalMs * 60 * 1000;
                          } else if (schedulerIntervalUnit === 'hours') {
                            intervalMs = intervalMs * 60 * 60 * 1000;
                          } else {
                            intervalMs = intervalMs * 1000; // seconds
                          }
                          
                          const scheduleConfig = {
                            action: 'start',
                            intervalMs: intervalMs,
                            reminderSchedules: reminderSchedules.filter(s => s.enabled)
                          }
                          
                          const response = await fetch('/api/notifications/schedule', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(scheduleConfig)
                          });
                          
                          if (response.ok) {
                            setSchedulerStatus('running')
                            const activeSchedules = reminderSchedules.filter(s => s.enabled).length;
                            toast({
                              title: "Scheduler Started",
                              description: `Running with ${activeSchedules} active reminder schedules, checking every ${schedulerInterval} ${schedulerIntervalUnit}`
                            });
                          }
                        } catch (error) {
                          toast({
                            variant: "destructive",
                            title: "Error",
                            description: "Failed to start scheduler"
                          });
                        } finally {
                          setIsLoadingScheduler(false)
                        }
                      }}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {schedulerStatus === 'running' ? 'Running' : 'Start Scheduler'}
                    </Button>
                    
                    <Button
                      variant={schedulerStatus === 'running' ? 'destructive' : 'outline'}
                      disabled={schedulerStatus === 'stopped' || isLoadingScheduler}
                      onClick={async () => {
                        try {
                          setIsLoadingScheduler(true)
                          const response = await fetch('/api/notifications/schedule', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'stop' })
                          });
                          
                          if (response.ok) {
                            setSchedulerStatus('stopped')
                            toast({
                              title: "Scheduler Stopped",
                              description: "Notification scheduler has been stopped"
                            });
                          }
                        } catch (error) {
                          toast({
                            variant: "destructive",
                            title: "Error",
                            description: "Failed to stop scheduler"
                          });
                        } finally {
                          setIsLoadingScheduler(false)
                        }
                      }}
                    >
                      <Square className="mr-2 h-4 w-4" />
                      Stop Scheduler
                    </Button>
                    
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/notifications/schedule', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'check' })
                          });
                          
                          if (response.ok) {
                            toast({
                              title: "Check Complete",
                              description: "Notification check has been triggered"
                            });
                          }
                        } catch (error) {
                          toast({
                            variant: "destructive",
                            title: "Error",
                            description: "Failed to trigger notification check"
                          });
                        }
                      }}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Check Now
                    </Button>
                  </div>
                  
                  <div className="border-t pt-4 space-y-4">
                    <h3 className="font-semibold">Test Scheduler</h3>
                    
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="test-email">Test Email Address</Label>
                          <Input
                            id="test-email"
                            type="email"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            placeholder="test@example.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="test-date">Simulate Date</Label>
                          <Input
                            id="test-date"
                            type="date"
                            value={testDate}
                            onChange={(e) => setTestDate(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="test-time">Simulate Time</Label>
                        <Input
                          id="test-time"
                          type="time"
                          value={testTime}
                          onChange={(e) => setTestTime(e.target.value)}
                          className="max-w-xs"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          disabled={isTestingSchedule}
                          onClick={async () => {
                            if (!testEmail) {
                              toast({
                                variant: "destructive",
                                title: "Email Required",
                                description: "Please enter an email address"
                              });
                              return;
                            }
                            
                            try {
                              setIsTestingSchedule(true);
                              const simulatedDateTime = `${testDate}T${testTime}:00`;
                              
                              const response = await fetch('/api/notifications/schedule', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                  action: 'simulate',
                                  email: testEmail,
                                  simulatedDate: simulatedDateTime,
                                  scheduleConfig: {
                                    scheduleType,
                                    dailyTime,
                                    daysBeforeDue: customDaysBeforeDue
                                  }
                                })
                              });
                              
                              const data = await response.json();
                              
                              if (data.success) {
                                toast({
                                  title: "Test Complete",
                                  description: data.message || `Simulation complete for ${simulatedDateTime}`
                                });
                              } else {
                                toast({
                                  variant: "destructive",
                                  title: "Test Failed",
                                  description: data.message || "Failed to run test"
                                });
                              }
                            } catch (error) {
                              toast({
                                variant: "destructive",
                                title: "Error",
                                description: "Failed to run scheduler test"
                              });
                            } finally {
                              setIsTestingSchedule(false);
                            }
                          }}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          {isTestingSchedule ? 'Testing...' : 'Test Schedule'}
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={async () => {
                            if (!testEmail) {
                              toast({
                                variant: "destructive",
                                title: "Email Required",
                                description: "Please enter an email address"
                              });
                              return;
                            }
                            
                            try {
                              const response = await fetch('/api/notifications/schedule', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                  action: 'test',
                                  email: testEmail
                                })
                              });
                              
                              const data = await response.json();
                              
                              if (data.success) {
                                toast({
                                  title: "Test Email Sent",
                                  description: `Test email sent to ${testEmail}`
                                });
                              } else {
                                toast({
                                  variant: "destructive",
                                  title: "Failed to Send",
                                  description: data.message || "Failed to send test email"
                                });
                              }
                            } catch (error) {
                              toast({
                                variant: "destructive",
                                title: "Error",
                                description: "Failed to send test email"
                              });
                            }
                          }}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Send Test Email Now
                        </Button>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        Test your scheduler configuration by simulating a specific date and time. This will show what notifications would be sent based on your current settings.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Template Editor Modal */}
        <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editMode ? 'Edit Template' : 'Create New Template'}</DialogTitle>
              <DialogDescription>
                Create or edit message templates for automated notifications
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name *</Label>
                  <Input
                    id="template-name"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                    placeholder="e.g., Payment Reminder - 7 Days"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-type">Type *</Label>
                  <Select
                    value={templateForm.type}
                    onValueChange={(value) => setTemplateForm({...templateForm, type: value as 'email' | 'whatsapp'})}
                  >
                    <SelectTrigger id="template-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template-category">Category *</Label>
                  <Select
                    value={templateForm.category}
                    onValueChange={(value) => setTemplateForm({...templateForm, category: value as MessageTemplate['category']})}
                  >
                    <SelectTrigger id="template-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="payment_reminder">Payment Reminder</SelectItem>
                      <SelectItem value="pre_approval">Pre-Approval</SelectItem>
                      <SelectItem value="overdue">Overdue Notice</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-enabled">Status</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="template-enabled"
                      checked={templateForm.enabled}
                      onCheckedChange={(checked) => setTemplateForm({...templateForm, enabled: checked})}
                    />
                    <Label htmlFor="template-enabled">
                      {templateForm.enabled ? 'Active' : 'Disabled'}
                    </Label>
                  </div>
                </div>
              </div>

              {templateForm.type === 'email' && (
                <div className="space-y-2">
                  <Label htmlFor="template-subject">Subject Line</Label>
                  <Input
                    id="template-subject"
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm({...templateForm, subject: e.target.value})}
                    placeholder="e.g., Payment Reminder: {{amount}} due in {{days}} days"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="template-body">Message Body *</Label>
                <Textarea
                  id="template-body"
                  value={templateForm.body}
                  onChange={(e) => setTemplateForm({...templateForm, body: e.target.value})}
                  placeholder="Enter your message template here..."
                  rows={10}
                />
                <p className="text-xs text-muted-foreground">
                  Use {'{{variable}}'} syntax for dynamic content. Available variables: customerName, loanId, amount, dueDate, daysBeforeDue
                </p>
              </div>

              {templateForm.type === 'email' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="template-html">HTML Template (Optional)</Label>
                    <Button variant="outline" size="sm">
                      <Code className="mr-2 h-4 w-4" />
                      HTML Editor
                    </Button>
                  </div>
                  <Textarea
                    id="template-html"
                    value={templateForm.html}
                    onChange={(e) => setTemplateForm({...templateForm, html: e.target.value})}
                    placeholder="Enter custom HTML template (optional)..."
                    rows={8}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTemplateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate}>
                {editMode ? 'Update Template' : 'Create Template'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Template Preview Modal */}
        <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Template Preview</DialogTitle>
              <DialogDescription>
                {selectedTemplate?.name}
              </DialogDescription>
            </DialogHeader>

            {selectedTemplate && (
              <div className="space-y-4">
                {selectedTemplate.type === 'email' && selectedTemplate.subject && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-semibold">Subject:</p>
                    <p>{selectedTemplate.subject}</p>
                  </div>
                )}

                <div className="border rounded-lg p-4">
                  <div dangerouslySetInnerHTML={{ __html: generateHTMLPreview(selectedTemplate) }} />
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-semibold mb-2">Variables Used:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.map((variable) => (
                      <Badge key={variable} variant="secondary">
                        {'{{'}{variable}{'}}'}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPreviewModalOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  )
}