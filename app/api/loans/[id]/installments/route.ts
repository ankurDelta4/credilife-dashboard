import { NextRequest, NextResponse } from 'next/server';
import { formatInstallmentForDisplay } from '@/lib/utils/installments';


export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: loanId } = await params;
    
    if (!loanId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Loan ID is required',
        },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
    
    try {
      // Try to fetch installments from backend
      const response = await fetch(`${backendUrl}/installments?loan_id=eq.${loanId}&order=installment_number`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': `${process.env.API_KEY || ''}`,
          'Authorization': `Bearer ${process.env.API_KEY || ''}`,
        },
      });

      if (response.ok) {
        const installments = await response.json();
        
        // Format installments for display
        const formattedInstallments = installments.map((installment: any) => ({
          ...installment,
          formatted: formatInstallmentForDisplay(installment)
        }));
        console.log("Installments data:", installments);
        // Calculate summary
        const summary = {
          totalInstallments: installments.length,
          paidInstallments: installments.filter((i: any) => i.status === 'paid').length,
          pendingInstallments: installments.filter((i: any) => i.status === 'pending').length,
          overdueInstallments: installments.filter((i: any) => i.status === 'overdue').length,
          totalAmountDue: installments.reduce((sum: number, i: any) => sum + i.amount_due, 0),
          totalAmountPaid: installments.reduce((sum: number, i: any) => sum + i.amount_paid, 0),
          nextDueDate: installments.find((i: any) => i.status === 'pending')?.due_date || null,
          nextDueAmount: installments.find((i: any) => i.status === 'pending')?.amount_due || 0,
        };
        
        return NextResponse.json({
          success: true,
          data: formattedInstallments,
          summary,
        });
      }
    } catch (backendError) {
      console.error('Backend fetch error:', backendError);
    }

    // Return no data available instead of mock data
    return NextResponse.json({
      success: true,
      data: [],
      summary: {
        totalInstallments: 0,
        paidInstallments: 0,
        pendingInstallments: 0,
        overdueInstallments: 0,
        totalAmountDue: 0,
        totalAmountPaid: 0,
        nextDueDate: null,
        nextDueAmount: 0,
      },
      message: "No installments data available",
      isEmpty: true,
    });

  } catch (error) {
    console.error('Error fetching installments:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}