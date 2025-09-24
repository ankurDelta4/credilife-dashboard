import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Loan ID is required',
                    code: 'INVALID_ID'
                },
                { status: 400 }
            );
        }

        // Try to terminate loan in backend first
        const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
        
        try {
            console.log(`Terminating loan ${id}`);
            
            const backendResponse = await fetch(`${backendUrl}/loans?id=eq.${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': `${process.env.API_KEY || ''}`,
                    'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                },
                body: JSON.stringify({
                    status: 'terminated',
                    termination_date: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
            });

            console.log(`Backend response status: ${backendResponse.status}`);
            
            if (backendResponse.ok) {
                console.log('Loan terminated successfully in backend');
                return NextResponse.json({
                    success: true,
                    message: 'Loan terminated successfully',
                    data: {
                        loanId: id,
                        status: 'terminated',
                        terminationDate: new Date().toISOString()
                    }
                });
            } else {
                const errorData = await backendResponse.text();
                console.log('Backend error response:', errorData);
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Failed to terminate loan in backend',
                        code: 'BACKEND_ERROR'
                    },
                    { status: 500 }
                );
            }
        } catch (backendError) {
            console.log("Backend termination error:", backendError);
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to terminate loan',
                    code: 'TERMINATION_ERROR'
                },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('Error terminating loan:', error);
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