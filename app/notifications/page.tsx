'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  Mail, 
  MessageSquare, 
  Clock, 
  Send, 
  Settings, 
  CheckCircle, 
  XCircle,
  Plus,
  Trash2,
  TestTube
} from 'lucide-react';

interface ReminderSchedule {
  id: string;
  name: string;
  daysBeforeDue: number;
  enabled: boolean;
  channels: {
    email: boolean;
    whatsapp: boolean;
  };
}

interface NotificationConfig {
  email: {
    enabled: boolean;
    host: string;
    port: number;
    secure: boolean;
  };
  whatsapp: {
    enabled: boolean;
    accountSid: string;
    fromNumber: string;
  };
}

export default function NotificationsPage() {
  const [schedules, setSchedules] = useState<ReminderSchedule[]>([]);
  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const { toast } = useToast();

  const [emailConfig, setEmailConfig] = useState({
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
  });

  const [whatsappConfig, setWhatsappConfig] = useState({
    accountSid: '',
    authToken: '',
    fromNumber: '',
  });

  const [testConfig, setTestConfig] = useState({
    email: '',
    phone: '',
    message: 'This is a test notification from CrediLife Dashboard',
  });

  const [newSchedule, setNewSchedule] = useState({
    name: '',
    daysBeforeDue: 0,
    email: true,
    whatsapp: true,
  });

  useEffect(() => {
    fetchSchedules();
    fetchConfig();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/notifications/schedules');
      const data = await response.json();
      if (data.success) {
        setSchedules(data.data);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch reminder schedules',
        variant: 'destructive',
      });
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/notifications/config');
      const data = await response.json();
      if (data.success) {
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const updateSchedule = async (id: string, updates: Partial<ReminderSchedule>) => {
    try {
      const response = await fetch('/api/notifications/schedules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      
      const data = await response.json();
      if (data.success) {
        fetchSchedules();
        toast({
          title: 'Success',
          description: 'Schedule updated successfully',
        });
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to update schedule',
        variant: 'destructive',
      });
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/schedules?id=${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      if (data.success) {
        fetchSchedules();
        toast({
          title: 'Success',
          description: 'Schedule deleted successfully',
        });
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete schedule',
        variant: 'destructive',
      });
    }
  };

  const addSchedule = async () => {
    if (!newSchedule.name) {
      toast({
        title: 'Error',
        description: 'Please provide a name for the schedule',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/notifications/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSchedule.name,
          daysBeforeDue: newSchedule.daysBeforeDue,
          enabled: true,
          channels: {
            email: newSchedule.email,
            whatsapp: newSchedule.whatsapp,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchSchedules();
        setNewSchedule({
          name: '',
          daysBeforeDue: 0,
          email: true,
          whatsapp: true,
        });
        toast({
          title: 'Success',
          description: 'Schedule added successfully',
        });
      }
    } catch (error) {
      console.error('Error adding schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to add schedule',
        variant: 'destructive',
      });
    }
  };

  const saveEmailConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailConfig }),
      });

      const data = await response.json();
      if (data.success) {
        fetchConfig();
        toast({
          title: 'Success',
          description: 'Email configuration saved',
        });
      }
    } catch (error) {
      console.error('Error saving email config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save email configuration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveWhatsAppConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp: whatsappConfig }),
      });

      const data = await response.json();
      if (data.success) {
        fetchConfig();
        toast({
          title: 'Success',
          description: 'WhatsApp configuration saved',
        });
      }
    } catch (error) {
      console.error('Error saving WhatsApp config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save WhatsApp configuration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testEmail: testConfig.email,
          testPhone: testConfig.phone,
          testMessage: testConfig.message,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Test notifications sent',
        });
      }
    } catch (error) {
      console.error('Error sending test notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to send test notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendScheduledReminders = async () => {
    setSendingReminders(true);
    try {
      const response = await fetch('/api/notifications/send-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useMockData: true }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Reminders Sent',
          description: `Sent ${data.summary.notificationsSent} notifications to ${data.summary.remindersProcessed} customers`,
        });
      }
    } catch (error) {
      console.error('Error sending reminders:', error);
      toast({
        title: 'Error',
        description: 'Failed to send reminders',
        variant: 'destructive',
      });
    } finally {
      setSendingReminders(false);
    }
  };

  const getDaysLabel = (days: number) => {
    if (days === 0) return 'On due date';
    if (days > 0) return `${days} days before due`;
    return `${Math.abs(days)} days overdue`;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notification Settings</h1>
          <p className="text-gray-600 mt-1">Configure payment reminders and notification channels</p>
        </div>
        <Button 
          onClick={sendScheduledReminders}
          disabled={sendingReminders}
        >
          <Send className="mr-2 h-4 w-4" />
          {sendingReminders ? 'Sending...' : 'Send Scheduled Reminders'}
        </Button>
      </div>

      <Tabs defaultValue="schedules" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schedules">
            <Clock className="mr-2 h-4 w-4" />
            Schedules
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="mr-2 h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="whatsapp">
            <MessageSquare className="mr-2 h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="test">
            <TestTube className="mr-2 h-4 w-4" />
            Test
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reminder Schedules</CardTitle>
              <CardDescription>
                Configure when payment reminders are sent to customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{schedule.name}</h3>
                      <span className="text-sm text-gray-500">
                        ({getDaysLabel(schedule.daysBeforeDue)})
                      </span>
                    </div>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2">
                        <Switch
                          checked={schedule.channels.email}
                          onCheckedChange={(checked) =>
                            updateSchedule(schedule.id, {
                              channels: { ...schedule.channels, email: checked },
                            })
                          }
                        />
                        <Mail className="h-4 w-4" />
                        Email
                      </label>
                      <label className="flex items-center gap-2">
                        <Switch
                          checked={schedule.channels.whatsapp}
                          onCheckedChange={(checked) =>
                            updateSchedule(schedule.id, {
                              channels: { ...schedule.channels, whatsapp: checked },
                            })
                          }
                        />
                        <MessageSquare className="h-4 w-4" />
                        WhatsApp
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={schedule.enabled}
                      onCheckedChange={(checked) =>
                        updateSchedule(schedule.id, { enabled: checked })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSchedule(schedule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Add New Schedule</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Schedule name"
                    value={newSchedule.name}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, name: e.target.value })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Days before/after due"
                    value={newSchedule.daysBeforeDue}
                    onChange={(e) =>
                      setNewSchedule({
                        ...newSchedule,
                        daysBeforeDue: parseInt(e.target.value),
                      })
                    }
                  />
                  <div className="flex gap-2">
                    <label className="flex items-center gap-1">
                      <Switch
                        checked={newSchedule.email}
                        onCheckedChange={(checked) =>
                          setNewSchedule({ ...newSchedule, email: checked })
                        }
                      />
                      <Mail className="h-4 w-4" />
                    </label>
                    <label className="flex items-center gap-1">
                      <Switch
                        checked={newSchedule.whatsapp}
                        onCheckedChange={(checked) =>
                          setNewSchedule({ ...newSchedule, whatsapp: checked })
                        }
                      />
                      <MessageSquare className="h-4 w-4" />
                    </label>
                    <Button onClick={addSchedule}>
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Configure your corporate email system for sending notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email-host">SMTP Host</Label>
                  <Input
                    id="email-host"
                    placeholder="smtp.gmail.com"
                    value={emailConfig.host}
                    onChange={(e) =>
                      setEmailConfig({ ...emailConfig, host: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="email-port">SMTP Port</Label>
                  <Input
                    id="email-port"
                    type="number"
                    placeholder="587"
                    value={emailConfig.port}
                    onChange={(e) =>
                      setEmailConfig({
                        ...emailConfig,
                        port: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="email-user">Email Username</Label>
                  <Input
                    id="email-user"
                    type="email"
                    placeholder="notifications@company.com"
                    value={emailConfig.user}
                    onChange={(e) =>
                      setEmailConfig({ ...emailConfig, user: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="email-pass">Email Password</Label>
                  <Input
                    id="email-pass"
                    type="password"
                    placeholder="••••••••"
                    value={emailConfig.pass}
                    onChange={(e) =>
                      setEmailConfig({ ...emailConfig, pass: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={emailConfig.secure}
                  onCheckedChange={(checked) =>
                    setEmailConfig({ ...emailConfig, secure: checked })
                  }
                />
                <Label>Use SSL/TLS</Label>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {config?.email.enabled ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-sm">
                    Email service is {config?.email.enabled ? 'connected' : 'not connected'}
                  </span>
                </div>
                <Button onClick={saveEmailConfig} disabled={loading}>
                  <Settings className="mr-2 h-4 w-4" />
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Configuration</CardTitle>
              <CardDescription>
                Configure WhatsApp Business API for sending notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="twilio-sid">Twilio Account SID</Label>
                  <Input
                    id="twilio-sid"
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={whatsappConfig.accountSid}
                    onChange={(e) =>
                      setWhatsappConfig({
                        ...whatsappConfig,
                        accountSid: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="twilio-token">Twilio Auth Token</Label>
                  <Input
                    id="twilio-token"
                    type="password"
                    placeholder="••••••••••••••••••••••••••••••••"
                    value={whatsappConfig.authToken}
                    onChange={(e) =>
                      setWhatsappConfig({
                        ...whatsappConfig,
                        authToken: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp-from">WhatsApp From Number</Label>
                  <Input
                    id="whatsapp-from"
                    placeholder="+14155238886"
                    value={whatsappConfig.fromNumber}
                    onChange={(e) =>
                      setWhatsappConfig({
                        ...whatsappConfig,
                        fromNumber: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {config?.whatsapp.enabled ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-sm">
                    WhatsApp service is {config?.whatsapp.enabled ? 'connected' : 'not connected'}
                  </span>
                </div>
                <Button onClick={saveWhatsAppConfig} disabled={loading}>
                  <Settings className="mr-2 h-4 w-4" />
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Notifications</CardTitle>
              <CardDescription>
                Send test notifications to verify your configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="test-email">Test Email Address</Label>
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="test@example.com"
                    value={testConfig.email}
                    onChange={(e) =>
                      setTestConfig({ ...testConfig, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="test-phone">Test Phone Number</Label>
                  <Input
                    id="test-phone"
                    placeholder="+1234567890"
                    value={testConfig.phone}
                    onChange={(e) =>
                      setTestConfig({ ...testConfig, phone: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="test-message">Test Message</Label>
                <Input
                  id="test-message"
                  placeholder="Test message content"
                  value={testConfig.message}
                  onChange={(e) =>
                    setTestConfig({ ...testConfig, message: e.target.value })
                  }
                />
              </div>
              <Button
                onClick={sendTestNotifications}
                disabled={loading || (!testConfig.email && !testConfig.phone)}
                className="w-full"
              >
                <Send className="mr-2 h-4 w-4" />
                Send Test Notifications
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
}