export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export function getPreApprovalEmailTemplate(
  userName: string,
  chatLink: string
): EmailTemplate {
  const subject = 'Your Loan Application is Pre-Approved! - Complete KYC Verification';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            padding: 15px 30px;
            background: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
          }
          .button:hover {
            background: #45a049;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
          .highlight {
            background: #fff3cd;
            padding: 15px;
            border-left: 4px solid #ffc107;
            margin: 20px 0;
          }
          .steps {
            background: white;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .step {
            margin: 10px 0;
            padding-left: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Congratulations!</h1>
          <h2>Your Loan is Pre-Approved</h2>
        </div>
        
        <div class="content">
          <p>Hi <strong>${userName}</strong>,</p>
          
          <p>Great news! Your loan application has been <strong>pre-approved</strong>. You're just one step away from final approval.</p>
          
          <div class="highlight">
            <strong>⚠️ Important:</strong> To complete the approval process, you need to verify your KYC documents.
          </div>
          
          <div class="steps">
            <h3>Next Steps:</h3>
            <div class="step">✅ 1. Click the link below to access our secure verification portal</div>
            <div class="step">✅ 2. Upload your KYC documents</div>
            <div class="step">✅ 3. Our team will verify your documents</div>
            <div class="step">✅ 4. Receive final approval within 24-48 hours</div>
          </div>
          
          <p><strong>Share your documents for verification:</strong></p>
          
          <center>
            <a href="${chatLink}" class="button" style="color: white;">
              Complete KYC Verification
            </a>
          </center>
          
          <p style="text-align: center; color: #666; font-size: 14px;">
            Or copy this link: <br>
            <code style="background: #f0f0f0; padding: 5px; border-radius: 3px;">${chatLink}</code>
          </p>
          
          <p><strong>Documents Required:</strong></p>
          <ul>
            <li>Government-issued ID (Passport/Driver's License/National ID)</li>
            <li>Proof of Address (Utility Bill/Bank Statement)</li>
            <li>Income Proof (Salary Slips/Bank Statements)</li>
            <li>Employment Letter (if employed)</li>
          </ul>
          
          <p style="color: #d9534f;">
            <strong>⏰ Time Sensitive:</strong> Please complete your KYC verification within 48 hours to avoid delays in loan disbursement.
          </p>
        </div>
        
        <div class="footer">
          <p><strong>Need Help?</strong></p>
          <p>If you have any questions or face any issues, please don't hesitate to contact our support team.</p>
          <p>Email: support@credilife.com | Phone: 1-800-CREDILIFE</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p>© 2024 CrediLife. All rights reserved.</p>
          <p style="font-size: 10px; color: #999;">
            This is an automated email. Please do not reply directly to this email.
          </p>
        </div>
      </body>
    </html>
  `;
  
  const text = `
Hi ${userName},

Great news! Your loan application has been PRE-APPROVED!

To complete the approval process, you need to verify your KYC documents.

NEXT STEPS:
1. Click the link below to access our secure verification portal
2. Upload your KYC documents
3. Our team will verify your documents
4. Receive final approval within 24-48 hours

Share your documents for verification on this link:
${chatLink}

DOCUMENTS REQUIRED:
- Government-issued ID (Passport/Driver's License/National ID)
- Proof of Address (Utility Bill/Bank Statement)
- Income Proof (Salary Slips/Bank Statements)
- Employment Letter (if employed)

⏰ TIME SENSITIVE: Please complete your KYC verification within 48 hours to avoid delays in loan disbursement.

Need Help?
If you have any questions or face any issues, please contact our support team.
Email: support@credilife.com | Phone: 1-800-CREDILIFE

Best regards,
The CrediLife Team

© 2024 CrediLife. All rights reserved.
This is an automated email. Please do not reply directly to this email.
  `.trim();
  
  return { subject, html, text };
}

export function getPaymentReminderTemplate(
  customerName: string,
  amount: number,
  dueDate: string,
  loanId: string
): EmailTemplate {
  const subject = `Payment Reminder - Amount Due: $${amount.toLocaleString()}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
          .amount { font-size: 24px; color: #28a745; font-weight: bold; }
          .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Payment Reminder</h2>
          </div>
          <p>Dear ${customerName},</p>
          <p>This is a friendly reminder that your loan payment is due:</p>
          <p class="amount">Amount Due: $${amount.toLocaleString()}</p>
          <p><strong>Due Date:</strong> ${dueDate}</p>
          <p><strong>Loan ID:</strong> ${loanId}</p>
          <p>Please ensure timely payment to maintain your good standing.</p>
          <p><a href="#" class="button">Make Payment</a></p>
          <p>Thank you for your prompt attention to this matter.</p>
          <p>Best regards,<br>CrediLife Team</p>
        </div>
      </body>
    </html>
  `;
  
  const text = `
Payment Reminder

Dear ${customerName},

This is a friendly reminder that your loan payment is due:

Amount Due: $${amount.toLocaleString()}
Due Date: ${dueDate}
Loan ID: ${loanId}

Please ensure timely payment to maintain your good standing.

Thank you for your prompt attention to this matter.

Best regards,
CrediLife Team
  `.trim();
  
  return { subject, html, text };
}