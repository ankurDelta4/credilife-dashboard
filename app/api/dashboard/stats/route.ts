import { NextRequest, NextResponse } from 'next/server';

// Mock data for fallback
const mockStats = {
    totalLoans: 42, // Number of loans, not amount
    totalUsers: 156,
    loanApplications: 24,
    completedLoans: 15,
    monthlyChanges: {
        totalLoans: 12.5,
        totalUsers: 8.2,
        loanApplications: -4.1,
        completedLoans: 15.3
    }
};

// Helper function to calculate percentage change
const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};

// Helper function to get date range for previous month
const getPreviousMonthDateRange = () => {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    return {
        currentMonth: currentMonth.toISOString().split('T')[0],
        previousMonthStart: previousMonthStart.toISOString().split('T')[0],
        previousMonthEnd: previousMonthEnd.toISOString().split('T')[0]
    };
};

export async function GET(request: NextRequest) {
    try {
        // Fetch dashboard stats from backend API
        const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
        
        try {
            const { currentMonth, previousMonthStart, previousMonthEnd } = getPreviousMonthDateRange();
            
            // Fetch current data and previous month data for comparison
            const [
                usersResponse, 
                loansResponse, 
                applicationsResponse, 
                completedLoansResponse,
                previousUsersResponse,
                previousLoansResponse,
                previousApplicationsResponse,
                previousCompletedLoansResponse
            ] = await Promise.all([
                // Current data
                fetch(`${backendUrl}/users?select=count`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': `${process.env.API_KEY || ''}`,
                        'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                        'Prefer': 'count=exact'
                    },
                }),
                fetch(`${backendUrl}/loans?select=*`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': `${process.env.API_KEY || ''}`,
                        'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                    },
                }),
                fetch(`${backendUrl}/loan_applications?select=count`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': `${process.env.API_KEY || ''}`,
                        'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                        'Prefer': 'count=exact'
                    },
                }),
                fetch(`${backendUrl}/loans?status=eq.completed&select=id`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': `${process.env.API_KEY || ''}`,
                        'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                        'Prefer': 'count=exact'
                    },
                }),
                // Previous month data for comparison
                fetch(`${backendUrl}/users?created_at=lte.${previousMonthEnd}&select=count`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': `${process.env.API_KEY || ''}`,
                        'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                        'Prefer': 'count=exact'
                    },
                }),
                fetch(`${backendUrl}/loans?created_at=lte.${previousMonthEnd}&select=*`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': `${process.env.API_KEY || ''}`,
                        'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                    },
                }),
                fetch(`${backendUrl}/loan_applications?created_at=lte.${previousMonthEnd}&select=count`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': `${process.env.API_KEY || ''}`,
                        'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                        'Prefer': 'count=exact'
                    },
                }),
                fetch(`${backendUrl}/loans?status=eq.completed&created_at=lte.${previousMonthEnd}&select=id`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': `${process.env.API_KEY || ''}`,
                        'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                        'Prefer': 'count=exact'
                    },
                })
            ]);

            // Parse current data
            const users = await usersResponse.json();
            const loans = await loansResponse.json();
            const applications = await applicationsResponse.json();
            const completedLoans = await completedLoansResponse.json();

            // Parse previous month data
            const previousUsers = await previousUsersResponse.json();
            const previousLoans = await previousLoansResponse.json();
            const previousApplications = await previousApplicationsResponse.json();
            const previousCompletedLoans = await previousCompletedLoansResponse.json();

            // Calculate current stats
            const currentStats = {
                totalLoans: loans.length,
                totalUsers: users[0]?.count || 0,
                loanApplications: applications[0]?.count || 0,
                completedLoans: completedLoans.length
            };

            // Calculate previous month stats
            const previousStats = {
                totalLoans: previousLoans.length,
                totalUsers: previousUsers[0]?.count || 0,
                loanApplications: previousApplications[0]?.count || 0,
                completedLoans: previousCompletedLoans.length
            };

            // Calculate monthly changes
            const monthlyChanges = {
                totalLoans: calculatePercentageChange(currentStats.totalLoans, previousStats.totalLoans),
                totalUsers: calculatePercentageChange(currentStats.totalUsers, previousStats.totalUsers),
                loanApplications: calculatePercentageChange(currentStats.loanApplications, previousStats.loanApplications),
                completedLoans: calculatePercentageChange(currentStats.completedLoans, previousStats.completedLoans)
            };

            console.log("Current stats:", currentStats);
            console.log("Previous stats:", previousStats);
            console.log("Monthly changes:", monthlyChanges);

            return NextResponse.json({
                success: true,
                data: {
                    stats: {
                        totalLoans: {
                            value: currentStats.totalLoans,
                            change: Math.round(monthlyChanges.totalLoans * 100) / 100, // Round to 2 decimal places
                            changeType: monthlyChanges.totalLoans > 0 ? 'positive' : monthlyChanges.totalLoans < 0 ? 'negative' : 'neutral'
                        },
                        totalUsers: {
                            value: currentStats.totalUsers,
                            change: Math.round(monthlyChanges.totalUsers * 100) / 100,
                            changeType: monthlyChanges.totalUsers > 0 ? 'positive' : monthlyChanges.totalUsers < 0 ? 'negative' : 'neutral'
                        },
                        loanApplications: {
                            value: currentStats.loanApplications,
                            change: Math.round(monthlyChanges.loanApplications * 100) / 100,
                            changeType: monthlyChanges.loanApplications > 0 ? 'positive' : monthlyChanges.loanApplications < 0 ? 'negative' : 'neutral'
                        },
                        completedLoans: {
                            value: currentStats.completedLoans,
                            change: Math.round(monthlyChanges.completedLoans * 100) / 100,
                            changeType: monthlyChanges.completedLoans > 0 ? 'positive' : monthlyChanges.completedLoans < 0 ? 'negative' : 'neutral'
                        }
                    }
                },
                message: 'Dashboard stats retrieved successfully'
            });

        } catch (backendError) {
            console.log("Backend API error, using fallback stats:", backendError);
        }

        // Fallback to mock stats
        return NextResponse.json({
            success: true,
            data: {
                stats: {
                    totalLoans: {
                        value: mockStats.totalLoans,
                        change: mockStats.monthlyChanges.totalLoans,
                        changeType: mockStats.monthlyChanges.totalLoans > 0 ? 'positive' : mockStats.monthlyChanges.totalLoans < 0 ? 'negative' : 'neutral'
                    },
                    totalUsers: {
                        value: mockStats.totalUsers,
                        change: mockStats.monthlyChanges.totalUsers,
                        changeType: mockStats.monthlyChanges.totalUsers > 0 ? 'positive' : mockStats.monthlyChanges.totalUsers < 0 ? 'negative' : 'neutral'
                    },
                    loanApplications: {
                        value: mockStats.loanApplications,
                        change: mockStats.monthlyChanges.loanApplications,
                        changeType: mockStats.monthlyChanges.loanApplications > 0 ? 'positive' : mockStats.monthlyChanges.loanApplications < 0 ? 'negative' : 'neutral'
                    },
                    completedLoans: {
                        value: mockStats.completedLoans,
                        change: mockStats.monthlyChanges.completedLoans,
                        changeType: mockStats.monthlyChanges.completedLoans > 0 ? 'positive' : mockStats.monthlyChanges.completedLoans < 0 ? 'negative' : 'neutral'
                    }
                }
            },
            message: 'Dashboard stats retrieved successfully (fallback)'
        });

    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                code: 'INTERNAL_ERROR'
            },
            { status: 500 }
        );
    }
}