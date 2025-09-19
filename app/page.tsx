"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { OverviewCards } from "@/components/overview-cards"
import { DataTable, Column } from "@/components/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity } from "lucide-react"

interface RecentActivity {
  id: number
  type: "loan_approved" | "payment_received" | "application_submitted" | "loan_overdue"
  description: string
  timestamp: string
  amount?: number
  userId?: string
}

interface Loan {
  id: number
  userId: string
  amount: number
  status: string
  interestRate: number | string
  termMonths: number | string
  repaymentType: string
  createdAt: string
  updatedAt: string
  endDate: string
}

interface LoanApplication {
  id: number
  customerName: string
  email: string
  amount: number
  status: string
  tenure: number | string
  repaymentType: string
  submitDate: string
}

// For loan applications
const recentApplicationsColumns: Column[] = [
  { key: "customerName", label: "Customer" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status", width: "120px" },
  { key: "tenure", label: "Tenure" },
  { key: "repaymentType", label: "Repayment Type" },
  { key: "submitDate", label: "Submit Date" },
]

// For loans  
const recentLoansColumns: Column[] = [
  { key: "userId", label: "Customer" },
  { key: "amount", label: "Principal Amount" },
  { key: "status", label: "Status", width: "120px" },
  { key: "interestRate", label: "Interest Amount" },
  { key: "termMonths", label: "Tenure" },
  { key: "repaymentType", label: "Repayment Type" },
]

const activityTypeIcons = {
  loan_approved: "✅",
  payment_received: "💰",
  application_submitted: "📝",
  loan_overdue: "⚠️",
}


export default function Dashboard() {
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [activitiesError, setActivitiesError] = useState<string | null>(null)
  
  const [recentData, setRecentData] = useState<Loan[] | LoanApplication[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)
  const [dataType, setDataType] = useState<'loans' | 'applications'>('applications') // Default to applications

  useEffect(() => {
    console.log(`useEffect triggered with dataType: ${dataType}`)
    fetchRecentActivities()
    fetchRecentData()
  }, [dataType])

  const fetchRecentActivities = async () => {
    try {
      setActivitiesLoading(true)
      const response = await fetch('/api/activities?limit=8')
      const data = await response.json()
      
      if (data.success) {
        setRecentActivities(data.data.activities)
      } else {
        setActivitiesError(data.error || 'Failed to fetch activities')
      }
    } catch (err) {
      setActivitiesError('Failed to fetch activities')
      console.error('Error fetching activities:', err)
    } finally {
      setActivitiesLoading(false)
    }
  }

  const fetchRecentData = async () => {
    try {
      setDataLoading(true)
      const timestamp = Date.now()
      const url = `/api/loans?type=${dataType}&limit=5&_t=${timestamp}`
      console.log(`Frontend fetching data for type: ${dataType}`)
      console.log(`Frontend API URL: ${url}`)
      
      const response = await fetch(url, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const data = await response.json()
      
      console.log(`Frontend received response:`, data)
      
      if (data.success) {
        const responseData = dataType === 'applications' ? data.data.applications : data.data.loans
        console.log(`Frontend extracted data:`, responseData)
        setRecentData(responseData || [])
      } else {
        setDataError(data.error || `Failed to fetch ${dataType}`)
      }
    } catch (err) {
      setDataError(`Failed to fetch ${dataType}`)
      console.error(`Error fetching ${dataType}:`, err)
    } finally {
      setDataLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here&apos;s an overview of your loan portfolio.
            </p>
          </div>
        </div>

        <OverviewCards />

        <div className="grid gap-6 lg:grid-cols-7">
          <div className="lg:col-span-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  Recent {dataType === 'applications' ? 'Loan Applications' : 'Loans'}
                </CardTitle>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      console.log('Switching to applications')
                      setDataType('applications')
                    }}
                    className={`px-3 py-1 text-xs rounded ${
                      dataType === 'applications' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Applications
                  </button>
                  <button
                    onClick={() => {
                      console.log('Switching to loans')
                      setDataType('loans')
                    }}
                    className={`px-3 py-1 text-xs rounded ${
                      dataType === 'loans' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Loans
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-muted-foreground">Loading {dataType}...</div>
                  </div>
                ) : dataError ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-red-500">{dataError}</div>
                  </div>
                ) : (
                  <DataTable
                    columns={dataType === 'applications' ? recentApplicationsColumns : recentLoansColumns}
                    data={recentData}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-muted animate-pulse rounded" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                          <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activitiesError ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-red-500">{activitiesError}</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="text-lg">
                          {activityTypeIcons[activity.type]}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.timestamp).toLocaleString('en-US')}
                            </p>
                            {activity.amount && (
                              <Badge variant="outline" className="text-xs">
                                ${activity.amount.toLocaleString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
