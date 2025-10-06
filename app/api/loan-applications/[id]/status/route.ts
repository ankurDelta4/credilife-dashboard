import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const applicationId = resolvedParams.id;
        const body = await request.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Status is required'
                },
                { status: 400 }
            );
        }

        // Validate status values
        const validStatuses = ['pending', 'under-verification', 'under_verification', 'verified', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid status value'
                },
                { status: 400 }
            );
        }

        const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
        const headers = {
            'Content-Type': 'application/json',
            'apikey': `${process.env.API_KEY || ''}`,
            'Authorization': `Bearer ${process.env.API_KEY || ''}`,
            'Prefer': 'return=representation'
        };

        // Update the loan application status
        const updateData = {
            status: status,
            current_stage: status,
            updated_at: new Date().toISOString()
        };

        const response = await fetch(`${backendUrl}/loan_applications?id=eq.${applicationId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Backend error:', errorData);
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to update application status',
                    details: errorData
                },
                { status: response.status }
            );
        }

        const updatedApplication = await response.json();

        return NextResponse.json({
            success: true,
            data: {
                application: Array.isArray(updatedApplication) ? updatedApplication[0] : updatedApplication
            },
            message: `Application status updated to ${status}`
        });

    } catch (error) {
        console.error('Error updating application status:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error'
            },
            { status: 500 }
        );
    }
}