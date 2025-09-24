import { NextRequest, NextResponse } from 'next/server';

// PATCH: Update staff member
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
                    error: 'Staff ID is required',
                    code: 'INVALID_ID'
                },
                { status: 400 }
            );
        }

        const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
        
        const response = await fetch(`${backendUrl}/staff?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': `${process.env.API_KEY || ''}`,
                'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                ...body,
                updated_at: new Date().toISOString()
            })
        });

        if (response.ok) {
            const staffData = await response.json();
            return NextResponse.json({
                success: true,
                data: {
                    user: staffData[0]
                },
                message: 'Staff member updated successfully'
            });
        } else {
            const errorData = await response.text();
            console.log('Backend error:', errorData);
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to update staff member',
                    code: 'UPDATE_ERROR'
                },
                { status: response.status }
            );
        }
    } catch (error) {
        console.error('Error updating staff:', error);
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