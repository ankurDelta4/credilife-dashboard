"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { 
  Shield, 
  Key, 
  Users, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Settings
} from "lucide-react"

interface AuthSession {
  id: string
  user: string
  device: string
  location: string
  lastActive: Date
  status: "active" | "expired"
}

interface AuthSettings {
  twoFactorEnabled: boolean
  passwordExpiry: number
  sessionTimeout: number
  maxLoginAttempts: number
}

const mockSessions: AuthSession[] = [
  {
    id: "1",
    user: "john.doe@loanflow.com",
    device: "Chrome on Windows",
    location: "New York, NY",
    lastActive: new Date("2024-09-19T10:30:00"),
    status: "active"
  },
  {
    id: "2", 
    user: "jane.smith@loanflow.com",
    device: "Safari on MacOS",
    location: "San Francisco, CA",
    lastActive: new Date("2024-09-19T09:15:00"),
    status: "active"
  },
  {
    id: "3",
    user: "admin@loanflow.com",
    device: "Firefox on Linux",
    location: "Chicago, IL",
    lastActive: new Date("2024-09-18T16:45:00"),
    status: "expired"
  }
]

export default function AuthPage() {
  const [sessions, setSessions] = useState<AuthSession[]>(mockSessions)
  const [authSettings, setAuthSettings] = useState<AuthSettings>({
    twoFactorEnabled: true,
    passwordExpiry: 90,
    sessionTimeout: 30,
    maxLoginAttempts: 5
  })

  const handleRevokeSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    console.log("Revoked session:", sessionId)
  }

  const handleUpdateSettings = () => {
    console.log("Updated auth settings:", authSettings)
  }

  const activeSessions = sessions.filter(s => s.status === "active")
  const expiredSessions = sessions.filter(s => s.status === "expired")

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Authentication</h1>
            <p className="text-muted-foreground">
              Manage authentication settings, sessions, and security policies.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Sessions
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeSessions.length}</div>
              <p className="text-xs text-muted-foreground">
                Currently logged in
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                2FA Enabled
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {authSettings.twoFactorEnabled ? "Yes" : "No"}
              </div>
              <p className="text-xs text-muted-foreground">
                Two-factor authentication
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Session Timeout
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{authSettings.sessionTimeout}m</div>
              <p className="text-xs text-muted-foreground">
                Auto logout time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Failed Attempts
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">3</div>
              <p className="text-xs text-muted-foreground">
                Last 24 hours
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="sessions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
            <TabsTrigger value="settings">Security Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active User Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{session.user}</p>
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{session.device}</p>
                        <p className="text-sm text-muted-foreground">{session.location}</p>
                        <p className="text-xs text-muted-foreground">
                          Last active: {session.lastActive.toLocaleString()}
                        </p>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleRevokeSession(session.id)}
                      >
                        Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Security Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for all user logins
                    </p>
                  </div>
                  <Switch
                    checked={authSettings.twoFactorEnabled}
                    onCheckedChange={(checked) => 
                      setAuthSettings(prev => ({ ...prev, twoFactorEnabled: checked }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-expiry">Password Expiry (days)</Label>
                  <Input
                    id="password-expiry"
                    type="number"
                    value={authSettings.passwordExpiry}
                    onChange={(e) => 
                      setAuthSettings(prev => ({ ...prev, passwordExpiry: Number(e.target.value) }))
                    }
                    className="w-32"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={authSettings.sessionTimeout}
                    onChange={(e) => 
                      setAuthSettings(prev => ({ ...prev, sessionTimeout: Number(e.target.value) }))
                    }
                    className="w-32"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-attempts">Max Login Attempts</Label>
                  <Input
                    id="max-attempts"
                    type="number"
                    value={authSettings.maxLoginAttempts}
                    onChange={(e) => 
                      setAuthSettings(prev => ({ ...prev, maxLoginAttempts: Number(e.target.value) }))
                    }
                    className="w-32"
                  />
                </div>

                <Button onClick={handleUpdateSettings}>
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}