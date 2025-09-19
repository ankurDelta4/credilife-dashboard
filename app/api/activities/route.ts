import { NextRequest, NextResponse } from 'next/server';

// Mock activities database
let activities = [
    {
        id: 1,
        type: 'payment_received',
        description: 'Payment received from Alice Johnson',
        timestamp: '2024-09-19T10:30:00Z',
        amount: 1512,
        userId: 'C001'
    },
    {
        id: 2,
        type: 'application_submitted',
        description: 'New loan application from Frank Miller',
        timestamp: '2024-09-19T09:15:00Z',
        amount: 40000,
        userId: 'A001'
    },
    {
        id: 3,
        type: 'loan_approved',
        description: 'Loan approved for Grace Lee',
        timestamp: '2024-09-18T16:45:00Z',
        amount: 22000,
        userId: 'A002'
    },
    {
        id: 4,
        type: 'loan_overdue',
        description: 'Bob Smith\'s payment is overdue',
        timestamp: '2024-09-18T14:20:00Z',
        amount: 1108,
        userId: 'C002'
    },
    {
        id: 5,
        type: 'payment_received',
        description: 'Payment received from Carol Davis',
        timestamp: '2024-09-18T11:30:00Z',
        amount: 1407,
        userId: 'C003'
    },
    {
        id: 6,
        type: 'application_submitted',
        description: 'New loan application from Henry Clark',
        timestamp: '2024-09-17T15:20:00Z',
        amount: 60000,
        userId: 'A003'
    },
    {
        id: 7,
        type: 'loan_approved',
        description: 'Loan approved for David Wilson',
        timestamp: '2024-09-17T13:10:00Z',
        amount: 30000,
        userId: 'L004'
    },
    {
        id: 8,
        type: 'payment_received',
        description: 'Payment received from Eva Brown',
        timestamp: '2024-09-16T16:45:00Z',
        amount: 1283,
        userId: 'C005'
    }
];

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const type = searchParams.get('type') || '';

        // Fetch activities from backend API
        const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
        const queryParams = new URLSearchParams();
        
        if (page) queryParams.append('page', page.toString());
        if (limit) queryParams.append('limit', limit.toString());
        if (type) queryParams.append('type', type);

        try {
            const backendResponse = await fetch(`${backendUrl}/activities?select=*&order=timestamp.desc`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': `${process.env.API_KEY || ''}`,
                    'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                },
            });

            if (backendResponse.ok) {
                const backendData = await backendResponse.json();
                console.log("Backend activities data", backendData);
                
                if (backendData && Array.isArray(backendData) && backendData.length > 0) {
                    return NextResponse.json({
                        success: true,
                        data: {
                            activities: backendData,
                            pagination: {
                                page,
                                limit,
                                total: backendData.length,
                                totalPages: Math.ceil(backendData.length / limit)
                            }
                        },
                        message: 'Activities retrieved successfully'
                    });
                }
            }
        } catch (backendError) {
            console.log("Backend API error, using fallback data:", backendError);
        }

        // Fallback to mock data
        let filteredActivities = activities;

        if (type) {
            filteredActivities = filteredActivities.filter(activity => activity.type === type);
        }

        // Sort by timestamp descending (most recent first)
        filteredActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedActivities = filteredActivities.slice(startIndex, endIndex);

        return NextResponse.json({
            success: true,
            data: {
                activities: paginatedActivities,
                pagination: {
                    page,
                    limit,
                    total: filteredActivities.length,
                    totalPages: Math.ceil(filteredActivities.length / limit)
                }
            },
            message: 'Activities retrieved successfully (fallback)'
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
        const { type, description, amount, userId } = body;

        // Validation
        if (!type || !description) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Type and description are required',
                    code: 'MISSING_FIELDS'
                },
                { status: 400 }
            );
        }

        // Validate activity type
        const validTypes = ['payment_received', 'application_submitted', 'loan_approved', 'loan_overdue'];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Invalid activity type. Must be one of: ${validTypes.join(', ')}`,
                    code: 'INVALID_TYPE'
                },
                { status: 400 }
            );
        }

        // Create new activity
        const newActivity = {
            id: Math.max(...activities.map(a => a.id)) + 1,
            type,
            description,
            timestamp: new Date().toISOString(),
            amount: amount || null,
            userId: userId || null
        };

        activities.unshift(newActivity); // Add to beginning (most recent first)

        return NextResponse.json({
            success: true,
            data: { activity: newActivity },
            message: 'Activity created successfully'
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