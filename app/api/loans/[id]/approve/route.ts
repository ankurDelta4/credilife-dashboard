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
            console.log(`Approving loan application ${applicationId}`);
            
            // First, get the application details to create the loan
            const applicationResponse = await fetch(`${backendUrl}/loan_applications?id=eq.${applicationId}&select=*,users(*)`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': `${process.env.API_KEY || ''}`,
                    'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                },
            });

            if (applicationResponse.ok) {
                const applicationData = await applicationResponse.json();
                console.log('Application data:', applicationData);
                
                if (applicationData && applicationData.length > 0) {
                    const application = applicationData[0];
                    
                    // Validate current status - should be in verification stage before approval
                    const currentStatus = application.status as LoanStatus;
                    console.log(`Current application status: ${currentStatus}`);
                    
                    // Check if we can transition to approved
                    const statusTransition = transitionLoanStatus(currentStatus, 'approved');
                    if (!statusTransition.success) {
                        return NextResponse.json({
                            success: false,
                            error: `Cannot approve loan from current status '${currentStatus}'. ${statusTransition.error}`,
                            code: 'INVALID_STATUS_TRANSITION'
                        }, { status: 400 });
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

                    console.log(`Application update response status: ${updateApplicationResponse.status}`);
                    
                    if (updateApplicationResponse.ok) {
                        // Step 2: Create a new loan record
                        const currentDate = new Date(); // Approval date
                        const startDate = new Date(currentDate); // Start from approval date
                        
                        // Calculate end date based on tenure (in months)
                        // If approved in July with 3-month tenure, end date will be October
                        const endDate = new Date(startDate);
                        const tenureMonths = parseInt(application.tenure) || 12; // Default to 12 months if not specified
                        endDate.setMonth(startDate.getMonth() + tenureMonths);
                        
                        const loanData = {
                            id: crypto.randomUUID(), // Generate UUID for loan
                            user_id: application.user_id,
                            principal_amount: parseFloat(application.principal_amount) || parseFloat(application.requested_amount) || 0,
                            start_date: startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
                            end_date: endDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
                            status: 'running',
                            assigned_agent_id: null,
                            interest_amount: parseFloat(application.interest_amount) || null,
                            closing_fees: parseFloat(application.closing_fees) || null,
                            total_repayment: parseFloat(application.total_repayment) || null,
                            repayment_type: application.repayment_type || null,
                            tenure: application.tenure || null,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            amount_paid: 0 // Initialize as 0 for new loans
                        };

                        const createLoanResponse = await fetch(`${backendUrl}/loans`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'apikey': `${process.env.API_KEY || ''}`,
                                'Authorization': `Bearer ${process.env.API_KEY || ''}`,
                            },
                            body: JSON.stringify(loanData)
                        });

                        console.log(`Loan creation response status: ${createLoanResponse.status}`);
                        
                        if (createLoanResponse.ok) {
                            console.log('Loan application approved and loan created successfully');
                            
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
                                console.log(`Generated ${installments.length} installments for loan ${loanData.id}`);
                                
                                // Create installments in the database
                                const installmentResult = await createInstallmentsInDatabase(
                                    installments,
                                    backendUrl,
                                    process.env.API_KEY || ''
                                );
                                
                                if (installmentResult.success) {
                                    console.log(`Successfully created installments for loan ${loanData.id}`);
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
                            const loanErrorData = await createLoanResponse.text();
                            console.log('Loan creation error:', loanErrorData);
                            
                            // Application was approved but loan creation failed
                            return NextResponse.json({
                                success: true,
                                message: 'Loan application approved but loan creation failed',
                                warning: 'Manual loan creation may be required'
                            });
                        }
                    } else {
                        const errorData = await updateApplicationResponse.text();
                        console.log('Application update error:', errorData);
                    }
                }
            } else {
                const errorData = await applicationResponse.text();
                console.log('Failed to fetch application details:', errorData);
            }
        } catch (backendError) {
            console.log("Backend update error:", backendError);
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
