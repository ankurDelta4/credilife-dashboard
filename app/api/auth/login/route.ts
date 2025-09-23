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

        // Fetch user from Supabase
        const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
        
        try {
            console.log('Attempting login for:', { email });
            
            const response = await fetch(`${backendUrl}/users?email=eq.${encodeURIComponent(email)}&select=*`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': `${process.env.API_KEY || ''}`,
                    'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                },
            });

            if (response.ok) {
                const users = await response.json();
                console.log('Users found:', users.length);
                
                if (users && Array.isArray(users) && users.length > 0) {
                    const user = users[0];
                    console.log('User data:', { id: user.id, email: user.email, role: user.role });
                    
                    // Verify password
                    if (user.password !== password) {
                        return NextResponse.json(
                            {
                                success: false,
                                error: 'Invalid credentials. Incorrect password.',
                                code: 'INVALID_PASSWORD'
                            },
                            { status: 401 }
                        );
                    }
                    
                    // Check if user has admin role
                    if (user.role !== 'admin') {
                        return NextResponse.json(
                            {
                                success: false,
                                error: 'Access denied. Admin privileges required.',
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
                                phone_number: user.phone_number,
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
                            error: 'Invalid credentials. User not found with provided email.',
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