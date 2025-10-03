import { Twilio } from 'twilio';
import { format } from 'date-fns';

export interface WhatsAppConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export interface WhatsAppNotification {
  to: string;
  message: string;
}

let twilioClient: Twilio | null = null;
let whatsAppFrom: string = '';

export async function initializeWhatsAppService(config: WhatsAppConfig) {
  try {
    twilioClient = new Twilio(config.accountSid, config.authToken);
    whatsAppFrom = `whatsapp:${config.fromNumber}`;
    
    console.log('WhatsApp service initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize WhatsApp service:', error);
    return false;
  }
}

export async function sendWhatsAppMessage(notification: WhatsAppNotification) {
  if (!twilioClient) {
    throw new Error('WhatsApp service not initialized');
  }

  try {
    const message = await twilioClient.messages.create({
      body: notification.message,
      from: whatsAppFrom,
      to: `whatsapp:${notification.to}`,
    });

    console.log('WhatsApp message sent:', message.sid);
    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    return { success: false, error: error };
  }
}

export function generatePaymentReminderWhatsApp(
  customerName: string,
  loanId: string,
  amount: number,
  dueDate: Date,
  daysBeforeDue: number
): string {
  const formattedDate = format(dueDate, 'MMM dd, yyyy');
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);

  let message: string;

  if (daysBeforeDue > 0) {
    message = `
🔔 *Payment Reminder*

Hello ${customerName},

Your loan payment is due in *${daysBeforeDue} days*.

📋 *Loan Details:*
• Loan ID: ${loanId}
• Amount: ${formattedAmount}
• Due Date: ${formattedDate}

Please ensure timely payment to avoid late fees.

Need help? Reply to this message or call our support team.

- CrediLife Team
    `.trim();
  } else if (daysBeforeDue === 0) {
    message = `
⚠️ *Payment Due Today*

Hello ${customerName},

Your loan payment is *DUE TODAY*.

📋 *Loan Details:*
• Loan ID: ${loanId}
• Amount: ${formattedAmount}
• Due Date: ${formattedDate} (TODAY)

Please make your payment immediately to avoid late fees.

Need urgent assistance? Reply to this message or call our support team.

- CrediLife Team
    `.trim();
  } else {
    message = `
🚨 *Overdue Payment Notice*

Hello ${customerName},

Your loan payment is *${Math.abs(daysBeforeDue)} days overdue*.

📋 *Loan Details:*
• Loan ID: ${loanId}
• Amount: ${formattedAmount}
• Original Due Date: ${formattedDate}

Please make your payment immediately to avoid additional fees and credit impact.

Need payment assistance? Reply to this message or call us immediately.

- CrediLife Team
    `.trim();
  }

  return message;
}

export async function sendBulkWhatsAppReminders(
  notifications: WhatsAppNotification[]
): Promise<Array<{ to: string; success: boolean; messageId?: string; error?: any }>> {
  const results = [];

  for (const notification of notifications) {
    const result = await sendWhatsAppMessage(notification);
    results.push({
      to: notification.to,
      ...result,
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}