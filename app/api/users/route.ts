import { NextRequest, NextResponse } from 'next/server';

// Mock users database
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

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';

        // Fetch users from backend API
        const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
        const queryParams = new URLSearchParams();
        
        if (page) queryParams.append('page', page.toString());
        if (limit) queryParams.append('limit', limit.toString());
        if (search) queryParams.append('search', search);
        if (status) queryParams.append('status', status);

        const backendResponse = await fetch(`${backendUrl}/users?select=*`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apikey':`${process.env.API_KEY || ''}`,
                'Authorization': `Bearer ${process.env.API_KEY || ''}`,
            },
        });

        if (!backendResponse.ok) {
            throw new Error(`Backend API error: ${backendResponse.status}`);
        }

        const backendData = await backendResponse.json();
        console.log("Backend data", backendData)
        // If backend doesn't return paginated data, use mock data as fallback
        if (!backendData || backendData.length === 0) {
            // Fallback to mock data
            let filteredUsers = users;

            if (search) {
                filteredUsers = filteredUsers.filter(user =>
                    user.name.toLowerCase().includes(search.toLowerCase()) ||
                    user.email.toLowerCase().includes(search.toLowerCase())
                );
            }

            if (status) {
                filteredUsers = filteredUsers.filter(user => user.status === status);
            }

            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

            return NextResponse.json({
                success: true,
                data: {
                    users: paginatedUsers,
                    pagination: {
                        page,
                        limit,
                        total: filteredUsers.length,
                        totalPages: Math.ceil(filteredUsers.length / limit)
                    }
                },
                message: 'Users retrieved successfully (fallback)'
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                users: backendData.users || backendData.data?.users || backendData,
                pagination: backendData.pagination || {
                    page,
                    limit,
                    total: backendData.total || backendData.users?.length || 0,
                    totalPages: Math.ceil((backendData.total || backendData.users?.length || 0) / limit)
                }
            },
            message: 'Users retrieved successfully'
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
        const { name, email, role = 'user', status = 'active' } = body;

        // Validation
        if (!name || !email) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Name and email are required',
                    code: 'MISSING_FIELDS'
                },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingUser = users.find(u => u.email === email);
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

        // Create new user
        const newUser = {
            id: Math.max(...users.map(u => u.id)) + 1,
            name,
            email,
            role,
            status,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);

        return NextResponse.json({
            success: true,
            data: { user: newUser },
            message: 'User created successfully'
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
