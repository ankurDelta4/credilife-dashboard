import { NextRequest, NextResponse } from 'next/server';

// Mock loans database
let loans = [
    {
        id: 1,
        userId: 2,
        amount: 50000,
        purpose: 'Home',
        status: 'pending',
        interestRate: 3.5,
        termMonths: 360,
        monthlyPayment: 224.51,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
    },
    {
        id: 2,
        userId: 2,
        amount: 15000,
        purpose: 'Car Purchase',
        status: 'approved',
        interestRate: 4.2,
        termMonths: 60,
        monthlyPayment: 277.89,
        createdAt: '2024-01-16T14:20:00Z',
        updatedAt: '2024-01-17T09:15:00Z'
    },
    {
        id: 3,
        userId: 3,
        amount: 25000,
        purpose: 'Business Expansion',
        status: 'rejected',
        interestRate: 5.8,
        termMonths: 120,
        monthlyPayment: 275.12,
        createdAt: '2024-01-17T09:15:00Z',
        updatedAt: '2024-01-18T11:45:00Z'
    }
];

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        console.log(`API called with full URL: ${request.url}`);
        console.log(`All searchParams:`, Object.fromEntries(searchParams.entries()));
        
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const status = searchParams.get('status') || '';
        const userId = searchParams.get('userId') || '';
        const type = searchParams.get('type') || 'applications'; // New parameter to distinguish between loans and applications
        
        console.log(`API called with type: ${type}, from searchParams: ${searchParams.get('type')}`);

        // Fetch data from backend API
        const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
        const queryParams = new URLSearchParams();
        
        if (page) queryParams.append('page', page.toString());
        if (limit) queryParams.append('limit', limit.toString());
        if (status) queryParams.append('status', status);
        if (userId) queryParams.append('userId', userId);
        
        // Determine which table to fetch from based on type parameter
        let endpoint = '';
        let fallbackData: any[] = [];

        if (type === 'applications') {

            endpoint = `${backendUrl}/loan_applications?select=*,users(*)&order=created_at.desc`;
            fallbackData = [
                {
                    id: 1,
                    customerName: 'Frank Miller',
                    email: 'frank.miller@email.com',
                    amount: 40000,
                    purpose: 'Home Improvement',
                    status: 'pending',
                    submitDate: '2024-09-15T10:30:00Z',
                    creditScore: 680
                },
                {
                    id: 2,
                    customerName: 'Grace Lee',
                    email: 'grace.lee@email.com',
                    amount: 22000,
                    purpose: 'Debt Consolidation',
                    status: 'approved',
                    submitDate: '2024-09-10T14:20:00Z',
                    creditScore: 750
                }
            ];
        } else {
            endpoint = `${backendUrl}/loans?select=*,users(*)&order=created_at.desc`;
            fallbackData = loans;
        }
        
        try {
           

            const backendResponse = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': `${process.env.API_KEY || ''}`,
                    'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                },
            });

            const backendData = await backendResponse.json();
                console.log(`Backend Recent${type} data:`, backendData);
            if (backendResponse.ok) {
                // const backendData = await backendResponse.json();
                // console.log(`Backend Recent${type} data:`, backendData);
                
                if (backendData && Array.isArray(backendData) && backendData.length > 0) {
                    // Transform data to match frontend field names
                    let transformedData = backendData.map((item: any) => {
                        if (type === 'applications') {
                            return {
                                id: item.id,
                                customerName: item.user_data?.first_name && item.user_data?.last_name 
                                    ? `${item.user_data.first_name} ${item.user_data.last_name}`
                                    : item.users?.name || item.customer_name || 'N/A',
                                email: item.user_data?.email || item.users?.email || item.email || 'N/A',
                                amount: item.requested_amount || item.amount,
                                status: item.status,
                                tenure: item.tenure || 'N/A',
                                repaymentType: item.repayment_type || 'N/A',
                                submitDate: item.created_at || item.submit_date,
                                currentStage: item.current_stage || 'N/A',
                                interestAmount: item.interest_amount || 0,
                                principalAmount: item.principal_amount || item.requested_amount || 0,
                                closingFees: item.closing_fees || 0,
                                totalRepayment: item.total_repayment || 0,
                                loanPurpose: item.loan_purpose || 'N/A'
                            };
                        } else {
                            console.log("into else case")
                            return {
                                id: item.id,
                                userId: item.users?.name || item.customer_name || 'N/A',
                                amount: item.principal_amount,
                                status: item.status,
                                interestRate: item.interest_amount || 'N/A',
                                termMonths: item.tenure || 'N/A',
                                repaymentType: item.repayment_type || 'N/A',
                                createdAt: item.created_at || 'N/A',
                                updatedAt: item.updated_at || 'N/A',
                                endDate: item.end_date || 'N/A',
                            };
                        }
                    });
                    
                    // Apply filters to transformed data
                    let filteredData = transformedData;
                    
                    if (status) {
                        filteredData = filteredData.filter((item: any) => item.status === status);
                    }
                    
                    if (userId) {
                        const userIdNum = parseInt(userId);
                        if (!isNaN(userIdNum)) {
                            filteredData = filteredData.filter((item: any) => item.userId === userIdNum);
                        }
                    }

                    // Apply pagination
                    const startIndex = (page - 1) * limit;
                    const endIndex = startIndex + limit;
                    const paginatedData = filteredData.slice(startIndex, endIndex);

                    const responseKey = type === 'applications' ? 'applications' : 'loans';
                    const responseMessage = type === 'applications' ? 'Loan applications retrieved successfully' : 'Loans retrieved successfully';

                    return NextResponse.json({
                        success: true,
                        data: {
                            [responseKey]: paginatedData,
                            pagination: {
                                page,
                                limit,
                                total: filteredData.length,
                                totalPages: Math.ceil(filteredData.length / limit)
                            }
                        },
                        message: responseMessage
                    });
                }
            }
        } catch (backendError) {
            console.log("Backend API error, using fallback data:", backendError);
        }

        // Fallback to mock data
        let filteredData = fallbackData;

        if (status) {
            filteredData = filteredData.filter((item: any) => item.status === status);
        }

        if (userId) {
            const userIdNum = parseInt(userId);
            if (!isNaN(userIdNum)) {
                filteredData = filteredData.filter((item: any) => item.userId === userIdNum);
            }
        }

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        const responseKey = type === 'applications' ? 'applications' : 'loans';
        const responseMessage = type === 'applications' ? 'Loan applications retrieved successfully (fallback)' : 'Loans retrieved successfully (fallback)';

        return NextResponse.json({
            success: true,
            data: {
                [responseKey]: paginatedData,
                pagination: {
                    page,
                    limit,
                    total: filteredData.length,
                    totalPages: Math.ceil(filteredData.length / limit)
                }
            },
            message: responseMessage
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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, amount, purpose, termMonths } = body;

        // Validation
        if (!userId || !amount || !purpose || !termMonths) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'All fields are required',
                    code: 'MISSING_FIELDS'
                },
                { status: 400 }
            );
        }

        if (amount <= 0 || termMonths <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Amount and term must be positive numbers',
                    code: 'INVALID_VALUES'
                },
                { status: 400 }
            );
        }

        // Calculate interest rate based on amount and term (simplified logic)
        let interestRate = 3.5; // Base rate
        if (amount > 100000) interestRate += 0.5;
        if (termMonths > 180) interestRate += 0.3;

        // Calculate monthly payment
        const monthlyRate = interestRate / 100 / 12;
        const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
            (Math.pow(1 + monthlyRate, termMonths) - 1);

        // Create new loan
        const newLoan = {
            id: Math.max(...loans.map(l => l.id)) + 1,
            userId: parseInt(userId),
            amount: parseFloat(amount),
            purpose,
            status: 'pending',
            interestRate,
            termMonths: parseInt(termMonths),
            monthlyPayment: Math.round(monthlyPayment * 100) / 100,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        loans.push(newLoan);

        return NextResponse.json({
            success: true,
            data: { loan: newLoan },
            message: 'Loan application submitted successfully'
        }, { status: 201 });

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
