import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    _request: NextRequest,
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

        const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
        const headers = {
            'Content-Type': 'application/json',
            'apikey': `${process.env.API_KEY || ''}`,
            'Authorization': `Bearer ${process.env.API_KEY || ''}`,
        };
        
        console.log(`Starting comprehensive settlement for loan ${id}`);
        
        // First, verify the loan exists and get its details
        const loanCheckResponse = await fetch(`${backendUrl}/loans?id=eq.${id}&select=*`, {
            method: 'GET',
            headers
        });
        
        if (!loanCheckResponse.ok) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to fetch loan details',
                    code: 'LOAN_FETCH_ERROR'
                },
                { status: 400 }
            );
        }
        
        const loanData = await loanCheckResponse.json();
        if (!loanData || loanData.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Loan not found',
                    code: 'LOAN_NOT_FOUND'
                },
                { status: 404 }
            );
        }
        
        const loan = loanData[0];
        const settlementDate = new Date().toISOString();
        
        // Operation 1: Update loan status to 'settled' with settlement date and amount_paid
        console.log('Operation 1: Updating loan status to settled and amount_paid');
        const loanUpdateResponse = await fetch(`${backendUrl}/loans?id=eq.${id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                status: 'completed',
                settlement_date: settlementDate,
                amount_paid: loan.total_repayment || loan.principal_amount,
                updated_at: settlementDate
            })
        });

        if (!loanUpdateResponse.ok) {
            const errorData = await loanUpdateResponse.text();
            console.log('Loan update error:', errorData);
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to update loan status',
                    code: 'LOAN_UPDATE_ERROR'
                },
                { status: 500 }
            );
        }
        
        // Operation 2: Get existing installments to check remaining ones
        console.log('Operation 2: Checking existing installments');
        const existingInstallmentsResponse = await fetch(`${backendUrl}/installments?loan_id=eq.${id}&select=*`, {
            method: 'GET',
            headers
        });

        if (!existingInstallmentsResponse.ok) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to fetch existing installments',
                    code: 'INSTALLMENTS_FETCH_ERROR'
                },
                { status: 500 }
            );
        }

        const existingInstallments = await existingInstallmentsResponse.json();
        const unpaidInstallments = existingInstallments.filter((inst: any) => !inst.payment_verified);
        
        console.log(`Found ${existingInstallments.length} total installments, ${unpaidInstallments.length} unpaid`);

        // Mark all existing installments as paid
        const installmentsUpdateResponse = await fetch(`${backendUrl}/installments?loan_id=eq.${id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                payment_verified: true,
                paid_at: settlementDate,
                updated_at: settlementDate
            })
        });

        if (!installmentsUpdateResponse.ok) {
            const errorData = await installmentsUpdateResponse.text();
            console.log('Installments update error:', errorData);
            
            // Rollback loan status if installments update fails
            await fetch(`${backendUrl}/loans?id=eq.${id}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({
                    status: loan.status, // Revert to original status
                    settlement_date: null,
                    amount_paid: loan.amount_paid || 0, // Revert to original amount_paid
                    updated_at: settlementDate
                })
            });
            
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to update installments',
                    code: 'INSTALLMENTS_UPDATE_ERROR'
                },
                { status: 500 }
            );
        }
        
        // Operation 3A: Handle settlement installment based on remaining installments
        const remainingAmount = (loan.total_repayment || loan.principal_amount) - (loan.amount_paid || 0);
        let settlementInstallmentId = null;
        
        if (unpaidInstallments.length > 0) {
            // There are remaining installments - create a new settlement installment
            console.log('Operation 3A: Creating new settlement installment for remaining amount');
            
            const settlementInstallmentData = {
                loan_id: id,
                amount_due: 0,
                amount_paid: remainingAmount,
                payment_verified: true,
                paid_at: settlementDate,
                created_at: settlementDate,
                updated_at: settlementDate,
                due_date: settlementDate,
            };
            
            const settlementInstallmentResponse = await fetch(`${backendUrl}/installments`, {
                method: 'POST',
                headers: {
                    ...headers,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(settlementInstallmentData)
            });

            if (!settlementInstallmentResponse.ok) {
                const errorData = await settlementInstallmentResponse.text();
                console.log('Settlement installment creation error:', errorData);
                
                // Rollback previous operations
                await Promise.all([
                    // Rollback loan status
                    fetch(`${backendUrl}/loans?id=eq.${id}`, {
                        method: 'PATCH',
                        headers,
                        body: JSON.stringify({
                            status: loan.status,
                            settlement_date: null,
                            amount_paid: loan.amount_paid || 0,
                            updated_at: settlementDate
                        })
                    }),
                    // Rollback installments
                    fetch(`${backendUrl}/installments?loan_id=eq.${id}`, {
                        method: 'PATCH',
                        headers,
                        body: JSON.stringify({
                            payment_verified: false,
                            paid_at: null,
                            updated_at: settlementDate
                        })
                    })
                ]);
                
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Failed to create settlement installment',
                        code: 'SETTLEMENT_INSTALLMENT_ERROR'
                    },
                    { status: 500 }
                );
            }
            
            const settlementInstallmentResult = await settlementInstallmentResponse.json();
            settlementInstallmentId = settlementInstallmentResult[0]?.id;
            
        } else {
            // No remaining installments - update the last installment with remaining amount
            console.log('Operation 3A: Updating last installment with remaining amount');
            
            // Get the last installment (most recent)
            const lastInstallment = existingInstallments.sort((a: any, b: any) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0];
            
            if (lastInstallment) {
                const updatedAmountPaid = (lastInstallment.amount_paid || 0) + remainingAmount;
                
                const lastInstallmentUpdateResponse = await fetch(`${backendUrl}/installments?id=eq.${lastInstallment.id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({
                        amount_paid: updatedAmountPaid,
                        payment_verified: true,
                        paid_at: settlementDate,
                        updated_at: settlementDate
                    })
                });

                if (!lastInstallmentUpdateResponse.ok) {
                    const errorData = await lastInstallmentUpdateResponse.text();
                    console.log('Last installment update error:', errorData);
                    
                    return NextResponse.json(
                        {
                            success: false,
                            error: 'Failed to update last installment',
                            code: 'LAST_INSTALLMENT_UPDATE_ERROR'
                        },
                        { status: 500 }
                    );
                }
                
                settlementInstallmentId = lastInstallment.id;
            }
        }
        
        // Operation 3B: Create payment receipt for settlement installment
        console.log('Operation 3B: Creating payment receipt for settlement installment');
        const receiptData = {
            installment_id: settlementInstallmentId,
            user_id: loan.user_id,
            file_url: "LOAN SETTLED BY ADMIN",
            received_at: settlementDate,
            payment_confirmed: true,
            created_at: settlementDate,
            updated_at: settlementDate
        };
        
        const receiptCreateResponse = await fetch(`${backendUrl}/payment_receipts`, {
            method: 'POST',
            headers: {
                ...headers,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(receiptData)
        });

        if (!receiptCreateResponse.ok) {
            const errorData = await receiptCreateResponse.text();
            console.log('Payment receipt creation error:', errorData);
            
            // Rollback previous operations if receipt creation fails
            await Promise.all([
                // Rollback loan status
                fetch(`${backendUrl}/loans?id=eq.${id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({
                        status: loan.status,
                        settlement_date: null,
                        amount_paid: loan.amount_paid || 0,
                        updated_at: settlementDate
                    })
                }),
                // Rollback installments (set back to unpaid if they were unpaid before)
                fetch(`${backendUrl}/installments?loan_id=eq.${id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({
                        payment_verified: false,
                        paid_at: null,
                        updated_at: settlementDate
                    })
                }),
                // Delete the settlement installment if it was created
                settlementInstallmentId ? fetch(`${backendUrl}/installments?id=eq.${settlementInstallmentId}`, {
                    method: 'DELETE',
                    headers
                }) : Promise.resolve()
            ]);
            
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to create payment receipt',
                    code: 'RECEIPT_CREATE_ERROR'
                },
                { status: 500 }
            );
        }
        
        console.log('All settlement operations completed successfully');
        const receiptData_result = await receiptCreateResponse.json();
        
        return NextResponse.json({
            success: true,
            message: 'Loan settled successfully with all operations completed',
            data: {
                loanId: id,
                status: 'completed',
                settlementDate: settlementDate,
                remainingAmountSettled: remainingAmount,
                operations: {
                    loanUpdate: 'completed',
                    installmentsUpdate: 'completed',
                    settlementInstallmentCreation: 'completed',
                    receiptCreation: 'completed'
                },
                settlementInstallmentId: settlementInstallmentId,
                receiptId: receiptData_result[0]?.id || null
            }
        });

    } catch (error) {
        console.error('Error during loan settlement:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error during settlement',
                code: 'INTERNAL_ERROR'
            },
            { status: 500 }
        );
    }
}