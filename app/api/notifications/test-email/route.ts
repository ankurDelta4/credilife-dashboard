import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, config } = body;
    
    
    if (!to || !config) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate the email address
    if (!to.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address format' },
        { status: 400 }
      );
    }
    
    // Dynamic import for nodemailer to work with Turbopack
    const nodemailer = await import('nodemailer');
    
    // Create transporter with the provided config
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: parseInt(config.smtpPort),
      secure: parseInt(config.smtpPort) === 465, // true for 465, false for other ports
      auth: {
        user: config.username,
        pass: config.password
      }
    });
    
    // Test email content
    const mailOptions = {
      from: config.fromEmail || config.username,
      to: to,
      subject: 'CrediLife Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #06888D; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2>Test Email from CrediLife</h2>
          </div>
          <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>This is a test email to verify your email configuration.</p>
            <p><strong>Configuration Details:</strong></p>
            <ul>
              <li>SMTP Host: ${config.smtpHost}</li>
              <li>SMTP Port: ${config.smtpPort}</li>
              <li>TLS/SSL: ${config.useTLS ? 'Enabled' : 'Disabled'}</li>
            </ul>
            <p>If you received this email, your configuration is working correctly!</p>
          </div>
        </div>
      `
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
    
    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully'
    });
    
  } catch (error: any) {
    console.error('[TEST EMAIL] Error sending test email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send test email',
        details: error.message
      },
      { status: 500 }
    );
  }
}