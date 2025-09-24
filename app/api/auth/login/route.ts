import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Validation
        if (!email || !password) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Email and password are required',
                    code: 'MISSING_FIELDS'
                },
                { status: 400 }
            );
        }

        // Fetch staff from Supabase staff table
        const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
        
        try {
            console.log('Attempting staff login for:', { email });
            
            const response = await fetch(`${backendUrl}/staff?email=eq.${encodeURIComponent(email)}&password=eq.${encodeURIComponent(password)}&select=id,name,email,role`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': `${process.env.API_KEY || ''}`,
                    'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                },
            });

            if (response.ok) {
                const staff = await response.json();
                console.log('Staff found:', staff.length);
                
                if (staff && Array.isArray(staff) && staff.length > 0) {
                    const user = staff[0];
                    console.log('Staff data:', { id: user.id, email: user.email, role: user.role });
                    
                    // No need to verify password as it's already filtered by the API
                    // Check if user has staff privileges (admin, manager, or agent)
                    if (!['admin', 'manager', 'agent'].includes(user.role)) {
                        return NextResponse.json(
                            {
                                success: false,
                                error: 'Access denied. Staff privileges required.',
                                code: 'INSUFFICIENT_PRIVILEGES'
                            },
                            { status: 403 }
                        );
                    }

                    // Generate simple token (in production, use proper JWT)
                    const token = `auth_${user.id}_${Date.now()}`;

                    return NextResponse.json({
                        success: true,
                        data: {
                            user: {
                                id: user.id,
                                name: user.name,
                                email: user.email,
                                role: user.role
                            },
                            token
                        },
                        message: 'Login successful'
                    });
                } else {
                    return NextResponse.json(
                        {
                            success: false,
                            error: 'Invalid credentials. Staff not found or incorrect password.',
                            code: 'INVALID_CREDENTIALS'
                        },
                        { status: 401 }
                    );
                }
            } else {
                console.error('Supabase response error:', response.status);
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Authentication service error',
                        code: 'SERVICE_ERROR'
                    },
                    { status: 500 }
                );
            }
        } catch (apiError) {
            console.error('API error:', apiError);
            return NextResponse.json(
                {
                    success: false,
                    error: 'Authentication service unavailable',
                    code: 'SERVICE_UNAVAILABLE'
                },
                { status: 503 }
            );
        }

    } catch (error) {
        console.error('Login error:', error);
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