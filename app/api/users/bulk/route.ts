import { NextRequest, NextResponse } from 'next/server';
import { generateSequentialUniqueId } from '@/lib/utils/unique-id';

// Mock users database (same as main route)
let users = [
    {
        id: 1,
        unique_id: 'USR-2024-000001',
        name: 'John Doe',
        email: 'john@example.com',
        phone_number: '+1-555-0101',
        role: 'admin',
        createdAt: '2024-01-15T10:30:00Z'
    },
    {
        id: 2,
        unique_id: 'USR-2024-000002',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone_number: '+1-555-0102',
        role: 'user',
        createdAt: '2024-01-16T14:20:00Z'
    },
    {
        id: 3,
        unique_id: 'USR-2024-000003',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        phone_number: '+1-555-0103',
        role: 'user',
        createdAt: '2024-01-17T09:15:00Z'
    }
];

interface BulkUser {
    name: string;
    email: string;
    phone_number: string;
    role: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { users: bulkUsers } = body;

        // Validation
        if (!bulkUsers || !Array.isArray(bulkUsers) || bulkUsers.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Users array is required',
                    code: 'MISSING_USERS'
                },
                { status: 400 }
            );
        }

        // Validate each user
        for (const user of bulkUsers) {
            if (!user.name || !user.email || !user.phone_number) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Each user must have name, email, and phone_number',
                        code: 'MISSING_FIELDS'
                    },
                    { status: 400 }
                );
            }
        }

        // Try to create users in Supabase first
        const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
        
        // Get the last unique ID to continue the sequence
        let lastUniqueId = null;
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
                lastUniqueId = lastUsers[0]?.unique_id || null;
            }
        } catch {
            // Continue without last ID
        }
        
        // Prepare users for bulk creation with unique IDs
        const usersToCreate: any[] = [];
        let currentUniqueId = lastUniqueId;
        
        for (const user of bulkUsers) {
            // Generate sequential unique ID for each user
            currentUniqueId = generateSequentialUniqueId(currentUniqueId, 'USR');
            
            usersToCreate.push({
                name: user.name.trim(),
                email: user.email.trim().toLowerCase(),
                phone_number: user.phone_number,
                role: user.role || 'user',
                unique_id: currentUniqueId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        }

        try {
            console.log('Creating bulk users with data:', usersToCreate);
            
            const backendResponse = await fetch(`${backendUrl}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': `${process.env.API_KEY || ''}`,
                    'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(usersToCreate)
            });

            console.log(`Backend response status: ${backendResponse.status}`);
            
            if (backendResponse.ok) {
                const createdUsers = await backendResponse.json();
                console.log('Users created successfully in backend:', createdUsers);
                const created = Array.isArray(createdUsers) ? createdUsers.length : 1;
                
                return NextResponse.json({
                    success: true,
                    data: {
                        created,
                        failed: 0,
                        errors: [],
                        users: createdUsers
                    },
                    message: `Successfully created ${created} users`
                }, { status: 201 });
            } else {
                const errorData = await backendResponse.text();
                console.log('Backend error response:', errorData);
                
                // Check if it's a duplicate email error
                if (backendResponse.status === 409 || errorData.includes('duplicate') || errorData.includes('unique')) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: 'One or more emails already exist',
                            code: 'DUPLICATE_EMAIL'
                        },
                        { status: 409 }
                    );
                }
            }
        } catch (backendError) {
            console.log("Backend creation error:", backendError);
        }

        // Fallback to individual creation (like the main route does)
        const results = {
            created: 0,
            failed: 0,
            errors: [] as Array<{ row: number; error: string }>,
            users: [] as any[]
        };

        for (let i = 0; i < bulkUsers.length; i++) {
            try {
                const user = bulkUsers[i];
                
                // Check if email exists in mock data
                const existingUser = users.find(u => u.email === user.email.trim().toLowerCase());
                if (existingUser) {
                    results.failed++;
                    results.errors.push({
                        row: i + 2, // +2 because CSV has header row and is 1-indexed
                        error: 'Email already exists'
                    });
                    continue;
                }

                // Try backend creation for individual user
                try {
                    // Generate unique ID for individual creation
                    const individualUniqueId = generateSequentialUniqueId(
                        results.users[results.users.length - 1]?.unique_id || lastUniqueId,
                        'USR'
                    );
                    
                    const singleUserResponse = await fetch(`${backendUrl}/users`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': `${process.env.API_KEY || ''}`,
                            'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify({
                            name: user.name.trim(),
                            email: user.email.trim().toLowerCase(),
                            phone_number: user.phone_number,
                            role: user.role || 'user',
                            unique_id: individualUniqueId,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        })
                    });
                    
                    if (singleUserResponse.ok) {
                        const createdUser = await singleUserResponse.json();
                        results.created++;
                        results.users.push(Array.isArray(createdUser) ? createdUser[0] : createdUser);
                    } else {
                        results.failed++;
                        const errorText = await singleUserResponse.text();
                        results.errors.push({
                            row: i + 2,
                            error: errorText.includes('duplicate') ? 'Email already exists' : 'Creation failed'
                        });
                    }
                } catch {
                    // Fallback to mock data
                    const fallbackUniqueId = generateSequentialUniqueId(
                        results.users[results.users.length - 1]?.unique_id || users[users.length - 1]?.unique_id || null,
                        'USR'
                    );
                    
                    const newUser = {
                        id: Math.max(...users.map(u => u.id)) + results.created + 1,
                        unique_id: fallbackUniqueId,
                        name: user.name.trim(),
                        email: user.email.trim().toLowerCase(),
                        phone_number: user.phone_number,
                        role: user.role || 'user',
                        createdAt: new Date().toISOString()
                    };

                    users.push(newUser);
                    results.created++;
                    results.users.push(newUser);
                }
                
            } catch (error) {
                results.failed++;
                results.errors.push({
                    row: i + 2,
                    error: 'Processing error'
                });
            }
        }

        return NextResponse.json({
            success: results.created > 0,
            data: results,
            message: results.created > 0 
                ? `Successfully created ${results.created} users${results.failed > 0 ? `, ${results.failed} failed` : ''}`
                : 'No users were created'
        }, { status: results.created > 0 ? 201 : 400 });

    } catch (error) {
        console.error('Error creating bulk users:', error);
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