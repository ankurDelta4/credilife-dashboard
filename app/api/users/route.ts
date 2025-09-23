import { NextRequest, NextResponse } from 'next/server';

// Mock users database
let users = [
    {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone_number: '+1-555-0101',
        role: 'admin',
        status: 'active',
        createdAt: '2024-01-15T10:30:00Z'
    },
    {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone_number: '+1-555-0102',
        role: 'user',
        status: 'active',
        createdAt: '2024-01-16T14:20:00Z'
    },
    {
        id: 3,
        name: 'Bob Johnson',
        email: 'bob@example.com',
        phone_number: '+1-555-0103',
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
        // If backend doesn't return data, use mock data as fallback
        if (!backendData || (!Array.isArray(backendData) && backendData.length === 0)) {
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

        // Supabase returns an array directly
        const users = Array.isArray(backendData) ? backendData : [];
        
        return NextResponse.json({
            success: true,
            data: {
                users: users,
                pagination: {
                    page,
                    limit,
                    total: users.length,
                    totalPages: Math.ceil(users.length / limit)
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
        const { name, email, phone_number, role = 'user', status = 'active' } = body;

        // Validation
        console.log(body)
        if (!name || !email || !phone_number || !role) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Name, email, phone, and role are required',
                    code: 'MISSING_FIELDS'
                },
                { status: 400 }
            );
        }

        // Try to create user in Supabase first
        const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
        
        try {
            console.log('Creating user with data:', { name, email, phone_number, role, status });
            
            const backendResponse = await fetch(`${backendUrl}/users`, {
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
                    phone_number,
                    role,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
            });

            console.log(`Backend response status: ${backendResponse.status}`);
            
            if (backendResponse.ok) {
                const createdUser = await backendResponse.json();
                console.log('User created successfully in backend:', createdUser);
                return NextResponse.json({
                    success: true,
                    data: { user: Array.isArray(createdUser) ? createdUser[0] : createdUser },
                    message: 'User created successfully'
                }, { status: 201 });
            } else {
                const errorData = await backendResponse.text();
                console.log('Backend error response:', errorData);
                
                // Check if it's a duplicate email error
                if (backendResponse.status === 409 || errorData.includes('duplicate') || errorData.includes('unique')) {
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
        } catch (backendError) {
            console.log("Backend creation error:", backendError);
        }

        // Fallback to local creation if backend fails
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

        const newUser = {
            id: Math.max(...users.map(u => u.id)) + 1,
            name,
            email,
            phone_number,
            role,
            status,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);

        return NextResponse.json({
            success: true,
            data: { user: newUser },
            message: 'User created successfully (fallback)'
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating user:', error);
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
