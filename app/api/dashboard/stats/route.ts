import { NextRequest, NextResponse } from 'next/server';

// Mock data for fallback
const mockStats = {
    totalLoans: 345000,
    totalUsers: 156,
    loanApplications: 24,
    completedLoans: 89,
    monthlyChanges: {
        totalLoans: 12.5,
        totalUsers: 8.2,
        loanApplications: -4.1,
        completedLoans: 15.3
    }
};

export async function GET(request: NextRequest) {
    try {
        // Fetch dashboard stats from backend API
        const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
        
        try {
            // Try to fetch real stats from multiple tables

            // const loan_Data = await fetch(`${backendUrl}/users?select=count`, {
            //     method: 'GET',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'apikey': `${process.env.API_KEY || ''}`,
            //         'Authorization': `Bearer ${process.env.API_KEY || ''}`,
            //         'Prefer': 'count=exact'
            //     },
            // });
            // const res = await loan_Data.json();
            // console.log("Loan data", res);

            const [usersResponse, loansResponse, applicationsResponse, completedLoansResponse] = await Promise.all([
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
                        'Prefer': 'count=exact'
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
                })
            ]);

            // let stats = { ...dashboardStats };
            const users = await usersResponse.json();
            const loans = await loansResponse.json();
            const applications = await applicationsResponse.json();
            const completedLoans = await completedLoansResponse.json();
            console.log("Final data;;;", users[0].count, loans.length, applications[0].count, completedLoans.length)

            const dashboardStats = {
                totalLoans: loans.length,
                totalUsers: users[0].count,
                loanApplications: applications[0].count,
                completedLoans: completedLoans.length,
                monthlyChanges: {
                    totalLoans: 12.5,
                    totalUsers: 8.2,
                    loanApplications: -4.1,
                    completedLoans: 15.3
                }
            };
            let stats = { ...dashboardStats };

            // Get user count
            if (usersResponse.ok) {
                const userCount = usersResponse.headers.get('Content-Range');
                if (userCount) {
                    const count = parseInt(userCount.split('/')[1] || '0');
                    stats.totalUsers = count;
                    
                }
            }

            // Get loans data
            if (loansResponse.ok) {
                const loansData = loans;
                if (Array.isArray(loansData)) {
                    stats.totalLoans = loansData.reduce((sum: number, loan: any) => {
                        return sum + (loan.amount || loan.loanAmount || 0);
                    }, 0);
                    stats.completedLoans = loansData.filter((loan: any) => loan.status === 'completed').length;
                }
            }

            // Get applications count
            if (applicationsResponse.ok) {
                const appCount = applications[0].count;
                if (appCount) {
                    stats.loanApplications = appCount;
                }
            }
            stats.totalLoans = loans.length;
            console.log("Dashboard stats from backend:", stats);

            return NextResponse.json({
                success: true,
                data: {
                    stats: {
                        totalLoans: {
                            value: stats.totalLoans,
                            change: stats.monthlyChanges.totalLoans,
                            changeType: stats.monthlyChanges.totalLoans > 0 ? 'positive' : 'negative'
                        },
                        totalUsers: {
                            value: stats.totalUsers,
                            change: stats.monthlyChanges.totalUsers,
                            changeType: stats.monthlyChanges.totalUsers > 0 ? 'positive' : 'negative'
                        },
                        loanApplications: {
                            value: stats.loanApplications,
                            change: stats.monthlyChanges.loanApplications,
                            changeType: stats.monthlyChanges.loanApplications > 0 ? 'positive' : 'negative'
                        },
                        completedLoans: {
                            value: stats.completedLoans,
                            change: stats.monthlyChanges.completedLoans,
                            changeType: stats.monthlyChanges.completedLoans > 0 ? 'positive' : 'negative'
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
                        changeType: mockStats.monthlyChanges.totalLoans > 0 ? 'positive' : 'negative'
                    },
                    totalUsers: {
                        value: mockStats.totalUsers,
                        change: mockStats.monthlyChanges.totalUsers,
                        changeType: mockStats.monthlyChanges.totalUsers > 0 ? 'positive' : 'negative'
                    },
                    loanApplications: {
                        value: mockStats.loanApplications,
                        change: mockStats.monthlyChanges.loanApplications,
                        changeType: mockStats.monthlyChanges.loanApplications > 0 ? 'positive' : 'negative'
                    },
                    completedLoans: {
                        value: mockStats.completedLoans,
                        change: mockStats.monthlyChanges.completedLoans,
                        changeType: mockStats.monthlyChanges.completedLoans > 0 ? 'positive' : 'negative'
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