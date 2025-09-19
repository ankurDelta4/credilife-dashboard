import { NextRequest, NextResponse } from 'next/server';

// Mock system users database
let systemUsers = [
    {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@loanflow.com',
        role: 'admin',
        department: 'IT',
        status: 'active',
        lastLogin: '2024-09-19T10:30:00Z',
        createdAt: '2024-01-15T10:30:00Z'
    },
    {
        id: 2,
        name: 'Jane Smith',
        email: 'jane.smith@loanflow.com',
        role: 'manager',
        department: 'Loans',
        status: 'active',
        lastLogin: '2024-09-19T09:15:00Z',
        createdAt: '2024-02-20T14:20:00Z'
    },
    {
        id: 3,
        name: 'Mike Johnson',
        email: 'mike.johnson@loanflow.com',
        role: 'agent',
        department: 'Customer Service',
        status: 'inactive',
        lastLogin: '2024-09-15T16:45:00Z',
        createdAt: '2024-03-10T09:15:00Z'
    },
    {
        id: 4,
        name: 'Sarah Wilson',
        email: 'sarah.wilson@loanflow.com',
        role: 'viewer',
        department: 'Compliance',
        status: 'active',
        lastLogin: '2024-09-18T14:20:00Z',
        createdAt: '2024-04-05T11:30:00Z'
    }
];

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role') || '';
        const status = searchParams.get('status') || '';

        // Fetch system users from backend API
        const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
        const queryParams = new URLSearchParams();
        
        if (page) queryParams.append('page', page.toString());
        if (limit) queryParams.append('limit', limit.toString());
        if (search) queryParams.append('search', search);
        if (role && role !== 'all') queryParams.append('role', role);
        if (status && status !== 'all') queryParams.append('status', status);

        try {
            const backendResponse = await fetch(`${backendUrl}/system_users?select=*`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': `${process.env.API_KEY || ''}`,
                    'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                },
            });

            if (backendResponse.ok) {
                const backendData = await backendResponse.json();
                console.log("Backend system users data", backendData);
                
                if (backendData && Array.isArray(backendData) && backendData.length > 0) {
                    return NextResponse.json({
                        success: true,
                        data: {
                            users: backendData,
                            pagination: {
                                page,
                                limit,
                                total: backendData.length,
                                totalPages: Math.ceil(backendData.length / limit)
                            }
                        },
                        message: 'System users retrieved successfully'
                    });
                }
            }
        } catch (backendError) {
            console.log("Backend API error, using fallback data:", backendError);
        }

        // Fallback to mock data
        let filteredUsers = systemUsers;

        if (search) {
            filteredUsers = filteredUsers.filter(user =>
                user.name.toLowerCase().includes(search.toLowerCase()) ||
                user.email.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (role && role !== 'all') {
            filteredUsers = filteredUsers.filter(user => user.role === role);
        }

        if (status && status !== 'all') {
            filteredUsers = filteredUsers.filter(user => user.status === status);
        }

        // Pagination
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
            message: 'System users retrieved successfully (fallback)'
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
        const { name, email, role = 'viewer', department, status = 'active' } = body;

        // Validation
        if (!name || !email || !department) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Name, email and department are required',
                    code: 'MISSING_FIELDS'
                },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingUser = systemUsers.find(u => u.email === email);
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

        // Create new system user
        const newUser = {
            id: Math.max(...systemUsers.map(u => u.id)) + 1,
            name,
            email,
            role,
            department,
            status,
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        systemUsers.push(newUser);

        return NextResponse.json({
            success: true,
            data: { user: newUser },
            message: 'System user created successfully'
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