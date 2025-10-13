import { NextRequest, NextResponse } from 'next/server';

interface MessageTemplate {
  id: string;
  name: string;
  type: 'email' | 'whatsapp';
  category: 'payment_reminder' | 'pre_approval' | 'overdue' | 'custom';
  subject?: string;
  body: string;
  html?: string;
  variables: string[];
  enabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// In-memory storage for demo purposes - replace with database
let templates: MessageTemplate[] = [
  {
    id: '1',
    name: 'Payment Reminder - 7 Days Before',
    type: 'email',
    category: 'payment_reminder',
    subject: 'Payment Reminder: {{amount}} due in 7 days',
    body: `Dear {{customerName}},

This is a friendly reminder that your loan payment is coming up.

Loan Details:
- Loan ID: {{loanId}}
- Payment Amount: {{amount}}
- Due Date: {{dueDate}}
- Days Remaining: 7

Please ensure your payment is made on or before the due date to avoid any late fees.

Best regards,
CrediLife Team`,
    html: '',
    variables: ['customerName', 'loanId', 'amount', 'dueDate'],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Payment Reminder - 3 Days Before',
    type: 'email',
    category: 'payment_reminder',
    subject: 'Urgent: Payment Due in 3 Days - {{amount}}',
    body: `Dear {{customerName}},

Your loan payment is due in just 3 days.

Loan Details:
- Loan ID: {{loanId}}
- Payment Amount: {{amount}}
- Due Date: {{dueDate}}

Please make your payment soon to avoid late fees.

Best regards,
CrediLife Team`,
    html: '',
    variables: ['customerName', 'loanId', 'amount', 'dueDate'],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'WhatsApp Payment Reminder',
    type: 'whatsapp',
    category: 'payment_reminder',
    body: `🔔 *Payment Reminder*

Hello {{customerName}},

Your loan payment is due in *{{daysBeforeDue}} days*.

📋 *Loan Details:*
• Loan ID: {{loanId}}
• Amount: {{amount}}
• Due Date: {{dueDate}}

Please ensure timely payment to avoid late fees.

- CrediLife Team`,
    variables: ['customerName', 'loanId', 'amount', 'dueDate', 'daysBeforeDue'],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    name: 'WhatsApp Overdue Notice',
    type: 'whatsapp',
    category: 'overdue',
    body: `🚨 *Overdue Payment Notice*

Hello {{customerName}},

Your loan payment is *{{daysOverdue}} days overdue*.

📋 *Loan Details:*
• Loan ID: {{loanId}}
• Amount: {{amount}}
• Original Due Date: {{dueDate}}

Please make your payment immediately to avoid additional fees.

- CrediLife Team`,
    variables: ['customerName', 'loanId', 'amount', 'dueDate', 'daysOverdue'],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '5',
    name: 'Pre-Approval Email',
    type: 'email',
    category: 'pre_approval',
    subject: 'Your Loan Application is Pre-Approved! - Complete KYC Verification',
    body: `Hi {{customerName}},

Great news! Your loan application has been pre-approved.

To complete the approval process, please verify your KYC documents by clicking the link below:

{{verificationLink}}

Documents Required:
- Government-issued ID
- Proof of Address
- Income Proof

Please complete verification within 48 hours.

Best regards,
CrediLife Team`,
    html: '',
    variables: ['customerName', 'verificationLink'],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      templates: templates
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newTemplate: MessageTemplate = {
      id: Date.now().toString(),
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    templates.push(newTemplate);
    
    return NextResponse.json({
      success: true,
      template: newTemplate
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    const index = templates.findIndex(t => t.id === id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }
    
    templates[index] = {
      ...templates[index],
      ...updates,
      updatedAt: new Date()
    };
    
    return NextResponse.json({
      success: true,
      template: templates[index]
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Template ID required' },
        { status: 400 }
      );
    }
    
    const index = templates.findIndex(t => t.id === id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }
    
    templates.splice(index, 1);
    
    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}