import { NextRequest, NextResponse } from 'next/server';
import { transitionLoanStatus, LoanStatus, createStatusChangeLog } from '@/lib/utils/loan-status';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await params;
    const body = await request.json();
    const { verifiedBy, notes } = body;
    
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

    const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
    
    try {
      console.log(`Moving loan application ${applicationId} to verification`);
      
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
          
          // Validate current status - should be pending before verification
          const currentStatus = application.status as LoanStatus;
          console.log(`Current application status: ${currentStatus}`);
          
          // Check if we can transition to verification
          const statusTransition = transitionLoanStatus(currentStatus, 'verification');
          if (!statusTransition.success) {
            return NextResponse.json({
              success: false,
              error: `Cannot move to verification from current status '${currentStatus}'. ${statusTransition.error}`,
              code: 'INVALID_STATUS_TRANSITION'
            }, { status: 400 });
          }
          
          // Update application status to verification
          const updateApplicationResponse = await fetch(`${backendUrl}/loan_applications?id=eq.${applicationId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': `${process.env.API_KEY || ''}`,
              'Authorization': `Bearer ${process.env.API_KEY || ''}`,
            },
            body: JSON.stringify({ 
              status: 'verification',
              updated_at: new Date().toISOString(),
              verification_notes: notes,
              verified_by: verifiedBy
            })
          });

          console.log(`Application verification response status: ${updateApplicationResponse.status}`);
          
          if (updateApplicationResponse.ok) {
            // Log the status change
            const statusLog = createStatusChangeLog(
              applicationId,
              currentStatus,
              'verification',
              verifiedBy,
              notes || 'Moved to verification stage'
            );

            console.log('Loan application moved to verification successfully');
            return NextResponse.json({
              success: true,
              message: 'Loan application moved to verification stage successfully',
              data: {
                applicationId: applicationId,
                previousStatus: currentStatus,
                newStatus: 'verification',
                verifiedBy,
                notes,
                transition: statusLog
              }
            });
          } else {
            const errorData = await updateApplicationResponse.text();
            console.log('Application verification error:', errorData);
            return NextResponse.json({
              success: false,
              error: 'Failed to update application status to verification',
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
      console.log("Backend verification error:", backendError);
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to backend service',
        details: backendError
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error moving loan to verification:', error);
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