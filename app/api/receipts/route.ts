import { NextRequest, NextResponse } from 'next/server';

// Mock receipts database
let receipts = [
    {
        id: 1,
        username: 'Alice Johnson',
        loanAmount: 50000,
        receiptImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop',
        status: 'pending',
        submittedDate: '2024-09-19T10:30:00Z',
        loanId: 'L001'
    },
    {
        id: 2,
        username: 'Bob Smith',
        loanAmount: 25000,
        receiptImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop',
        status: 'pending',
        submittedDate: '2024-09-18T14:20:00Z',
        loanId: 'L002'
    },
    {
        id: 3,
        username: 'Carol Davis',
        loanAmount: 75000,
        receiptImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop',
        status: 'approved',
        submittedDate: '2024-09-17T09:15:00Z',
        loanId: 'L003'
    },
    {
        id: 4,
        username: 'David Wilson',
        loanAmount: 30000,
        receiptImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop',
        status: 'rejected',
        submittedDate: '2024-09-16T11:45:00Z',
        loanId: 'L004'
    },
    {
        id: 5,
        username: 'Eva Brown',
        loanAmount: 15000,
        receiptImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop',
        status: 'pending',
        submittedDate: '2024-09-15T16:30:00Z',
        loanId: 'L005'
    }
];

