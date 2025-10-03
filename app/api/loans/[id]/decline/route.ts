import { NextRequest, NextResponse } from 'next/server';
import { transitionLoanStatus, LoanStatus, createStatusChangeLog } from '@/lib/utils/loan-status';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await params;
    const body = await request.json();
    const { declinedBy, reason, notes } = body;
    
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

    if (!reason) {
      return NextResponse.json(
        {
          success: false,
          error: 'Decline reason is required',
          code: 'MISSING_REASON'
        },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
    
    try {
      console.log(`Declining loan application ${applicationId}`);
      
      // First, get the application details
      const applicationResponse = await fetch(`${backendUrl}/loan_applications?id=eq.${applicationId}&select=*`, {
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
          
          // Validate current status - can decline from pending or verification
          const currentStatus = application.status as LoanStatus;
          console.log(`Current application status: ${currentStatus}`);
          
          // Check if we can transition to declined
          const statusTransition = transitionLoanStatus(currentStatus, 'declined');
          if (!statusTransition.success) {
            return NextResponse.json({
              success: false,
              error: `Cannot decline loan from current status '${currentStatus}'. ${statusTransition.error}`,
              code: 'INVALID_STATUS_TRANSITION'
            }, { status: 400 });
          }
          
          // Update application status to declined
          const updateApplicationResponse = await fetch(`${backendUrl}/loan_applications?id=eq.${applicationId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': `${process.env.API_KEY || ''}`,
              'Authorization': `Bearer ${process.env.API_KEY || ''}`,
            },
            body: JSON.stringify({ 
              status: 'declined',
              updated_at: new Date().toISOString(),
              decline_reason: reason,
              decline_notes: notes,
              declined_by: declinedBy,
              declined_at: new Date().toISOString()
            })
          });

          console.log(`Application decline response status: ${updateApplicationResponse.status}`);
          
          if (updateApplicationResponse.ok) {
            // Log the status change
            const statusLog = createStatusChangeLog(
              applicationId,
              currentStatus,
              'declined',
              declinedBy,
              reason,
              { notes, declinedAt: new Date().toISOString() }
            );

            console.log('Loan application declined successfully');
            return NextResponse.json({
              success: true,
              message: 'Loan application declined successfully',
              data: {
                applicationId: applicationId,
                previousStatus: currentStatus,
                newStatus: 'declined',
                declinedBy,
                reason,
                notes,
                transition: statusLog
              }
            });
          } else {
            const errorData = await updateApplicationResponse.text();
            console.log('Application decline error:', errorData);
            return NextResponse.json({
              success: false,
              error: 'Failed to decline application',
              details: errorData
            }, { status: 500 });
          }
        } else {
          return NextResponse.json({
            success: false,
            error: 'Application not found',
            code: 'APPLICATION_NOT_FOUND'
          }, { status: 404 });
        }
      } else {
        const errorData = await applicationResponse.text();
        console.log('Failed to fetch application details:', errorData);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch application details',
          details: errorData
        }, { status: 500 });
      }
    } catch (backendError) {
      console.log("Backend decline error:", backendError);
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to backend service',
        details: backendError
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error declining loan application:', error);
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