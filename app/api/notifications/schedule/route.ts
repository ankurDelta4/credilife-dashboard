import { NextRequest, NextResponse } from 'next/server';
import { getEmailConfig } from '../../settings/email/route';

// In-memory storage for scheduled notifications (for demo purposes)
const scheduledNotifications: any[] = [];
let notificationInterval: NodeJS.Timeout | null = null;
let scheduleConfiguration: any = {
  scheduleType: 'interval',
  intervalMs: 60000,
  daysBeforeDue: [7, 3],
  reminderSchedules: []
};

// Function to get reminder schedules from database
async function fetchReminderSchedules() {
  try {
    const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
    const apiKey = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY || '';
    
    const response = await fetch(`${backendUrl}/reminder_schedules?is_enabled=eq.true&order=priority.desc&select=*`, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const schedules = await response.json();
      
      // Transform database format to scheduler format
      const transformedSchedules = schedules.map((schedule: any) => ({
        days: Math.abs(schedule.days_offset),
        type: schedule.schedule_type,
        email: schedule.email_enabled,
        whatsapp: schedule.whatsapp_enabled,
        sms: schedule.sms_enabled,
        name: schedule.name
      }));
      
      return transformedSchedules;
    }
    
    // Fallback to default schedules if database query fails
    return [
      { days: 7, type: 'before', email: true, whatsapp: false, name: '7 Days Before Due' },
      { days: 3, type: 'before', email: true, whatsapp: false, name: '3 Days Before Due' },
      { days: 0, type: 'due', email: true, whatsapp: false, name: 'Due Date' }
    ];
  } catch (error) {
    console.error('[SCHEDULER] Failed to fetch reminder schedules:', error);
    // Return default schedules
    return [
      { days: 7, type: 'before', email: true, whatsapp: false, name: '7 Days Before Due' },
      { days: 3, type: 'before', email: true, whatsapp: false, name: '3 Days Before Due' },
      { days: 0, type: 'due', email: true, whatsapp: false, name: 'Due Date' }
    ];
  }
}

// Function to get email configuration
async function fetchEmailConfig() {
  try {
    const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
    const apiKey = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY || '';
    
    const response = await fetch(`${backendUrl}/email_configurations?is_active=eq.true&select=*`, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const configs = await response.json();
      if (configs.length > 0) {
        const config = configs[0];
        return {
          smtpHost: config.smtp_host,
          smtpPort: config.smtp_port.toString(),
          username: config.username,
          password: config.password,
          fromEmail: config.from_email,
          fromName: config.from_name,
          useTLS: config.use_tls
        };
      }
    }
    
    // Fallback to hardcoded Mailtrap config if no database config found
    return {
      smtpHost: 'sandbox.smtp.mailtrap.io',
      smtpPort: '587',
      username: 'f089b4f479d48f',
      password: '822f95cdb12df4',
      fromEmail: 'noreply@credilife.com',
      fromName: 'CrediLife',
      useTLS: true
    };
  } catch (error) {
    console.error('[SCHEDULER] Failed to fetch email config:', error);
    return null;
  }
}

// Function to send email notification
async function sendEmailNotification(to: string, subject: string, body: string, html?: string) {
  const config = await fetchEmailConfig();
  
  if (!config) {
    console.error('[SCHEDULER] Email configuration not available');
    return false;
  }
  
  
  if (!config.smtpHost) {
    console.error('[SCHEDULER] Email configuration not set - missing SMTP host');
    return false;
  }
  
  try {
    // Dynamic import for nodemailer to work with Turbopack
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: parseInt(config.smtpPort),
      secure: parseInt(config.smtpPort) === 465, // true for 465, false for other ports
      auth: config.username && config.password ? {
        user: config.username,
        pass: config.password
      } : undefined
    });
    
    const mailOptions = {
      from: config.fromEmail || 'noreply@credilife.com',
      to,
      subject,
      text: body,
      html: html || body
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('[SCHEDULER] Failed to send email:', error);
    return false;
  }
}