export async function GET(request: NextRequest) {
    try {
        console.log('Fetching receipts...');
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const status = searchParams.get('status') || '';

        // Fetch receipts from backend API
        const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
        
        try {
            const backendResponse = await fetch(`${backendUrl}/payment_receipts?select=*,installments(id,loan_id,loans(id,user_id, principal_amount, total_repayment, users(id, name)))&order=received_at.desc`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': `${process.env.API_KEY || ''}`,
                    'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                },
            });
            const backendData = await backendResponse.json();
            console.log("Backend receipts data:", backendData[0]);
            if (backendResponse.ok) {
                
                
                if (backendData && Array.isArray(backendData) && backendData.length > 0) {
                    // Transform data to match frontend field names
                    let transformedData = backendData.map((item: any) => {
                        return {
                            id: item.id,
                            username: item.installments.loans.users.name || 'N/A',
                            principalAmount: item.installments.loans.principal_amount || 0,
                            totalRepayment: item.installments.loans.total_repayment || 0,
                            receiptImage: item.file_url || '',
                            status: item.payment_confirmed ? 'approved' : 'pending',
                            submittedDate: item.received_at || item.created_at || item.submittedDate,
                            loanId: item.installments.loan_id || item.loanId,
                            amountPaid: item.amount || 0
                        };
                    });
                    
                    // Apply filters to transformed data
                    let filteredData = transformedData;
                    
                    if (status) {
                        filteredData = filteredData.filter((item: any) => item.status === status);
                    }

                    // Apply pagination
                    const startIndex = (page - 1) * limit;
                    const endIndex = startIndex + limit;
                    const paginatedData = filteredData.slice(startIndex, endIndex);

                    return NextResponse.json({
                        success: true,
                        data: {
                            receipts: paginatedData,
                            pagination: {
                                page,
                                limit,
                                total: filteredData.length,
                                totalPages: Math.ceil(filteredData.length / limit)
                            }
                        },
                        message: 'Receipts retrieved successfully'
                    });
                }
            }
        } catch (backendError) {
            console.log("Backend API error, no data available:", backendError);
        }

        // Return no data available instead of fallback
        return NextResponse.json({
            success: true,
            data: {
                receipts: [],
                pagination: {
                    page,
                    limit,
                    total: 0,
                    totalPages: 0
                }
            },
            message: 'No receipts data available',
            isEmpty: true
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

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { receiptId, status } = body;

        // Validation
        if (!receiptId || !status) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Receipt ID and status are required',
                    code: 'MISSING_FIELDS'
                },
                { status: 400 }
            );
        }

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid status. Must be approved, rejected, or pending',
                    code: 'INVALID_STATUS'
                },
                { status: 400 }
            );
        }

        // Try to update in backend first
        const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
        
        try {
            // console.log(`Updating receipt ${receiptId} with status: ${status}`);
            
            // Convert status to payment_confirmed boolean for backend
            const paymentConfirmed = status === 'approved';
            
            // First, get the receipt details to find the related loan and installment
            const receiptResponse = await fetch(`${backendUrl}/payment_receipts?id=eq.${receiptId}&select=*,installments(id,loan_id,amount_paid, amount_due,loans(id,amount_paid,principal_amount))`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': `${process.env.API_KEY || ''}`,
                    'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                },
            });
            const receiptData = await receiptResponse.json();
            console.log('Receipt data:', receiptData);
            if (receiptResponse.ok) {
               
                
                if (receiptData && receiptData.length > 0) {
                    const receipt = receiptData[0];
                    const installment = receipt.installments;
                    const loan = installment?.loans;
                    
                    if (installment && loan) {
                        // Update payment_receipts table
                        let receiptUpdateBody: any = {
                            payment_confirmed: paymentConfirmed,
                            updated_at: new Date().toISOString()
                        };
                        
                        // If approved, also set amount_paid, paid_at, and status
                        if (paymentConfirmed) {
                            receiptUpdateBody.amount_paid = receipt.amount || 0;
                            receiptUpdateBody.paid_at = new Date().toISOString();
                            receiptUpdateBody.status = 'approved';
                        } else {
                            receiptUpdateBody.status = status; // Set to 'rejected' or other status
                        }
                        
                        const updateReceiptResponse = await fetch(`${backendUrl}/payment_receipts?id=eq.${receiptId}`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'apikey': `${process.env.API_KEY || ''}`,
                                'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                            },
                            body: JSON.stringify(receiptUpdateBody)
                        });
                        console.log(`Updated receipt ${receiptId} payment_confirmed to ${paymentConfirmed}, updateReceiptResponse: ${updateReceiptResponse.status}`);

                        // Update installments table - set payment_verified and calculate new amount_due
                        let installmentUpdateBody: any = {
                            payment_verified: paymentConfirmed,
                            updated_at: new Date().toISOString()
                        };
                        
                        // If approved, calculate and update the remaining amount_due
                        if (paymentConfirmed) {
                            const currentAmountPaid = installment.amount_paid || 0;
                            const currentAmountDue = installment.amount_due || 0;
                            const paymentAmount = receipt.amount || 0; // Amount from the receipt
                            
                            const newAmountPaid = currentAmountPaid + paymentAmount;
                            const newAmountDue = Math.max(0, currentAmountDue - paymentAmount); // Ensure it doesn't go negative
                            
                            installmentUpdateBody.amount_paid = newAmountPaid;
                            installmentUpdateBody.amount_due = newAmountDue;
                            installmentUpdateBody.paid_at = new Date().toISOString();
                            
                            // Update installment status based on payment
                            if (newAmountDue <= 0) {
                                installmentUpdateBody.status = 'paid';
                            } else {
                                installmentUpdateBody.status = 'partial';
                            }
                            
                            console.log(`Installment ${installment.id}: amount_paid ${currentAmountPaid} -> ${newAmountPaid}, amount_due ${currentAmountDue} -> ${newAmountDue}, status: ${installmentUpdateBody.status}`);
                        }
                        
                        const updateInstallmentResponse = await fetch(`${backendUrl}/installments?id=eq.${installment.id}`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'apikey': `${process.env.API_KEY || ''}`,
                                'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                            },
                            body: JSON.stringify(installmentUpdateBody)
                        });
                        console.log(`Updated installment ${installment.id} payment_verified to ${paymentConfirmed}, updateInstallmentResponse: ${updateInstallmentResponse.status}`)
                        // Update loans table - adjust amount_paid
                        if (paymentConfirmed) {
                            console.log("inside the if block")
                            const currentPaidAmount = loan.amount_paid || 0;
                            const installmentAmount = installment.amount || 0;
                            const newPaidAmount = currentPaidAmount + installmentAmount;
                            
                            const updateLoanResponse = await fetch(`${backendUrl}/loans?id=eq.${loan.id}`, {
                                method: 'PATCH',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'apikey': `${process.env.API_KEY || ''}`,
                                    'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                                },
                                body: JSON.stringify({
                                    amount_paid: newPaidAmount,
                                    updated_at: new Date().toISOString()
                                })
                            });

                            console.log(`Updated loan ${loan.id} amount_paid from ${currentPaidAmount} to ${updateLoanResponse}`);
                        }

                        console.log(`Updated receipt ${receiptId}, installment ${installment.id}, and loan ${loan.id}`);
                        
                        return NextResponse.json({
                            success: true,
                            message: 'Receipt status updated successfully with related tables'
                        });
                    }
                }
            }
            
            // Fallback: just update the receipt if related data not found
            // const backendResponse = await fetch(`${backendUrl}/payment_receipts?id=eq.${receiptId}`, {
            //     method: 'PATCH',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'apikey': `${process.env.API_KEY || ''}`,
            //         'Authorization': `Bearer ${process.env.API_KEY || ''}`,
            //     },
            //     body: JSON.stringify({ 
            //         payment_confirmed: paymentConfirmed,
            //         updated_at: new Date().toISOString() 
            //     })
            // });

            // console.log(`Backend response status: ${backendResponse.status}`);
            
            // if (backendResponse.ok) {
            //     console.log('Receipt updated successfully in backend');
            //     return NextResponse.json({
            //         success: true,
            //         message: 'Receipt status updated successfully'
            //     });
            // } else {
            //     const errorData = await backendResponse.text();
            //     console.log('Backend error response:', errorData);
            // }
        } catch (backendError) {
            console.log("Backend update error, updating mock data:", backendError);
        }

        // Fallback to updating mock data
        const receiptIndex = receipts.findIndex(r => r.id.toString() === receiptId.toString());
        if (receiptIndex === -1) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Receipt not found',
                    code: 'RECEIPT_NOT_FOUND'
                },
                { status: 404 }
            );
        }

        receipts[receiptIndex] = {
            ...receipts[receiptIndex],
            status: status
        };

        return NextResponse.json({
            success: true,
            data: { receipt: receipts[receiptIndex] },
            message: 'Receipt status updated successfully (fallback)'
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