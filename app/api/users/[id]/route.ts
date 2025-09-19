import { NextRequest, NextResponse } from 'next/server';

// Mock users database (same as in route.ts - in real app, use a shared database)
let users = [
    {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
        status: 'active',
        createdAt: '2024-01-15T10:30:00Z'
    },
    {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'user',
        status: 'active',
        createdAt: '2024-01-16T14:20:00Z'
    },
    {
        id: 3,
        name: 'Bob Johnson',
        email: 'bob@example.com',
        role: 'user',
        status: 'inactive',
        createdAt: '2024-01-17T09:15:00Z'
    }
];

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const userId = parseInt(id);

        if (isNaN(userId)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid user ID',
                    code: 'INVALID_ID'
                },
                { status: 400 }
            );
        }

        const user = users.find(u => u.id === userId);

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
            data: { user },
            message: 'User retrieved successfully'
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

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const userId = parseInt(id);
        const body = await request.json();

        if (isNaN(userId)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid user ID',
                    code: 'INVALID_ID'
                },
                { status: 400 }
            );
        }

        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'User not found',
                    code: 'USER_NOT_FOUND'
                },
                { status: 404 }
            );
        }

        // Check if email is being changed and if it already exists
        if (body.email && body.email !== users[userIndex].email) {
            const existingUser = users.find(u => u.email === body.email && u.id !== userId);
            if (existingUser) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Email already exists',
                        code: 'EMAIL_EXISTS'
                    },
                    { status: 409 }
                );
            }
        }

        // Update user
        const updatedUser = {
            ...users[userIndex],
            ...body,
            id: userId, // Ensure ID doesn't change
            createdAt: users[userIndex].createdAt // Preserve creation date
        };

        users[userIndex] = updatedUser;

        return NextResponse.json({
            success: true,
            data: { user: updatedUser },
            message: 'User updated successfully'
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

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const userId = parseInt(id);

        if (isNaN(userId)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid user ID',
                    code: 'INVALID_ID'
                },
                { status: 400 }
            );
        }

        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'User not found',
                    code: 'USER_NOT_FOUND'
                },
                { status: 404 }
            );
        }

        // Remove user
        const deletedUser = users.splice(userIndex, 1)[0];

        return NextResponse.json({
            success: true,
            data: { user: deletedUser },
            message: 'User deleted successfully'
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
