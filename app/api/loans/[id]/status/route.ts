import { NextRequest, NextResponse } from 'next/server';
import { 
  transitionLoanStatus, 
  createStatusChangeLog,
  LoanStatus,
  getStatusInfo,
  isValidStatusTransition 
} from '@/lib/utils/loan-status';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: loanId } = await params;
    const body = await request.json();
    const { newStatus, reason, userId } = body;

    if (!loanId) {
      return NextResponse.json(
        { success: false, error: 'Loan ID is required' },
        { status: 400 }
      );
    }

    if (!newStatus) {
      return NextResponse.json(
        { success: false, error: 'New status is required' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';

    // First, get current loan status
    try {
      const getLoanResponse = await fetch(`${backendUrl}/loans?id=eq.${loanId}&select=*`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': `${process.env.API_KEY || ''}`,
          'Authorization': `Bearer ${process.env.API_KEY || ''}`,
        },
      });

      if (!getLoanResponse.ok) {
        return NextResponse.json(
          { success: false, error: 'Loan not found' },
          { status: 404 }
        );
      }

      const loanData = await getLoanResponse.json();
      if (!loanData || loanData.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Loan not found' },
          { status: 404 }
        );
      }

      const currentLoan = loanData[0];
      const currentStatus = currentLoan.status as LoanStatus;

      // Validate status transition
      const transition = transitionLoanStatus(currentStatus, newStatus as LoanStatus, userId, reason);
      
      if (!transition.success) {
        return NextResponse.json(
          { success: false, error: transition.error },
          { status: 400 }
        );
      }

      // Update loan status
      const updateResponse = await fetch(`${backendUrl}/loans?id=eq.${loanId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': `${process.env.API_KEY || ''}`,
          'Authorization': `Bearer ${process.env.API_KEY || ''}`,
        },
        body: JSON.stringify({
          status: newStatus,
          updated_at: new Date().toISOString(),
        }),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        return NextResponse.json(
          { success: false, error: 'Failed to update loan status', details: errorText },
          { status: 500 }
        );
      }

      // Create status change log
      const statusLog = createStatusChangeLog(
        loanId,
        currentStatus,
        newStatus as LoanStatus,
        userId,
        reason,
        { 
          timestamp: new Date().toISOString(),
          previousData: currentLoan 
        }
      );

      // Try to save the status change log (optional - don't fail if this fails)
      try {
        await fetch(`${backendUrl}/loan_status_history`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': `${process.env.API_KEY || ''}`,
            'Authorization': `Bearer ${process.env.API_KEY || ''}`,
          },
          body: JSON.stringify({
            loan_id: loanId,
            from_status: currentStatus,
            to_status: newStatus,
            changed_by: userId,
            reason: reason,
            changed_at: new Date().toISOString(),
            metadata: statusLog.metadata,
          }),
        });
      } catch (logError) {
        console.warn('Failed to save status change log:', logError);
      }

      const newStatusInfo = getStatusInfo(newStatus as LoanStatus);

      return NextResponse.json({
        success: true,
        message: `Loan status successfully updated to '${newStatusInfo.label}'`,
        data: {
          loanId,
          previousStatus: currentStatus,
          newStatus: newStatus,
          statusInfo: newStatusInfo,
          transition: transition.transition,
          timestamp: new Date().toISOString(),
        },
      });

    } catch (fetchError) {
      console.error('Error fetching loan:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch loan data' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error updating loan status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: loanId } = await params;

    if (!loanId) {
      return NextResponse.json(
        { success: false, error: 'Loan ID is required' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';

    // Get current loan status
    const getLoanResponse = await fetch(`${backendUrl}/loans?id=eq.${loanId}&select=*`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': `${process.env.API_KEY || ''}`,
        'Authorization': `Bearer ${process.env.API_KEY || ''}`,
      },
    });

    if (!getLoanResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Loan not found' },
        { status: 404 }
      );
    }

    const loanData = await getLoanResponse.json();
    if (!loanData || loanData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Loan not found' },
        { status: 404 }
      );
    }

    const currentLoan = loanData[0];
    const currentStatus = currentLoan.status as LoanStatus;
    const statusInfo = getStatusInfo(currentStatus);

    // Get status history (if available)
    let statusHistory = [];
    try {
      const historyResponse = await fetch(`${backendUrl}/loan_status_history?loan_id=eq.${loanId}&order=changed_at.desc`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': `${process.env.API_KEY || ''}`,
          'Authorization': `Bearer ${process.env.API_KEY || ''}`,
        },
      });

      if (historyResponse.ok) {
        statusHistory = await historyResponse.json();
      }
    } catch (historyError) {
      console.warn('Failed to fetch status history:', historyError);
    }

    return NextResponse.json({
      success: true,
      data: {
        loanId,
        currentStatus,
        statusInfo,
        allowedTransitions: statusInfo.nextStatuses.map(status => ({
          status,
          info: getStatusInfo(status)
        })),
        statusHistory,
      },
    });

  } catch (error) {
    console.error('Error fetching loan status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}