import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid loan application ID',
                    code: 'INVALID_ID'
                },
                { status: 400 }
            );
        }

        const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
        const headers = {
            'Content-Type': 'application/json',
            'apikey': `${process.env.API_KEY || ''}`,
            'Authorization': `Bearer ${process.env.API_KEY || ''}`,
        };

        const response = await fetch(`${backendUrl}/loan_applications?id=eq.${id}&select=*`, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to fetch loan application data',
                    code: 'SUPABASE_ERROR'
                },
                { status: response.status }
            );
        }

        const data = await response.json();

        if (data.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Loan application not found',
                    code: 'APPLICATION_NOT_FOUND'
                },
                { status: 404 }
            );
        }

        const application = data[0];

        return NextResponse.json({
            success: true,
            data: { application },
            message: 'Loan application retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching loan application:', error);
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
        const body = await request.json();

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid loan application ID',
                    code: 'INVALID_ID'
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

        // First check if the application exists and get its current status
        const getResponse = await fetch(`${backendUrl}/loan_applications?id=eq.${id}&select=*`, {
            method: 'GET',
            headers
        });

        if (!getResponse.ok) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to fetch loan application',
                    code: 'FETCH_ERROR'
                },
                { status: getResponse.status }
            );
        }

        const existingData = await getResponse.json();
        if (existingData.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Loan application not found',
                    code: 'APPLICATION_NOT_FOUND'
                },
                { status: 404 }
            );
        }

        const currentApplication = existingData[0];

        // Prevent editing approved applications
        if (currentApplication.status === 'approved') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Cannot edit approved loan applications',
                    code: 'EDIT_NOT_ALLOWED'
                },
                { status: 403 }
            );
        }

        // Prepare update data
        const updateData = {
            ...body,
            updated_at: new Date().toISOString()
        };

        // If user_data is provided as an object, stringify it
        if (updateData.user_data && typeof updateData.user_data === 'object') {
            updateData.user_data = JSON.stringify(updateData.user_data);
        }

        // Update the application
        const response = await fetch(`${backendUrl}/loan_applications?id=eq.${id}`, {
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
                    error: 'Failed to update loan application',
                    details: errorData,
                    code: 'BACKEND_ERROR'
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
            message: 'Loan application updated successfully'
        });

    } catch (error) {
        console.error('Error updating loan application:', error);
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
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid loan application ID',
                    code: 'INVALID_ID'
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

        // First check if the application exists and get its current status
        const getResponse = await fetch(`${backendUrl}/loan_applications?id=eq.${id}&select=*`, {
            method: 'GET',
            headers
        });

        if (!getResponse.ok) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to fetch loan application',
                    code: 'FETCH_ERROR'
                },
                { status: getResponse.status }
            );
        }

        const existingData = await getResponse.json();
        if (existingData.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Loan application not found',
                    code: 'APPLICATION_NOT_FOUND'
                },
                { status: 404 }
            );
        }

        const currentApplication = existingData[0];

        // Prevent deleting approved applications
        if (currentApplication.status === 'approved') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Cannot delete approved loan applications',
                    code: 'DELETE_NOT_ALLOWED'
                },
                { status: 403 }
            );
        }

        // Delete the application
        const response = await fetch(`${backendUrl}/loan_applications?id=eq.${id}`, {
            method: 'DELETE',
            headers
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Backend error:', errorData);
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to delete loan application',
                    details: errorData,
                    code: 'BACKEND_ERROR'
                },
                { status: response.status }
            );
        }

        const deletedApplication = await response.json();

        return NextResponse.json({
            success: true,
            data: { 
                application: Array.isArray(deletedApplication) ? deletedApplication[0] : deletedApplication 
            },
            message: 'Loan application deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting loan application:', error);
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