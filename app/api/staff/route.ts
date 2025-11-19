import { NextRequest, NextResponse } from 'next/server';

// GET: Fetch all staff members
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role') || '';
        // Note: staff table doesn't have a status column, so we ignore status filter

        const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';

        // Build query with filters
        let query = `${backendUrl}/staff?select=*`;
        if (role && role !== 'all') {
            query += `&role=eq.${role}`;
        }

        console.log('[STAFF API] Fetching from query:', query);
        console.log('[STAFF API] Headers:', {
            'Content-Type': 'application/json',
            'apikey': process.env.API_KEY ? 'Present' : 'Missing',
        });

        const response = await fetch(query, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apikey': `${process.env.API_KEY || ''}`,
                'Authorization': `Bearer ${process.env.API_KEY || ''}`,
            },
        });

        console.log('[STAFF API] Response status:', response.status);
        console.log('[STAFF API] Response ok:', response.ok);

        if (response.ok) {
            const staffData = await response.json();
            console.log('[STAFF API] Staff data received:', JSON.stringify(staffData, null, 2));
            console.log('[STAFF API] Number of staff members:', staffData?.length || 0);

            return NextResponse.json({
                success: true,
                data: {
                    users: staffData
                },
                message: 'Staff retrieved successfully'
            });
        } else {
            const errorText = await response.text();
            console.error('[STAFF API] Error response:', errorText);
            console.error('[STAFF API] Response status:', response.status);

            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to fetch staff data',
                    code: 'FETCH_ERROR',
                    details: errorText,
                    status: response.status
                },
                { status: response.status }
            );
        }
    } catch (error) {
        console.error('Error fetching staff:', error);
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

// POST: Create new staff member
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, phone_number, role, password } = body;

        // Validation
        if (!name || !email || !phone_number || !role || !password) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Name, email, phone number, role, and password are required',
                    code: 'MISSING_FIELDS'
                },
                { status: 400 }
            );
        }

        const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
        
        console.log('Creating staff with data:', { name, email, phone_number, role });
        
        const response = await fetch(`${backendUrl}/staff`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': `${process.env.API_KEY || ''}`,
                'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                name,
                email,
                phone: phone_number, // Use 'phone' as per your curl example
                password,
                role
            })
        });

        if (response.ok) {
            const staffData = await response.json();
            return NextResponse.json({
                success: true,
                data: {
                    user: staffData[0]
                },
                message: 'Staff member created successfully'
            });
        } else {
            const errorData = await response.text();
            console.log('Backend error:', errorData);
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to create staff member',
                    code: 'CREATE_ERROR'
                },
                { status: response.status }
            );
        }
    } catch (error) {
        console.error('Error creating staff:', error);
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