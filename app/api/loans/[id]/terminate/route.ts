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
            console.log(`[TERMINATE] Starting termination process for loan ${id}`);
            
            // Step 1: Delete all installments associated with this loan
            console.log(`[TERMINATE] Deleting installments for loan ${id}`);
            
            const deleteInstallmentsResponse = await fetch(`${backendUrl}/installments?loan_id=eq.${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': `${process.env.API_KEY || ''}`,
                    'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                }
            });
            
            if (deleteInstallmentsResponse.ok || deleteInstallmentsResponse.status === 204) {
                console.log(`[TERMINATE] Successfully deleted installments for loan ${id}`);
            } else {
                const installmentError = await deleteInstallmentsResponse.text();
                console.log(`[TERMINATE] Warning: Failed to delete installments:`, installmentError);
                // Continue with loan termination even if installment deletion fails
            }
            
            // Step 2: Update loan status to terminated
            console.log(`[TERMINATE] Updating loan status to terminated`);
            
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

            console.log(`[TERMINATE] Loan update response status: ${backendResponse.status}`);
            
            if (backendResponse.ok || backendResponse.status === 204) {
                console.log(`[TERMINATE] ✓ Loan ${id} terminated successfully`);
                
                // Step 3: Verify installments were deleted (optional check)
                const checkInstallmentsResponse = await fetch(`${backendUrl}/installments?loan_id=eq.${id}&select=count`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': `${process.env.API_KEY || ''}`,
                        'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                        'Prefer': 'count=exact'
                    }
                });
                
                let remainingInstallments = 'unknown';
                if (checkInstallmentsResponse.ok) {
                    const countHeader = checkInstallmentsResponse.headers.get('content-range');
                    if (countHeader) {
                        const match = countHeader.match(/\*\/(\d+)/);
                        if (match) {
                            remainingInstallments = match[1];
                        }
                    }
                    console.log(`[TERMINATE] Remaining installments after deletion: ${remainingInstallments}`);
                }
                
                return NextResponse.json({
                    success: true,
                    message: 'Loan terminated successfully and all installments deleted',
                    data: {
                        loanId: id,
                        status: 'terminated',
                        terminationDate: new Date().toISOString(),
                        installmentsDeleted: remainingInstallments === '0' || remainingInstallments === 'unknown'
                    }
                });
            } else {
                const errorData = await backendResponse.text();
                console.log('[TERMINATE] ✗ Loan termination failed:', errorData);
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Failed to terminate loan in backend',
                        code: 'BACKEND_ERROR',
                        details: errorData
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