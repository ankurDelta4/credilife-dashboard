import { NextRequest, NextResponse } from 'next/server';

// Mock user database (in real app, use a proper database)
const users = [
    { id: 1, email: 'admin@example.com', password: 'admin123', role: 'admin' },
    { id: 2, email: 'user@example.com', password: 'user123', role: 'user' },
];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, action } = body;

        if (!email || !password) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Email and password are required',
                    code: 'MISSING_CREDENTIALS'
                },
                { status: 400 }
            );
        }

        if (action === 'login') {
            // Login logic
            const user = users.find(u => u.email === email && u.password === password);

            if (!user) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Invalid credentials',
                        code: 'INVALID_CREDENTIALS'
                    },
                    { status: 401 }
                );
            }

            // In a real app, generate a JWT token here
            const token = `mock-jwt-token-${user.id}`;

            return NextResponse.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role
                    },
                    token
                },
                message: 'Login successful'
            });
        }

        if (action === 'register') {
            // Check if user already exists
            const existingUser = users.find(u => u.email === email);

            if (existingUser) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'User already exists',
                        code: 'USER_EXISTS'
                    },
                    { status: 409 }
                );
            }

            // Create new user
            const newUser = {
                id: users.length + 1,
                email,
                password,
                role: 'user'
            };

            users.push(newUser);

            return NextResponse.json({
                success: true,
                data: {
                    user: {
                        id: newUser.id,
                        email: newUser.email,
                        role: newUser.role
                    }
                },
                message: 'Registration successful'
            });
        }

        return NextResponse.json(
            {
                success: false,
                error: 'Invalid action. Use "login" or "register"',
                code: 'INVALID_ACTION'
            },
            { status: 400 }
        );

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

export async function GET(request: NextRequest) {
    // Get current user info (requires authentication)
    const token = request.headers.get('authorization');

    if (!token) {
        return NextResponse.json(
            {
                success: false,
                error: 'Unauthorized',
                code: 'UNAUTHORIZED'
            },
            { status: 401 }
        );
    }

    // In a real app, verify the JWT token here
    const userId = token.replace('mock-jwt-token-', '');
    const user = users.find(u => u.id.toString() === userId);

    if (!user) {
        return NextResponse.json(
            {
                success: false,
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            },
            { status: 404 }
        );
    }

    return NextResponse.json({
        success: true,
        data: {
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        },
        message: 'User info retrieved successfully'
    });
}