// Function to check and send due notifications
async function checkAndSendNotifications() {
  const now = new Date();
  
  // Get all loans with upcoming payments
  try {
    const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
    const apiKey = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY || '';
    
    // Fetch upcoming installments
    const response = await fetch(`${backendUrl}/installments?status=eq.pending&select=*`, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (response.ok) {
      const installments = await response.json();
      
      if (installments.length === 0) {
        return;
      }
      
      // Check each installment for notification needs
      for (const installment of installments) {
        const dueDate = new Date(installment.due_date);
        const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Fetch reminder schedules from database
        const schedules = await fetchReminderSchedules();
        
        
        // Check if any schedule matches current day difference
        const matchingSchedule = schedules.find(schedule => {
          return (schedule.type === 'before' && daysDiff > 0 && daysDiff === schedule.days) ||
                 (schedule.type === 'due' && daysDiff === 0) ||
                 (schedule.type === 'after' && daysDiff < 0 && Math.abs(daysDiff) === schedule.days);
        });
        
        if (matchingSchedule && matchingSchedule.email) {
          // Fetch loan and user details
          const loanResponse = await fetch(`${backendUrl}/loans?id=eq.${installment.loan_id}&select=*,users(*)`, {
            headers: {
              'apikey': process.env.API_KEY || '',
              'Authorization': `Bearer ${process.env.API_KEY || ''}`
            }
          });
          
          if (loanResponse.ok) {
            const loans = await loanResponse.json();
            if (loans.length > 0) {
              const loan = loans[0];
              const user = loan.users;
              
              if (user && user.email) {
                let subject = '';
                let timeMessage = '';
                
                if (matchingSchedule.type === 'before') {
                  subject = `Payment Reminder: $${installment.amount_due} due in ${daysDiff} days`;
                  timeMessage = `This is a friendly reminder that your loan payment is coming up in ${daysDiff} days.`;
                } else if (matchingSchedule.type === 'due') {
                  subject = `Payment Due Today: $${installment.amount_due}`;
                  timeMessage = `Your loan payment is due today.`;
                } else if (matchingSchedule.type === 'after') {
                  subject = `Payment Overdue: $${installment.amount_due} - ${Math.abs(daysDiff)} days overdue`;
                  timeMessage = `Your loan payment is ${Math.abs(daysDiff)} days overdue. Please make your payment as soon as possible.`;
                }
                
                const body = `Dear ${user.name || 'Customer'},

${timeMessage}

Loan Details:
- Loan ID: ${loan.id}
- Payment Amount: $${installment.amount_due}
- Due Date: ${dueDate.toLocaleDateString()}
${matchingSchedule.type === 'before' ? `- Days Remaining: ${daysDiff}` : matchingSchedule.type === 'after' ? `- Days Overdue: ${Math.abs(daysDiff)}` : ''}

Please ensure you have sufficient funds available for the payment.

Thank you,
CrediLife Team`;
                
                const html = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: ${matchingSchedule.type === 'after' ? '#dc2626' : '#06888D'}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                      <h2>${matchingSchedule.type === 'after' ? 'Payment Overdue' : matchingSchedule.type === 'due' ? 'Payment Due Today' : 'Payment Reminder'}</h2>
                    </div>
                    <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px;">
                      <p>Dear ${user.name || 'Customer'},</p>
                      <p>${timeMessage}</p>
                      <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: ${matchingSchedule.type === 'after' ? '#dc2626' : '#06888D'};">Loan Details:</h3>
                        <ul>
                          <li><strong>Loan ID:</strong> ${loan.id}</li>
                          <li><strong>Payment Amount:</strong> $${installment.amount_due}</li>
                          <li><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</li>
                          ${matchingSchedule.type === 'before' ? `<li><strong>Days Remaining:</strong> ${daysDiff}</li>` : matchingSchedule.type === 'after' ? `<li><strong>Days Overdue:</strong> ${Math.abs(daysDiff)}</li>` : ''}
                        </ul>
                      </div>
                      <p>${matchingSchedule.type === 'after' ? 'Please make your payment as soon as possible to avoid additional fees.' : 'Please ensure you have sufficient funds available for the payment.'}</p>
                      <p>Thank you,<br>CrediLife Team</p>
                    </div>
                  </div>
                `;
                
                await sendEmailNotification(user.email, subject, body, html);
              }
            }
          }
        }
      }
    } else {
      console.error(`[SCHEDULER] Failed to fetch installments: ${response.status}`);
    }
  } catch (error) {
    console.error('[SCHEDULER] Error checking notifications:', error);
  }
}

// Start the notification scheduler
function startScheduler(config?: any) {
  if (notificationInterval) {
    clearInterval(notificationInterval);
  }
  
  // Update configuration if provided
  if (config) {
    scheduleConfiguration = { ...scheduleConfiguration, ...config };
  }
  
  const { scheduleType, intervalMs, dailyTime, daysBeforeDue } = scheduleConfiguration;
  
  if (scheduleType === 'interval') {
    // Run at regular intervals
    const interval = intervalMs || 60000;
    notificationInterval = setInterval(() => {
      checkAndSendNotifications();
    }, interval);
  } else if (scheduleType === 'daily') {
    // Run daily at specific time
    const runDailyCheck = () => {
      const now = new Date();
      const [hours, minutes] = (dailyTime || '15:00').split(':').map(Number);
      const nextRun = new Date(now);
      nextRun.setHours(hours, minutes, 0, 0);
      
      if (nextRun <= now) {
        // If time has passed today, schedule for tomorrow
        nextRun.setDate(nextRun.getDate() + 1);
      }
      
      const msUntilRun = nextRun.getTime() - now.getTime();
      
      setTimeout(() => {
        checkAndSendNotifications();
        // Schedule next daily run
        notificationInterval = setInterval(() => {
          checkAndSendNotifications();
        }, 24 * 60 * 60 * 1000); // Run every 24 hours
      }, msUntilRun);
      
    };
    runDailyCheck();
  } else if (scheduleType === 'custom_days') {
    // Check periodically (every hour) for custom days
    notificationInterval = setInterval(() => {
      checkAndSendNotifications();
    }, 60 * 60 * 1000); // Check every hour
  }
  
  // Run once immediately for testing
  if (scheduleType !== 'daily') {
    checkAndSendNotifications();
  }
}

// Stop the scheduler
function stopScheduler() {
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
    console.log('[SCHEDULER] Notification scheduler stopped');
  }
}

// GET: Check scheduler status
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      status: notificationInterval ? 'running' : 'stopped',
      message: notificationInterval ? 'Scheduler is running' : 'Scheduler is stopped'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to get scheduler status' },
      { status: 500 }
    );
  }
}

// POST: Start/stop scheduler or trigger immediate check
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'start':
        startScheduler(body);
        return NextResponse.json({
          success: true,
          message: 'Notification scheduler started'
        });
        
      case 'stop':
        stopScheduler();
        return NextResponse.json({
          success: true,
          message: 'Notification scheduler stopped'
        });
        
      case 'check':
        // Trigger immediate notification check
        await checkAndSendNotifications();
        return NextResponse.json({
          success: true,
          message: 'Notification check completed'
        });
        
      case 'test':
        // Send a test notification immediately
        const { email } = body;
        if (!email) {
          return NextResponse.json(
            { success: false, error: 'Email address required for test' },
            { status: 400 }
          );
        }
        
        const testSubject = 'Test Scheduled Notification';
        const testBody = `This is a test notification from the CrediLife scheduler.
        
If you receive this email, your scheduled notifications are working correctly!

Timestamp: ${new Date().toISOString()}`;
        
        const sent = await sendEmailNotification(email, testSubject, testBody);
        
        return NextResponse.json({
          success: sent,
          message: sent ? 'Test notification sent' : 'Failed to send test notification'
        });
        
      case 'simulate':
        // Simulate a specific date/time for testing
        const { email: simEmail, simulatedDate, scheduleConfig } = body;
        if (!simEmail || !simulatedDate) {
          return NextResponse.json(
            { success: false, error: 'Email and simulated date required' },
            { status: 400 }
          );
        }
        
        const simDate = new Date(simulatedDate);
        
        // Apply schedule config if provided
        if (scheduleConfig) {
          scheduleConfiguration = { ...scheduleConfiguration, ...scheduleConfig };
        }
        
        // Check what notifications would be sent on this date
        let notificationsSent = 0;
        const messages: string[] = [];
        
        try {
          const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
          
          // Fetch installments
          const response = await fetch(`${backendUrl}/installments?status=eq.pending&select=*`, {
            headers: {
              'apikey': process.env.API_KEY || '',
              'Authorization': `Bearer ${process.env.API_KEY || ''}`
            }
          });
          
          if (response.ok) {
            const installments = await response.json();
            const daysToCheck = scheduleConfig?.daysBeforeDue || scheduleConfiguration.daysBeforeDue || [7, 3];
            
            for (const installment of installments) {
              const dueDate = new Date(installment.due_date);
              const daysUntilDue = Math.ceil((dueDate.getTime() - simDate.getTime()) / (1000 * 60 * 60 * 24));
              
              if (daysToCheck.includes(daysUntilDue)) {
                notificationsSent++;
                messages.push(`Would send reminder for installment ${installment.id} (${daysUntilDue} days before due)`);
                
                // Actually send a test email
                const testSubject = `[TEST] Payment Reminder: ${daysUntilDue} days until due`;
                const testBody = `This is a TEST notification simulating ${simDate.toLocaleDateString()}.
                
In a real scenario, this would be sent ${daysUntilDue} days before the payment due date of ${dueDate.toLocaleDateString()}.
                
Installment ID: ${installment.id}
Amount: $${installment.amount}`;
                
                await sendEmailNotification(simEmail, testSubject, testBody);
              }
            }
            
            if (notificationsSent === 0) {
              messages.push('No notifications would be sent on this date with current settings');
            }
          }
        } catch (error) {
          console.error('[SCHEDULER] Simulation error:', error);
          return NextResponse.json({
            success: false,
            message: 'Failed to run simulation'
          });
        }
        
        return NextResponse.json({
          success: true,
          message: `Simulation complete: ${notificationsSent} notification(s) would be sent`,
          details: messages
        });
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[SCHEDULER] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}