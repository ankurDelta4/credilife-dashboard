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
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid user ID',
                    code: 'INVALID_ID'
                },
                { status: 400 }
            );
        }

        // Try to update in Supabase first
        const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
        
        try {
            console.log(`Updating user ${id} with data:`, body);
            
            const backendResponse = await fetch(`${backendUrl}/users?id=eq.${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': `${process.env.API_KEY || ''}`,
                    'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                },
                body: JSON.stringify({
                    ...body,
                    updated_at: new Date().toISOString()
                })
            });

            console.log(`Backend response status: ${backendResponse.status}`);
            
            if (backendResponse.ok) {
                console.log('User updated successfully in backend');
                return NextResponse.json({
                    success: true,
                    message: 'User updated successfully'
                });
            } else {
                const errorData = await backendResponse.text();
                console.log('Backend error response:', errorData);
            }
        } catch (backendError) {
            console.log("Backend update error:", backendError);
        }

        // Fallback to local update if backend fails
        const userId = parseInt(id);
        if (!isNaN(userId)) {
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                users[userIndex] = { ...users[userIndex], ...body };
                return NextResponse.json({
                    success: true,
                    data: { user: users[userIndex] },
                    message: 'User updated successfully (fallback)'
                });
            }
        }

        return NextResponse.json(
            {
                success: false,
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            },
            { status: 404 }
        );

    } catch (error) {
        console.error('Error updating user:', error);
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
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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
