import { NextRequest, NextResponse } from 'next/server';

// Mock loans database (same as in route.ts - in real app, use a shared database)
let loans = [
    {
        id: 1,
        userId: 2,
        amount: 50000,
        purpose: 'Home Purchase',
        status: 'pending',
        interestRate: 3.5,
        termMonths: 360,
        monthlyPayment: 224.51,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
    },
    {
        id: 2,
        userId: 2,
        amount: 15000,
        purpose: 'Car Purchase',
        status: 'approved',
        interestRate: 4.2,
        termMonths: 60,
        monthlyPayment: 277.89,
        createdAt: '2024-01-16T14:20:00Z',
        updatedAt: '2024-01-17T09:15:00Z'
    },
    {
        id: 3,
        userId: 3,
        amount: 25000,
        purpose: 'Business Expansion',
        status: 'rejected',
        interestRate: 5.8,
        termMonths: 120,
        monthlyPayment: 275.12,
        createdAt: '2024-01-17T09:15:00Z',
        updatedAt: '2024-01-18T11:45:00Z'
    }
];

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const loanId = parseInt(id);

        if (isNaN(loanId)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid loan ID',
                    code: 'INVALID_ID'
                },
                { status: 400 }
            );
        }

        const loan = loans.find(l => l.id === loanId);

        if (!loan) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Loan not found',
                    code: 'LOAN_NOT_FOUND'
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: { loan },
            message: 'Loan retrieved successfully'
        });

    } catch (error) {
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

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const loanId = parseInt(id);
        const body = await request.json();

        if (isNaN(loanId)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid loan ID',
                    code: 'INVALID_ID'
                },
                { status: 400 }
            );
        }

        const loanIndex = loans.findIndex(l => l.id === loanId);

        if (loanIndex === -1) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Loan not found',
                    code: 'LOAN_NOT_FOUND'
                },
                { status: 404 }
            );
        }

        // Update loan
        const updatedLoan = {
            ...loans[loanIndex],
            ...body,
            id: loanId, // Ensure ID doesn't change
            createdAt: loans[loanIndex].createdAt, // Preserve creation date
            updatedAt: new Date().toISOString()
        };

        loans[loanIndex] = updatedLoan;

        return NextResponse.json({
            success: true,
            data: { loan: updatedLoan },
            message: 'Loan updated successfully'
        });

    } catch (error) {
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

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const loanId = parseInt(id);

        if (isNaN(loanId)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid loan ID',
                    code: 'INVALID_ID'
                },
                { status: 400 }
            );
        }

        const loanIndex = loans.findIndex(l => l.id === loanId);

        if (loanIndex === -1) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Loan not found',
                    code: 'LOAN_NOT_FOUND'
                },
                { status: 404 }
            );
        }

        // Remove loan
        const deletedLoan = loans.splice(loanIndex, 1)[0];

        return NextResponse.json({
            success: true,
            data: { loan: deletedLoan },
            message: 'Loan deleted successfully'
        });

    } catch (error) {
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
