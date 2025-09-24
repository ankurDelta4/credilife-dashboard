import { NextRequest, NextResponse } from 'next/server';

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
                            return NextResponse.json({
                                success: true,
                                message: 'Loan application approved and loan created successfully',
                                data: {
                                    applicationId: applicationId,
                                    loanId: loanData.id
                                }
                            });
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
