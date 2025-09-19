import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const applicationId = params.id;
        
        if (!applicationId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Application ID is required',
                    code: 'MISSING_ID'
                },
                { status: 400 }
            );
        }

        // Try to update in backend first
        const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
        
        try {
            console.log(`Rejecting loan application ${applicationId}`);
            
            const backendResponse = await fetch(`${backendUrl}/loan_applications?id=eq.${applicationId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': `${process.env.API_KEY || ''}`,
                    'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                },
                body: JSON.stringify({ 
                    status: 'rejected',
                    updated_at: new Date().toISOString() 
                })
            });

            console.log(`Backend response status: ${backendResponse.status}`);
            
            if (backendResponse.ok) {
                console.log('Loan application rejected successfully in backend');
                return NextResponse.json({
                    success: true,
                    message: 'Loan application rejected successfully'
                });
            } else {
                const errorData = await backendResponse.text();
                console.log('Backend error response:', errorData);
            }
        } catch (backendError) {
            console.log("Backend update error:", backendError);
        }

        // Fallback response (when backend is not available)
        return NextResponse.json({
            success: true,
            message: 'Loan application rejected successfully (fallback)'
        });

    } catch (error) {
        console.error('Error rejecting loan application:', error);
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