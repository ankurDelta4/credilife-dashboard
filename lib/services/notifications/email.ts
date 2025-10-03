import nodemailer from 'nodemailer';
import { format } from 'date-fns';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

let transporter: nodemailer.Transporter | null = null;

export async function initializeEmailService(config: EmailConfig) {
  try {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });

    await transporter.verify();
    console.log('Email service initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize email service:', error);
    return false;
  }
}

export async function sendEmail(notification: EmailNotification) {
  if (!transporter) {
    throw new Error('Email service not initialized');
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'notifications@credilife.com',
      to: notification.to,
      subject: notification.subject,
      text: notification.body,
      html: notification.html || notification.body,
    });

    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: error };
  }
}

export function generatePaymentReminderEmail(
  customerName: string,
  loanId: string,
  amount: number,
  dueDate: Date,
  daysBeforeDue: number
): EmailNotification {
  const formattedDate = format(dueDate, 'MMMM dd, yyyy');
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);

  let subject: string;
  let body: string;

  if (daysBeforeDue > 0) {
    subject = `Payment Reminder: ${formattedAmount} due in ${daysBeforeDue} days`;
    body = `
Dear ${customerName},

This is a friendly reminder that your loan payment is coming up.

Loan Details:
- Loan ID: ${loanId}
- Payment Amount: ${formattedAmount}
- Due Date: ${formattedDate}
- Days Remaining: ${daysBeforeDue}

Please ensure your payment is made on or before the due date to avoid any late fees.

If you have any questions or need assistance, please contact our support team.

Best regards,
CrediLife Team
    `;
  } else if (daysBeforeDue === 0) {
    subject = `Payment Due Today: ${formattedAmount}`;
    body = `
Dear ${customerName},

This is a reminder that your loan payment is due today.

Loan Details:
- Loan ID: ${loanId}
- Payment Amount: ${formattedAmount}
- Due Date: ${formattedDate} (TODAY)

Please make your payment as soon as possible to avoid late fees.

If you have any questions or need assistance, please contact our support team immediately.

Best regards,
CrediLife Team
    `;
  } else {
    subject = `Overdue Payment Notice: ${formattedAmount}`;
    body = `
Dear ${customerName},

Your loan payment is now overdue.

Loan Details:
- Loan ID: ${loanId}
- Payment Amount: ${formattedAmount}
- Original Due Date: ${formattedDate}
- Days Overdue: ${Math.abs(daysBeforeDue)}

Please make your payment immediately to avoid additional late fees and potential impact to your credit.

If you are experiencing financial difficulties, please contact us to discuss payment options.

Best regards,
CrediLife Team
    `;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #06888D; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 20px; background-color: #f9fafb; }
    .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #06888D; }
    .details h3 { margin-top: 0; color: #06888D; }
    .details p { margin: 5px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; background-color: #f3f4f6; border-radius: 0 0 8px 8px; }
    .alert { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .warning { background-color: #f0f9ff; border-left: 4px solid #06888D; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .cta-button { background-color: #06888D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; }
    .cta-button:hover { background-color: #055a5e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">CrediLife</h1>
      <h2 style="margin: 10px 0 0 0; font-size: 20px; font-weight: normal;">${subject}</h2>
    </div>
    <div class="content">
      <p>Dear ${customerName},</p>
      ${
        daysBeforeDue > 0
          ? `<div class="warning"><strong>Reminder:</strong> Your loan payment is due in ${daysBeforeDue} days.</div>`
          : daysBeforeDue === 0
          ? `<div class="alert"><strong>Payment Due Today:</strong> Your loan payment is due TODAY.</div>`
          : `<div class="alert"><strong>Overdue Notice:</strong> Your loan payment is ${Math.abs(daysBeforeDue)} days overdue.</div>`
      }
      <div class="details">
        <h3>Loan Payment Details</h3>
        <p><strong>Loan ID:</strong> ${loanId}</p>
        <p><strong>Payment Amount:</strong> ${formattedAmount}</p>
        <p><strong>Due Date:</strong> ${formattedDate}</p>
        ${daysBeforeDue > 0 ? `<p><strong>Days Remaining:</strong> ${daysBeforeDue}</p>` : ''}
        ${daysBeforeDue < 0 ? `<p><strong>Days Overdue:</strong> ${Math.abs(daysBeforeDue)}</p>` : ''}
      </div>
      <p>Please ensure your payment is processed on time to avoid any late fees or impact to your credit standing.</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="#" class="cta-button">Make Payment</a>
      </div>
      <p style="font-size: 14px; color: #6b7280;">If you have any questions or need assistance, please contact our support team at support@credilife.com or call (555) 123-4567.</p>
    </div>
    <div class="footer">
      <p><strong>CrediLife Financial Services</strong></p>
      <p>© 2024 CrediLife. All rights reserved.</p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;

  return {
    to: '',
    subject,
    body,
    html,
  };
}