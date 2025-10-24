import { NextRequest, NextResponse } from 'next/server';
import { generateSequentialUniqueId, generateShortUniqueId } from '@/lib/utils/unique-id';

// Mock users database
let users = [
    {
        id: 1,
        unique_id: 'USR-2024-000001',
        name: 'John Doe',
        email: 'john@example.com',
        phone_number: '+1-555-0101',
        role: 'admin',
        status: 'active',
        createdAt: '2024-01-15T10:30:00Z'
    },
    {
        id: 2,
        unique_id: 'USR-2024-000002',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone_number: '+1-555-0102',
        role: 'user',
        status: 'active',
        createdAt: '2024-01-16T14:20:00Z'
    },
    {
        id: 3,
        unique_id: 'USR-2024-000003',
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

        // First, fetch users
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

        let backendData = await backendResponse.json();
        
        // Then, for each user, fetch their loan count
        const usersWithLoanCounts = await Promise.all(
            backendData.map(async (user: any) => {
                try {
                    const loansResponse = await fetch(`${backendUrl}/loans?user_id=eq.${user.id}&select=id`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey':`${process.env.API_KEY || ''}`,
                            'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                        },
                    });
                    
                    if (loansResponse.ok) {
                        const loans = await loansResponse.json();
                        return {
                            ...user,
                            totalLoans: Array.isArray(loans) ? loans.length : 0,
                        };
                    } else {
                        return {
                            ...user,
                            totalLoans: 0,
                        };
                    }
                } catch (error) {
                    console.log(`Error fetching loans for user ${user.id}:`, error);
                    return {
                        ...user,
                        totalLoans: 0,
                    };
                }
            })
        );
        
        backendData = usersWithLoanCounts;

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
        const backendUsers = Array.isArray(backendData) ? backendData : [];
        
        return NextResponse.json({
            success: true,
            data: {
                users: backendUsers,
                pagination: {
                    page,
                    limit,
                    total: backendUsers.length,
                    totalPages: Math.ceil(backendUsers.length / limit)
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
        
        // Generate unique ID for the new user
        // First, get the last user to determine the sequence
        let uniqueId = '';
        try {
            const lastUserResponse = await fetch(`${backendUrl}/users?select=unique_id&order=created_at.desc&limit=1`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': `${process.env.API_KEY || ''}`,
                    'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                },
            });
            
            if (lastUserResponse.ok) {
                const lastUsers = await lastUserResponse.json();
                const lastUniqueId = lastUsers[0]?.unique_id || null;
                uniqueId = generateSequentialUniqueId(lastUniqueId, 'USR');
            } else {
                // Fallback to short unique ID if can't get last ID
                uniqueId = `USR-${generateShortUniqueId()}`;
            }
        } catch {
            // Fallback to short unique ID
            uniqueId = `USR-${generateShortUniqueId()}`;
        }
        
        try {
            console.log('Creating user with data:', { name, email, phone_number, role, status, unique_id: uniqueId });
            
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
                    unique_id: uniqueId,
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

        // Generate unique ID for fallback user
        const lastMockUser = users.sort((a, b) => b.id - a.id)[0];
        const fallbackUniqueId = generateSequentialUniqueId(lastMockUser?.unique_id || null, 'USR');
        
        const newUser = {
            id: Math.max(...users.map(u => u.id)) + 1,
            unique_id: fallbackUniqueId,
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
