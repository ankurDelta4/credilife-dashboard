import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'No valid authorization header',
                    code: 'NO_AUTH_HEADER'
                },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        // Simple token validation (in production, use proper JWT verification)
        if (!token || !token.startsWith('auth_')) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid token format',
                    code: 'INVALID_TOKEN'
                },
                { status: 401 }
            );
        }

        // Extract user ID from token
        const tokenParts = token.split('_');
        if (tokenParts.length < 3) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Malformed token',
                    code: 'MALFORMED_TOKEN'
                },
                { status: 401 }
            );
        }

        const userId = tokenParts[1];
        
        // Verify user still exists and has admin role
        const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
        
        try {
            const response = await fetch(`${backendUrl}/users?id=eq.${userId}&role=eq.admin&select=id,name,email,phone_number,role`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': `${process.env.API_KEY || ''}`,
                    'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                },
            });

            if (response.ok) {
                const users = await response.json();
                
                if (users && Array.isArray(users) && users.length > 0) {
                    return NextResponse.json({
                        success: true,
                        data: {
                            user: users[0],
                            valid: true
                        },
                        message: 'Token is valid'
                    });
                } else {
                    return NextResponse.json(
                        {
                            success: false,
                            error: 'User not found or no longer has admin privileges',
                            code: 'USER_NOT_FOUND'
                        },
                        { status: 401 }
                    );
                }
            } else {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Unable to verify user',
                        code: 'VERIFICATION_ERROR'
                    },
                    { status: 500 }
                );
            }
        } catch (apiError) {
            console.error('Verification API error:', apiError);
            return NextResponse.json(
                {
                    success: false,
                    error: 'Verification service unavailable',
                    code: 'SERVICE_UNAVAILABLE'
                },
                { status: 503 }
            );
        }

    } catch (error) {
        console.error('Token verification error:', error);
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