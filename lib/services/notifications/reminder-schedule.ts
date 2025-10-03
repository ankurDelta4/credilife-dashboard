import { addDays, differenceInDays, startOfDay } from 'date-fns';

export interface ReminderSchedule {
  id: string;
  name: string;
  daysBeforeDue: number;
  enabled: boolean;
  channels: {
    email: boolean;
    whatsapp: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface LoanPayment {
  loanId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amount: number;
  dueDate: Date;
  status: 'upcoming' | 'due_today' | 'overdue';
}

const defaultReminderSchedules: Omit<ReminderSchedule, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '7 Days Before Due',
    daysBeforeDue: 7,
    enabled: true,
    channels: {
      email: true,
      whatsapp: true,
    },
  },
  {
    name: '3 Days Before Due',
    daysBeforeDue: 3,
    enabled: true,
    channels: {
      email: true,
      whatsapp: true,
    },
  },
  {
    name: '1 Day Before Due',
    daysBeforeDue: 1,
    enabled: true,
    channels: {
      email: true,
      whatsapp: false,
    },
  },
  {
    name: 'Due Date',
    daysBeforeDue: 0,
    enabled: true,
    channels: {
      email: true,
      whatsapp: true,
    },
  },
  {
    name: '1 Day Overdue',
    daysBeforeDue: -1,
    enabled: true,
    channels: {
      email: true,
      whatsapp: true,
    },
  },
  {
    name: '3 Days Overdue',
    daysBeforeDue: -3,
    enabled: true,
    channels: {
      email: true,
      whatsapp: true,
    },
  },
  {
    name: '7 Days Overdue',
    daysBeforeDue: -7,
    enabled: true,
    channels: {
      email: true,
      whatsapp: true,
    },
  },
];

let reminderSchedules: ReminderSchedule[] = [];

export function initializeDefaultSchedules(): ReminderSchedule[] {
  reminderSchedules = defaultReminderSchedules.map((schedule, index) => ({
    ...schedule,
    id: `schedule_${index + 1}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  return reminderSchedules;
}

export function getReminderSchedules(): ReminderSchedule[] {
  if (reminderSchedules.length === 0) {
    return initializeDefaultSchedules();
  }
  return reminderSchedules;
}

export function updateReminderSchedule(
  id: string,
  updates: Partial<Omit<ReminderSchedule, 'id' | 'createdAt'>>
): ReminderSchedule | null {
  const index = reminderSchedules.findIndex(s => s.id === id);
  if (index === -1) return null;

  reminderSchedules[index] = {
    ...reminderSchedules[index],
    ...updates,
    updatedAt: new Date(),
  };

  return reminderSchedules[index];
}

export function addReminderSchedule(
  schedule: Omit<ReminderSchedule, 'id' | 'createdAt' | 'updatedAt'>
): ReminderSchedule {
  const newSchedule: ReminderSchedule = {
    ...schedule,
    id: `schedule_${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  reminderSchedules.push(newSchedule);
  return newSchedule;
}

export function deleteReminderSchedule(id: string): boolean {
  const index = reminderSchedules.findIndex(s => s.id === id);
  if (index === -1) return false;

  reminderSchedules.splice(index, 1);
  return true;
}

export function getPaymentsNeedingReminders(
  payments: LoanPayment[],
  schedules: ReminderSchedule[] = reminderSchedules
): Array<{
  payment: LoanPayment;
  schedule: ReminderSchedule;
  daysUntilDue: number;
}> {
  const today = startOfDay(new Date());
  const remindersToSend: Array<{
    payment: LoanPayment;
    schedule: ReminderSchedule;
    daysUntilDue: number;
  }> = [];

  for (const payment of payments) {
    const dueDate = startOfDay(new Date(payment.dueDate));
    const daysUntilDue = differenceInDays(dueDate, today);

    for (const schedule of schedules) {
      if (!schedule.enabled) continue;

      if (daysUntilDue === schedule.daysBeforeDue) {
        remindersToSend.push({
          payment,
          schedule,
          daysUntilDue,
        });
      }
    }
  }

  return remindersToSend;
}

export function shouldSendReminder(
  dueDate: Date,
  schedule: ReminderSchedule
): boolean {
  if (!schedule.enabled) return false;

  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  const daysUntilDue = differenceInDays(due, today);

  return daysUntilDue === schedule.daysBeforeDue;
}

export function getNextReminderDate(
  dueDate: Date,
  schedules: ReminderSchedule[] = reminderSchedules
): Date | null {
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  const daysUntilDue = differenceInDays(due, today);

  const enabledSchedules = schedules
    .filter(s => s.enabled)
    .sort((a, b) => b.daysBeforeDue - a.daysBeforeDue);

  for (const schedule of enabledSchedules) {
    if (daysUntilDue >= schedule.daysBeforeDue) {
      return addDays(due, -schedule.daysBeforeDue);
    }
  }

  return null;
}