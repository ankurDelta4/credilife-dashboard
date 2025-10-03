import { NextRequest, NextResponse } from 'next/server';
import notificationService, { LoanPayment } from '@/lib/services/notifications';
import { addDays } from 'date-fns';

function getMockPayments(): LoanPayment[] {
  const today = new Date();
  
  return [
    {
      loanId: 'LOAN001',
      customerId: 'CUST001',
      customerName: 'Ankur Saini Doe',
      customerEmail: 'ankur.delta4infotech@gmail.com',
      customerPhone: '+1234567890',
      amount: 1500,
      dueDate: addDays(today, 7),
      status: 'upcoming',
    }
  ];
}

async function fetchUpcomingPayments(): Promise<LoanPayment[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/loans`);
    if (!response.ok) throw new Error('Failed to fetch loans');
    
    const data = await response.json();
    const loans = data.loans || [];
    
    const payments: LoanPayment[] = [];
    
    for (const loan of loans) {
      if (loan.status === 'approved' && loan.nextPaymentDate) {
        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/users/${loan.userId}`);
        const userData = await userResponse.json();
        
        const dueDate = new Date(loan.nextPaymentDate);
        const today = new Date();
        const daysDiff = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        payments.push({
          loanId: loan.id.toString(),
          customerId: loan.userId.toString(),
          customerName: userData.name || 'Customer',
          customerEmail: userData.email || '',
          customerPhone: userData.phone || '',
          amount: loan.monthlyPayment || 0,
          dueDate: dueDate,
          status: daysDiff > 0 ? 'upcoming' : daysDiff === 0 ? 'due_today' : 'overdue',
        });
      }
    }
    
    return payments;
  } catch (error) {
    console.error('Error fetching payments:', error);
    return []; // Return empty array instead of mock data
  }
}

export async function GET(request: NextRequest) {
  try {
    const payments = await fetchUpcomingPayments();
    
    return NextResponse.json({
      success: true,
      data: payments,
      count: payments.length,
    });
  } catch (error) {
    console.error('Error fetching upcoming payments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch upcoming payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { useMockData = false, specificLoanIds = [] } = body;

    let payments = useMockData ? getMockPayments() : await fetchUpcomingPayments();

    if (specificLoanIds.length > 0) {
      payments = payments.filter(p => specificLoanIds.includes(p.loanId));
    }

    const results = await notificationService.processScheduledReminders(payments);

    return NextResponse.json({
      success: true,
      summary: {
        totalPayments: payments.length,
        remindersProcessed: results.processed,
        notificationsSent: results.sent,
        notificationsFailed: results.failed,
      },
      results: results.results,
      message: `Processed ${results.processed} reminders, sent ${results.sent} notifications`,
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send payment reminders' },
      { status: 500 }
    );
  }
}