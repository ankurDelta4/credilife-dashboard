import { NextRequest, NextResponse } from 'next/server';
import notificationService, { NotificationConfig } from '@/lib/services/notifications';

let currentConfig: NotificationConfig = {};

export async function GET(request: NextRequest) {
  try {
    const status = notificationService.getServiceStatus();
    
    return NextResponse.json({
      success: true,
      config: {
        email: {
          enabled: status.email,
          host: currentConfig.email?.host || process.env.EMAIL_HOST || '',
          port: currentConfig.email?.port || parseInt(process.env.EMAIL_PORT || '587'),
          secure: currentConfig.email?.secure || process.env.EMAIL_SECURE === 'true',
        },
        whatsapp: {
          enabled: status.whatsapp,
          accountSid: currentConfig.whatsapp?.accountSid ? '***' + currentConfig.whatsapp.accountSid.slice(-4) : '',
          fromNumber: currentConfig.whatsapp?.fromNumber || process.env.TWILIO_WHATSAPP_FROM || '',
        },
      },
      status,
    });
  } catch (error) {
    console.error('Error fetching notification config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notification configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, whatsapp } = body;

    const config: NotificationConfig = {};

    if (email) {
      config.email = {
        host: email.host || process.env.EMAIL_HOST || '',
        port: email.port || parseInt(process.env.EMAIL_PORT || '587'),
        secure: email.secure || process.env.EMAIL_SECURE === 'true',
        auth: {
          user: email.user || process.env.EMAIL_USER || '',
          pass: email.pass || process.env.EMAIL_PASS || '',
        },
      };
    }

    if (whatsapp) {
      config.whatsapp = {
        accountSid: whatsapp.accountSid || process.env.TWILIO_ACCOUNT_SID || '',
        authToken: whatsapp.authToken || process.env.TWILIO_AUTH_TOKEN || '',
        fromNumber: whatsapp.fromNumber || process.env.TWILIO_WHATSAPP_FROM || '',
      };
    }

    const initResult = await notificationService.initialize(config);
    
    if (initResult.email || initResult.whatsapp) {
      currentConfig = config;
    }

    return NextResponse.json({
      success: true,
      services: initResult,
      message: 'Notification services configured',
    });
  } catch (error) {
    console.error('Error configuring notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to configure notification services' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { testEmail, testPhone, testMessage } = body;

    const results = [];

    if (testEmail && currentConfig.email) {
      const { sendEmail } = await import('@/lib/services/notifications');
      const emailResult = await sendEmail({
        to: testEmail,
        subject: 'Test Notification from CrediLife',
        body: testMessage || 'This is a test notification to verify email configuration.',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Test Notification</h2>
            <p>${testMessage || 'This is a test notification to verify email configuration.'}</p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              If you received this email, your email notifications are configured correctly.
            </p>
          </div>
        `,
      });
      results.push({ channel: 'email', ...emailResult });
    }

    if (testPhone && currentConfig.whatsapp) {
      const { sendWhatsAppMessage } = await import('@/lib/services/notifications');
      const whatsappResult = await sendWhatsAppMessage({
        to: testPhone,
        message: `🔔 *Test Notification*\n\n${testMessage || 'This is a test notification to verify WhatsApp configuration.'}\n\n✅ Your WhatsApp notifications are configured correctly.`,
      });
      results.push({ channel: 'whatsapp', ...whatsappResult });
    }

    return NextResponse.json({
      success: true,
      results,
      message: 'Test notifications sent',
    });
  } catch (error) {
    console.error('Error sending test notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send test notifications' },
      { status: 500 }
    );
  }
}