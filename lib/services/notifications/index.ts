import { 
  initializeEmailService, 
  sendEmail, 
  generatePaymentReminderEmail,
  EmailConfig
} from './email';
import { 
  initializeWhatsAppService, 
  sendWhatsAppMessage, 
  generatePaymentReminderWhatsApp,
  WhatsAppConfig
} from './whatsapp';
import {
  ReminderSchedule,
  LoanPayment,
  getPaymentsNeedingReminders,
  getReminderSchedules,
  initializeDefaultSchedules
} from './reminder-schedule';

export * from './email';
export * from './whatsapp';
export * from './reminder-schedule';

export interface NotificationConfig {
  email?: EmailConfig;
  whatsapp?: WhatsAppConfig;
}

export interface NotificationResult {
  loanId: string;
  customerId: string;
  channel: 'email' | 'whatsapp';
  success: boolean;
  messageId?: string;
  error?: any;
  timestamp: Date;
}

class NotificationService {
  private emailEnabled = false;
  private whatsappEnabled = false;
  private notificationLog: NotificationResult[] = [];

  async initialize(config: NotificationConfig) {
    if (config.email) {
      this.emailEnabled = await initializeEmailService(config.email);
    }

    if (config.whatsapp) {
      this.whatsappEnabled = await initializeWhatsAppService(config.whatsapp);
    }

    initializeDefaultSchedules();

    return {
      email: this.emailEnabled,
      whatsapp: this.whatsappEnabled,
    };
  }

  async sendPaymentReminder(
    payment: LoanPayment,
    schedule: ReminderSchedule,
    daysUntilDue: number
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    if (schedule.channels.email && this.emailEnabled && payment.customerEmail) {
      const emailContent = generatePaymentReminderEmail(
        payment.customerName,
        payment.loanId,
        payment.amount,
        payment.dueDate,
        daysUntilDue
      );

      const emailResult = await sendEmail({
        ...emailContent,
        to: payment.customerEmail,
      });

      const result: NotificationResult = {
        loanId: payment.loanId,
        customerId: payment.customerId,
        channel: 'email',
        success: emailResult.success,
        messageId: emailResult.messageId,
        error: emailResult.error,
        timestamp: new Date(),
      };

      results.push(result);
      this.notificationLog.push(result);
    }

    if (schedule.channels.whatsapp && this.whatsappEnabled && payment.customerPhone) {
      const whatsappMessage = generatePaymentReminderWhatsApp(
        payment.customerName,
        payment.loanId,
        payment.amount,
        payment.dueDate,
        daysUntilDue
      );

      const whatsappResult = await sendWhatsAppMessage({
        to: payment.customerPhone,
        message: whatsappMessage,
      });

      const result: NotificationResult = {
        loanId: payment.loanId,
        customerId: payment.customerId,
        channel: 'whatsapp',
        success: whatsappResult.success,
        messageId: whatsappResult.messageId,
        error: whatsappResult.error,
        timestamp: new Date(),
      };

      results.push(result);
      this.notificationLog.push(result);
    }

    return results;
  }

  async processScheduledReminders(payments: LoanPayment[]): Promise<{
    processed: number;
    sent: number;
    failed: number;
    results: NotificationResult[];
  }> {
    const schedules = getReminderSchedules();
    const remindersToSend = getPaymentsNeedingReminders(payments, schedules);
    
    let sent = 0;
    let failed = 0;
    const allResults: NotificationResult[] = [];

    for (const { payment, schedule, daysUntilDue } of remindersToSend) {
      const results = await this.sendPaymentReminder(payment, schedule, daysUntilDue);
      
      for (const result of results) {
        allResults.push(result);
        if (result.success) {
          sent++;
        } else {
          failed++;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return {
      processed: remindersToSend.length,
      sent,
      failed,
      results: allResults,
    };
  }

  getNotificationLog(
    filters?: {
      loanId?: string;
      customerId?: string;
      channel?: 'email' | 'whatsapp';
      success?: boolean;
      startDate?: Date;
      endDate?: Date;
    }
  ): NotificationResult[] {
    let log = [...this.notificationLog];

    if (filters) {
      if (filters.loanId) {
        log = log.filter(n => n.loanId === filters.loanId);
      }
      if (filters.customerId) {
        log = log.filter(n => n.customerId === filters.customerId);
      }
      if (filters.channel) {
        log = log.filter(n => n.channel === filters.channel);
      }
      if (filters.success !== undefined) {
        log = log.filter(n => n.success === filters.success);
      }
      if (filters.startDate) {
        log = log.filter(n => n.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        log = log.filter(n => n.timestamp <= filters.endDate!);
      }
    }

    return log.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  clearNotificationLog() {
    this.notificationLog = [];
  }

  getServiceStatus() {
    return {
      email: this.emailEnabled,
      whatsapp: this.whatsappEnabled,
      totalNotificationsSent: this.notificationLog.length,
      successfulNotifications: this.notificationLog.filter(n => n.success).length,
      failedNotifications: this.notificationLog.filter(n => !n.success).length,
    };
  }
}

export const notificationService = new NotificationService();
export default notificationService;