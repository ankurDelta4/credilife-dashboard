import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get agent ID and pagination params from query params
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    if (!agentId) {
      return NextResponse.json({
        success: false,
        error: 'Agent ID is required'
      }, { status: 400 });
    }

    const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
    const apiKey = process.env.API_KEY || '';

    // Build query with search filter
    let query = `${backendUrl}/users?assigned_agent_id=eq.${agentId}&select=id,name,email,phone_number,unique_id,created_at`;

    // Add search filter if provided (search by email or unique_id)
    if (search) {
      query += `&or=(email.ilike.*${search}*,unique_id.ilike.*${search}*)`;
    }

    // Fetch total count for pagination
    const countResponse = await fetch(
      query.replace('select=id,name,email,phone_number,unique_id,created_at', 'select=count'),
      {
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'count=exact'
        }
      }
    );

    const countHeader = countResponse.headers.get('content-range');
    const totalCount = countHeader ? parseInt(countHeader.split('/')[1]) : 0;

    // Calculate pagination
    const offset = (page - 1) * limit;
    query += `&limit=${limit}&offset=${offset}&order=created_at.desc`;

    // Fetch users assigned to this agent with their loan information
    const usersResponse = await fetch(query, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!usersResponse.ok) {
      const errorText = await usersResponse.text();
      console.error('[AGENT API] Error fetching users:', errorText);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch assigned customers'
      }, { status: usersResponse.status });
    }

    const users = await usersResponse.json();

    // For each user, fetch their loan information (non-sensitive data only)
    const customersWithLoans = await Promise.all(
      users.map(async (user: any) => {
        try {
          const loansResponse = await fetch(
            `${backendUrl}/loans?user_id=eq.${user.id}&select=id,principal_amount,start_date,end_date,status,amount_paid,total_repayment,created_at`,
            {
              headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );

          let loans = [];
          if (loansResponse.ok) {
            loans = await loansResponse.json();
          }

          // Calculate summary statistics
          const activeLoans = loans.filter((loan: any) => loan.status === 'running');
          const totalPrincipal = loans.reduce((sum: number, loan: any) =>
            sum + (parseFloat(loan.principal_amount) || 0), 0
          );
          const totalPaid = loans.reduce((sum: number, loan: any) =>
            sum + (parseFloat(loan.amount_paid) || 0), 0
          );
          const totalDue = loans.reduce((sum: number, loan: any) =>
            sum + (parseFloat(loan.total_repayment) || 0), 0
          );

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone_number: user.phone_number,
            unique_id: user.unique_id,
            customer_since: user.created_at,
            total_loans: loans.length,
            active_loans: activeLoans.length,
            total_principal: totalPrincipal,
            total_paid: totalPaid,
            total_due: totalDue,
            outstanding_balance: totalDue - totalPaid,
            loans: loans.map((loan: any) => ({
              id: loan.id,
              principal_amount: loan.principal_amount,
              total_repayment: loan.total_repayment,
              amount_paid: loan.amount_paid,
              outstanding: (parseFloat(loan.total_repayment) || 0) - (parseFloat(loan.amount_paid) || 0),
              start_date: loan.start_date,
              end_date: loan.end_date,
              status: loan.status,
              created_at: loan.created_at
            }))
          };
        } catch (error) {
          console.error(`Error fetching loans for user ${user.id}:`, error);
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone_number: user.phone_number,
            unique_id: user.unique_id,
            customer_since: user.created_at,
            total_loans: 0,
            active_loans: 0,
            total_principal: 0,
            total_paid: 0,
            total_due: 0,
            outstanding_balance: 0,
            loans: []
          };
        }
      })
    );

    // Sort by outstanding balance (highest first)
    customersWithLoans.sort((a, b) => b.outstanding_balance - a.outstanding_balance);

    return NextResponse.json({
      success: true,
      data: {
        customers: customersWithLoans,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        summary: {
          total_customers: totalCount,
          total_active_loans: customersWithLoans.reduce((sum, c) => sum + c.active_loans, 0),
          total_outstanding: customersWithLoans.reduce((sum, c) => sum + c.outstanding_balance, 0)
        }
      }
    });

  } catch (error) {
    console.error('Error in agent customers API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
