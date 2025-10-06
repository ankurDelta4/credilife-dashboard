import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getPreApprovalEmailTemplate } from '@/lib/services/notifications/email-templates';

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getEmailTransporter() {
  if (!transporter) {
    // Use environment variables for email configuration
    const emailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
      },
    };

    // Only create transporter if credentials are provided
    if (emailConfig.auth.user && emailConfig.auth.pass) {
      transporter = nodemailer.createTransport(emailConfig);
    }
  }
  return transporter;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, userName, userEmail, chatLink } = body;

    // Validate required fields
    if (!userName || !userEmail || !chatLink) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: userName, userEmail, or chatLink' 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email address format' 
        },
        { status: 400 }
      );
    }

    // Get email template
    const emailTemplate = getPreApprovalEmailTemplate(userName, chatLink);

    // Check if email is configured
    const emailTransporter = getEmailTransporter();
    
    if (!emailTransporter) {
      console.warn('Email not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.');
      
      // Log the email that would have been sent
      console.log('Pre-approval email (not sent - email not configured):');
      console.log('To:', userEmail);
      console.log('Subject:', emailTemplate.subject);
      console.log('Application ID:', applicationId);
      console.log('Chat Link:', chatLink);
      
      return NextResponse.json({
        success: false,
        warning: 'Email service not configured. Please configure email settings.',
        emailData: {
          to: userEmail,
          subject: emailTemplate.subject,
          applicationId,
          chatLink
        }
      });
    }

    // Send email
    try {
      const info = await emailTransporter.sendMail({
        from: process.env.EMAIL_FROM || `"CrediLife" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html,
      });

      console.log('Pre-approval email sent successfully:', info.messageId);

      // Store email log in database (optional)
      const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
      const apiKey = process.env.API_KEY || '';
      
      // Log the email send event
      try {
        await fetch(`${backendUrl}/email_logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            application_id: applicationId,
            recipient_email: userEmail,
            email_type: 'pre_approval',
            subject: emailTemplate.subject,
            status: 'sent',
            message_id: info.messageId,
            chat_link: chatLink,
            sent_at: new Date().toISOString()
          })
        });
      } catch (logError) {
        // Don't fail if logging fails
        console.error('Failed to log email send event:', logError);
      }

      return NextResponse.json({
        success: true,
        message: 'Pre-approval email sent successfully',
        messageId: info.messageId,
        data: {
          to: userEmail,
          subject: emailTemplate.subject,
          applicationId,
          chatLink
        }
      });

    } catch (emailError: any) {
      console.error('Failed to send email:', emailError);
      
      // Common email errors and user-friendly messages
      let errorMessage = 'Failed to send email';
      
      if (emailError.code === 'EAUTH') {
        errorMessage = 'Email authentication failed. Please check email credentials.';
      } else if (emailError.code === 'ECONNECTION') {
        errorMessage = 'Could not connect to email server. Please check email settings.';
      } else if (emailError.code === 'ESOCKET') {
        errorMessage = 'Email server connection timeout. Please try again.';
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? emailError.message : undefined
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in pre-approval email API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}