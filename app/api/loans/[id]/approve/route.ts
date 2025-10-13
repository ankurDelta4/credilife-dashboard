import { NextRequest, NextResponse } from 'next/server';
import { generateInstallments, createInstallmentsInDatabase } from '@/lib/utils/installments';
import { transitionLoanStatus, LoanStatus } from '@/lib/utils/loan-status';

export async function PATCH(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: applicationId } = await params;
        
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
            console.log(`[APPROVE] ===== Starting approval process =====`);
        console.log(`[APPROVE] Application ID: ${applicationId}`);
        console.log(`[APPROVE] Backend URL: ${backendUrl}`);
        console.log(`[APPROVE] API Key present: ${!!process.env.API_KEY}`);
            
            // First, get the application details to create the loan
            const applicationResponse = await fetch(`${backendUrl}/loan_applications?id=eq.${applicationId}&select=*,users(*)`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': `${process.env.API_KEY || ''}`,
                    'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                },
            });

            console.log(`[APPROVE] Fetch application response status: ${applicationResponse.status}`);
            
            if (applicationResponse.ok) {
                const applicationData = await applicationResponse.json();
                console.log('[APPROVE] Application data received:', JSON.stringify(applicationData, null, 2));
                
                if (applicationData && applicationData.length > 0) {
                    const application = applicationData[0];
                    
                    // Validate current status - should be in verification stage before approval
                    // Map "under-verification" to "verification" to match the LoanStatus type
                    let currentStatus = application.status;
                    if (currentStatus === 'under-verification') {
                        currentStatus = 'verification';
                    }
                    
                    console.log(`[APPROVE] Current application status: ${application.status} (mapped to: ${currentStatus})`);
                    console.log(`[APPROVE] Application details:`, {
                        id: application.id,
                        user_id: application.user_id,
                        requested_amount: application.requested_amount,
                        principal_amount: application.principal_amount,
                        interest_amount: application.interest_amount,
                        tenure: application.tenure,
                        repayment_type: application.repayment_type
                    });
                    
                    // Skip status validation if already approved (to handle re-runs)
                    if (application.status === 'approved') {
                        console.log('[APPROVE] Application already approved, checking if loan exists...');
                        
                        // Check if loan already exists for this application
                        const checkLoanResponse = await fetch(`${backendUrl}/loans?user_id=eq.${application.user_id}&select=*`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'apikey': `${process.env.API_KEY || ''}`,
                                'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                            },
                        });
                        
                        if (checkLoanResponse.ok) {
                            const existingLoans = await checkLoanResponse.json();
                            if (existingLoans && existingLoans.length > 0) {
                                // Check if any loan was created recently (within last hour) with same amounts
                                const recentLoan = existingLoans.find((loan: any) => {
                                    const loanCreatedAt = new Date(loan.created_at);
                                    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
                                    return loanCreatedAt > hourAgo && 
                                           loan.principal_amount === application.principal_amount;
                                });
                                
                                if (recentLoan) {
                                    console.log(`[APPROVE] Loan already exists for this approved application: ${recentLoan.id}`);
                                    return NextResponse.json({
                                        success: true,
                                        message: 'Application already approved and loan exists',
                                        data: {
                                            applicationId: applicationId,
                                            loanId: recentLoan.id
                                        }
                                    });
                                }
                            }
                        }
                        
                        console.log('[APPROVE] No existing loan found for approved application, will create one');
                        // Continue to create loan if not found
                    } else {
                        // Check if we can transition to approved
                        const statusTransition = transitionLoanStatus(currentStatus as LoanStatus, 'approved');
                        if (!statusTransition.success) {
                            // Allow transition from pending, under-verification, verification, or verified
                            const allowedStatuses = ['pending', 'under-verification', 'verification', 'verified'];
                            if (!allowedStatuses.includes(application.status)) {
                                return NextResponse.json({
                                    success: false,
                                    error: `Cannot approve loan from current status '${application.status}'. Application must be in pending, under-verification, or verified status.`,
                                    code: 'INVALID_STATUS_TRANSITION'
                                }, { status: 400 });
                            }
                        }
                    }
                    
                    // Step 1: Update application status to approved
                    const updateApplicationResponse = await fetch(`${backendUrl}/loan_applications?id=eq.${applicationId}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': `${process.env.API_KEY || ''}`,
                            'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                        },
                        body: JSON.stringify({ 
                            status: 'approved',
                            updated_at: new Date().toISOString() 
                        })
                    });

                    console.log(`[APPROVE] Application update response status: ${updateApplicationResponse.status}`);
                    const updateResponseText = await updateApplicationResponse.text();
                    console.log(`[APPROVE] Application update response:`, updateResponseText);
                    
                    if (updateApplicationResponse.status === 200 || updateApplicationResponse.status === 204) {
                        console.log('[APPROVE] Application status updated successfully, proceeding to create loan...');
                        
                        // Step 2: Create a new loan record
                        const currentDate = new Date(); // Approval date
                        const startDate = new Date(currentDate); // Start from approval date
                        
                        // Calculate end date based on tenure (in months)
                        // If approved in July with 3-month tenure, end date will be October
                        const endDate = new Date(startDate);
                        const tenureMonths = parseInt(application.tenure) || 12; // Default to 12 months if not specified
                        endDate.setMonth(startDate.getMonth() + tenureMonths);
                        
                        const loanId = crypto.randomUUID();
                        const loanData = {
                            id: loanId,
                            user_id: application.user_id,
                            principal_amount: parseFloat(application.principal_amount) || parseFloat(application.requested_amount) || 0,
                            start_date: startDate.toISOString().split('T')[0],
                            end_date: endDate.toISOString().split('T')[0],
                            status: 'running',
                            assigned_agent_id: null,
                            interest_amount: parseFloat(application.interest_amount) || 0,
                            closing_fees: parseFloat(application.closing_fees) || 0,
                            total_repayment: parseFloat(application.total_repayment) || 0,
                            repayment_type: application.repayment_type || 'monthly',
                            tenure: String(application.tenure || '12'),
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            amount_paid: 0
                        };
                        
                        console.log('[APPROVE] Creating loan with data:', JSON.stringify(loanData, null, 2));

                        const createLoanResponse = await fetch(`${backendUrl}/loans`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'apikey': `${process.env.API_KEY || ''}`,
                                'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                            },
                            body: JSON.stringify(loanData)
                        });

                        console.log(`[APPROVE] Loan creation response status: ${createLoanResponse.status}`);
                        const loanResponseText = await createLoanResponse.text();
                        console.log(`[APPROVE] Loan creation response:`, loanResponseText);
                        
                        if (createLoanResponse.status === 201 || createLoanResponse.status === 200) {
                            console.log(`[APPROVE] ✓ Loan created successfully with ID: ${loanId}`);
                            let createdLoan = null;
                            try {
                                createdLoan = loanResponseText ? JSON.parse(loanResponseText) : null;
                            } catch (e) {
                                console.log('[APPROVE] Could not parse loan response, but loan was created');
                            }
                            
                            // Step 3: Generate and create installments
                            try {
                                const loanForInstallments = {
                                    id: loanData.id,
                                    principal_amount: loanData.principal_amount,
                                    interest_amount: loanData.interest_amount || undefined,
                                    total_repayment: loanData.total_repayment || (loanData.principal_amount + (loanData.interest_amount || 0)),
                                    tenure: loanData.tenure || '3',
                                    repayment_type: (loanData.repayment_type || 'monthly') as 'monthly' | 'bi-weekly' | 'weekly' | 'daily',
                                    start_date: loanData.start_date,
                                    closing_fees: loanData.closing_fees || undefined
                                };
                                
                                // Generate installments based on loan details
                                const installments = generateInstallments(loanForInstallments);
                                console.log(`[APPROVE] Generated ${installments.length} installments for loan ${loanData.id}`);
                                console.log(`[APPROVE] First 3 installments:`, installments.slice(0, 3));
                                
                                // Create installments in the database
                                console.log('[APPROVE] Creating installments in database...');
                                const installmentResult = await createInstallmentsInDatabase(
                                    installments,
                                    backendUrl,
                                    process.env.API_KEY || ''
                                );
                                
                                if (installmentResult.success) {
                                    console.log(`[APPROVE] ✓ Successfully created ${installments.length} installments for loan ${loanData.id}`);
                                    console.log('[APPROVE] ===== Approval process completed successfully =====');
                                    return NextResponse.json({
                                        success: true,
                                        message: 'Loan application approved, loan created, and installments generated successfully',
                                        data: {
                                            applicationId: applicationId,
                                            loanId: loanData.id,
                                            installmentsCreated: installments.length
                                        }
                                    });
                                } else {
                                    // Rollback: Delete the created loan
                                    console.error('Failed to create installments, rolling back loan creation:', installmentResult.error);
                                    
                                    try {
                                        // Delete the loan that was just created
                                        const deleteLoanResponse = await fetch(`${backendUrl}/loans?id=eq.${loanData.id}`, {
                                            method: 'DELETE',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'apikey': `${process.env.API_KEY || ''}`,
                                                'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                                            }
                                        });
                                        
                                        // Revert application status back to pending
                                        const revertApplicationResponse = await fetch(`${backendUrl}/loan_applications?id=eq.${applicationId}`, {
                                            method: 'PATCH',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'apikey': `${process.env.API_KEY || ''}`,
                                                'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                                            },
                                            body: JSON.stringify({ 
                                                status: 'pending',
                                                updated_at: new Date().toISOString() 
                                            })
                                        });
                                        
                                        console.log('Rolled back loan creation and reverted application status to pending');
                                        
                                        return NextResponse.json({
                                            success: false,
                                            error: 'Failed to create installments. Loan creation was rolled back and application status reverted to pending.',
                                            details: installmentResult.error
                                        }, { status: 500 });
                                        
                                    } catch (rollbackError) {
                                        console.error('Rollback failed:', rollbackError);
                                        return NextResponse.json({
                                            success: false,
                                            error: 'Failed to create installments and rollback also failed. Manual intervention required.',
                                            loanId: loanData.id
                                        }, { status: 500 });
                                    }
                                }
                            } catch (installmentError) {
                                // Rollback: Delete the created loan
                                console.error('Error generating installments, rolling back:', installmentError);
                                
                                try {
                                    // Delete the loan that was just created
                                    const deleteLoanResponse = await fetch(`${backendUrl}/loans?id=eq.${loanData.id}`, {
                                        method: 'DELETE',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'apikey': `${process.env.API_KEY || ''}`,
                                            'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                                        }
                                    });
                                    
                                    // Revert application status back to pending
                                    const revertApplicationResponse = await fetch(`${backendUrl}/loan_applications?id=eq.${applicationId}`, {
                                        method: 'PATCH',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'apikey': `${process.env.API_KEY || ''}`,
                                            'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                                        },
                                        body: JSON.stringify({ 
                                            status: 'pending',
                                            updated_at: new Date().toISOString() 
                                        })
                                    });
                                    
                                    console.log('Rolled back loan creation and reverted application status to pending');
                                    
                                    return NextResponse.json({
                                        success: false,
                                        error: 'Failed to generate installments. Loan creation was rolled back.',
                                        details: installmentError instanceof Error ? installmentError.message : 'Unknown error'
                                    }, { status: 500 });
                                    
                                } catch (rollbackError) {
                                    console.error('Rollback failed:', rollbackError);
                                    return NextResponse.json({
                                        success: false,
                                        error: 'Failed to generate installments and rollback also failed. Manual intervention required.',
                                        loanId: loanData.id
                                    }, { status: 500 });
                                }
                            }
                        } else {
                            console.log('[APPROVE] ✗ Loan creation failed');
                            console.log('[APPROVE] Error details:', loanResponseText);
                            
                            // Application was approved but loan creation failed
                            return NextResponse.json({
                                success: true,
                                message: 'Loan application approved but loan creation failed',
                                warning: 'Manual loan creation may be required'
                            });
                        }
                    } else {
                        console.log('[APPROVE] ✗ Application update failed');
                        console.log('[APPROVE] Error details:', updateResponseText);
                        return NextResponse.json({
                            success: false,
                            error: 'Failed to update application status',
                            details: updateResponseText
                        }, { status: 400 });
                    }
                }
            } else {
                const errorData = await applicationResponse.text();
                console.log('[APPROVE] ✗ Failed to fetch application details');
                console.log('[APPROVE] Error:', errorData);
                return NextResponse.json({
                    success: false,
                    error: 'Failed to fetch application details',
                    details: errorData
                }, { status: 400 });
            }
        } catch (backendError) {
            console.log("[APPROVE] ✗ Backend error:", backendError);
            return NextResponse.json({
                success: false,
                error: 'Backend error during approval process',
                details: backendError instanceof Error ? backendError.message : 'Unknown error'
            }, { status: 500 });
        }

        // Fallback response (when backend is not available)
        return NextResponse.json({
            success: true,
            message: 'Loan application approved successfully (fallback)'
        });

    } catch (error) {
        console.error('Error approving loan application:', error);
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
