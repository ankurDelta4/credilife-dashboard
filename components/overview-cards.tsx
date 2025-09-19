"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Users, FileText, UserCheck, TrendingUp, TrendingDown } from "lucide-react"

interface DashboardStats {
  totalLoans: {
    value: number
    change: number
    changeType: "positive" | "negative" | "neutral"
  }
  totalUsers: {
    value: number
    change: number
    changeType: "positive" | "negative" | "neutral"
  }
  loanApplications: {
    value: number
    change: number
    changeType: "positive" | "negative" | "neutral"
  }
  completedLoans: {
    value: number
    change: number
    changeType: "positive" | "negative" | "neutral"
  }
}

interface MetricCardProps {
  title: string
  value: string
  change: string
  changeType: "positive" | "negative" | "neutral"
  icon: React.ReactNode
  description?: string
}

function MetricCard({ title, value, change, changeType, icon, description }: MetricCardProps) {
  const getTrendIcon = () => {
    if (changeType === "positive") return <TrendingUp className="h-3 w-3" />
    if (changeType === "negative") return <TrendingDown className="h-3 w-3" />
    return null
  }

  const getChangeColor = () => {
    if (changeType === "positive") return "text-green-600"
    if (changeType === "negative") return "text-red-600"
    return "text-muted-foreground"
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-4 w-4 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className={`flex items-center gap-1 text-xs ${getChangeColor()}`}>
          {getTrendIcon()}
          <span>{change}</span>
          {description && (
            <span className="text-muted-foreground ml-1">{description}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function OverviewCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data.stats)
      } else {
        setError(data.error || 'Failed to fetch dashboard stats')
      }
    } catch (err) {
      setError('Failed to fetch dashboard stats')
      console.error('Error fetching dashboard stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-full">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-red-500">{error || 'Failed to load dashboard stats'}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Loans"
        value={`$${stats.totalLoans.value.toLocaleString()}`}
        change={`${stats.totalLoans.change > 0 ? '+' : ''}${stats.totalLoans.change}%`}
        changeType={stats.totalLoans.changeType}
        icon={<DollarSign className="h-4 w-4" />}
        description="from last month"
      />
      <MetricCard
        title="Total Users"
        value={stats.totalUsers.value.toString()}
        change={`${stats.totalUsers.change > 0 ? '+' : ''}${stats.totalUsers.change}%`}
        changeType={stats.totalUsers.changeType}
        icon={<Users className="h-4 w-4" />}
        description="from last month"
      />
      <MetricCard
        title="Loan Applications"
        value={stats.loanApplications.value.toString()}
        change={`${stats.loanApplications.change > 0 ? '+' : ''}${stats.loanApplications.change}%`}
        changeType={stats.loanApplications.changeType}
        icon={<FileText className="h-4 w-4" />}
        description="from last month"
      />
      <MetricCard
        title="Completed Loans"
        value={stats.completedLoans.value.toString()}
        change={`${stats.completedLoans.change > 0 ? '+' : ''}${stats.completedLoans.change}%`}
        changeType={stats.completedLoans.changeType}
        icon={<UserCheck className="h-4 w-4" />}
        description="from last month"
      />
    </div>
  )
}