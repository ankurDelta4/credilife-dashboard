import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { 
            user_id,
            requested_amount,
            loan_purpose,
            status = 'pending',
            current_stage = 'application_submitted',
            is_renewal = false,
            interest_amount = 0,
            principal_amount,
            closing_fees = 0,
            total_repayment,
            user_data,
            tenure,
            repayment_type = 'monthly',
            id_number,
            questions_count = 0
        } = body;

        // Validation
        console.log('Received loan application data:', body);
        if (!user_id || !requested_amount || !tenure || !user_data) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Required fields: user_id, requested_amount, tenure, user_data',
                    code: 'MISSING_FIELDS'
                },
                { status: 400 }
            );
        }

        // Validate user_data structure
        if (!user_data.first_name || !user_data.last_name || !user_data.whatsapp_number || !user_data.email) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'User data must include: first_name, last_name, phone, email',
                    code: 'MISSING_USER_DATA'
                },
                { status: 400 }
            );
        }

        const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
        const headers = {
            'Content-Type': 'application/json',
            'apikey': `${process.env.API_KEY || ''}`,
            'Authorization': `Bearer ${process.env.API_KEY || ''}`,
            'Prefer': 'return=representation'
        };

        const loanApplicationData = {
            user_id,
            requested_amount: parseFloat(requested_amount),
            loan_purpose,
            status,
            current_stage,
            is_renewal,
            interest_amount: parseFloat(interest_amount),
            principal_amount: parseFloat(principal_amount) || parseFloat(requested_amount),
            closing_fees: parseFloat(closing_fees),
            total_repayment: parseFloat(total_repayment) || parseFloat(requested_amount),
            user_data: JSON.stringify(user_data),
            tenure: parseInt(tenure),
            repayment_type,
            id_number: id_number ? parseInt(id_number) : null,
            questions_count: 30,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        console.log('Creating loan application with data:', loanApplicationData);

        const response = await fetch(`${backendUrl}/loan_applications`, {
            method: 'POST',
            headers,
            body: JSON.stringify(loanApplicationData)
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.log('Backend error:', errorData);
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to create loan application',
                    details: errorData,
                    code: 'BACKEND_ERROR'
                },
                { status: response.status }
            );
        }

        const createdApplication = await response.json();
        console.log('Loan application created successfully:', createdApplication);

        return NextResponse.json({
            success: true,
            data: {
                application: Array.isArray(createdApplication) ? createdApplication[0] : createdApplication
            },
            message: 'Loan application created successfully'
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating loan application:', error);
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

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const status = searchParams.get('status') || '';
        const userId = searchParams.get('userId') || '';

        const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
        const headers = {
            'Content-Type': 'application/json',
            'apikey': `${process.env.API_KEY || ''}`,
            'Authorization': `Bearer ${process.env.API_KEY || ''}`,
        };

        let queryParams = new URLSearchParams();
        if (status) queryParams.append('status', `eq.${status}`);
        if (userId) queryParams.append('user_id', `eq.${userId}`);
        queryParams.append('select', '*');
        queryParams.append('order', 'created_at.desc');

        const response = await fetch(`${backendUrl}/loan_applications?${queryParams.toString()}`, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            throw new Error(`Backend API error: ${response.status}`);
        }

        const applications = await response.json();
        
        // Apply pagination if needed
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedApplications = applications.slice(startIndex, endIndex);

        return NextResponse.json({
            success: true,
            data: {
                applications: paginatedApplications,
                pagination: {
                    page,
                    limit,
                    total: applications.length,
                    totalPages: Math.ceil(applications.length / limit)
                }
            },
            message: 'Loan applications retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching loan applications:', error);
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