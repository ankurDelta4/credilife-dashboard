import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('id') || '';
    
    if (!applicationId) {
      return NextResponse.json({
        success: false,
        error: 'Application ID is required'
      }, { status: 400 });
    }
    
    const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
    const apiKey = process.env.API_KEY || '';
    
    console.log('Testing approval process for application:', applicationId);
    
    // Step 1: Get the application details
    const appResponse = await fetch(
      `${backendUrl}/loan_applications?id=eq.${applicationId}&select=*`,
      {
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const applications = await appResponse.json();
    
    if (!applications || applications.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Application not found'
      });
    }
    
    const application = applications[0];
    
    // Step 2: Check if loan already exists for this user
    const existingLoansResponse = await fetch(
      `${backendUrl}/loans?user_id=eq.${application.user_id}&select=*`,
      {
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const existingLoans = await existingLoansResponse.json();
    
    // Step 3: Prepare loan data
    const currentDate = new Date();
    const startDate = new Date(currentDate);
    const endDate = new Date(startDate);
    const tenureMonths = parseInt(application.tenure) || 12;
    endDate.setMonth(startDate.getMonth() + tenureMonths);
    
    const loanData = {
      id: crypto.randomUUID(),
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
    
    return NextResponse.json({
      success: true,
      debug: {
        applicationId,
        application: {
          id: application.id,
          user_id: application.user_id,
          status: application.status,
          requested_amount: application.requested_amount,
          principal_amount: application.principal_amount,
          interest_amount: application.interest_amount,
          total_repayment: application.total_repayment,
          tenure: application.tenure,
          repayment_type: application.repayment_type
        },
        existingLoansCount: existingLoans?.length || 0,
        existingLoans: existingLoans?.map((l: any) => ({
          id: l.id,
          status: l.status,
          principal_amount: l.principal_amount,
          created_at: l.created_at
        })),
        preparedLoanData: loanData,
        wouldCreateLoan: application.status !== 'approved' || existingLoans?.length === 0
      }
    });
    
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}