import { addDays, setDate, startOfMonth, isAfter, isBefore, differenceInDays } from 'date-fns';

export interface PaymentSchedule {
  frequency: 'monthly' | 'biweekly';
  days: number[]; // For monthly: [15] means day 15. For biweekly: [10, 25] means days 10 and 25
  startDate: Date;
  numberOfInstallments: number;
}

export interface ScheduledPayment {
  installmentNumber: number;
  dueDate: Date;
  amount: number;
}

export function generatePaymentSchedule(
  schedule: PaymentSchedule,
  installmentAmount: number
): ScheduledPayment[] {
  const payments: ScheduledPayment[] = [];
  let currentDate = new Date(schedule.startDate);
  let installmentCount = 0;

  if (schedule.frequency === 'monthly') {
    // Monthly payments - one payment per month on the specified day
    const paymentDay = schedule.days[0];
    
    for (let i = 0; i < schedule.numberOfInstallments; i++) {
      const paymentDate = setDate(startOfMonth(currentDate), paymentDay);
      
      // If the payment date is before the start date for the first installment, move to next month
      if (i === 0 && isBefore(paymentDate, schedule.startDate)) {
        currentDate = addDays(currentDate, 30);
        const nextMonthPayment = setDate(startOfMonth(currentDate), paymentDay);
        payments.push({
          installmentNumber: i + 1,
          dueDate: nextMonthPayment,
          amount: installmentAmount
        });
      } else {
        payments.push({
          installmentNumber: i + 1,
          dueDate: paymentDate,
          amount: installmentAmount
        });
      }
      
      // Move to next month
      currentDate = addDays(paymentDate, 31);
    }
  } else if (schedule.frequency === 'biweekly') {
    // Biweekly payments - two payments per month on specified days
    const [firstDay, secondDay] = schedule.days.sort((a, b) => a - b);
    
    while (installmentCount < schedule.numberOfInstallments) {
      const month = startOfMonth(currentDate);
      
      // First payment of the month
      const firstPayment = setDate(month, firstDay);
      if (isAfter(firstPayment, schedule.startDate) || installmentCount === 0) {
        if (installmentCount < schedule.numberOfInstallments) {
          payments.push({
            installmentNumber: installmentCount + 1,
            dueDate: firstPayment,
            amount: installmentAmount
          });
          installmentCount++;
        }
      }
      
      // Second payment of the month
      if (installmentCount < schedule.numberOfInstallments) {
        const secondPayment = setDate(month, secondDay);
        if (isAfter(secondPayment, schedule.startDate)) {
          payments.push({
            installmentNumber: installmentCount + 1,
            dueDate: secondPayment,
            amount: installmentAmount
          });
          installmentCount++;
        }
      }
      
      // Move to next month
      currentDate = addDays(currentDate, 31);
    }
  }
  
  return payments;
}

export function getNextPaymentDate(
  schedule: PaymentSchedule,
  lastPaymentDate?: Date
): Date | null {
  const today = new Date();
  const payments = generatePaymentSchedule(schedule, 0);
  
  if (!lastPaymentDate) {
    // Find the first payment date after today
    const nextPayment = payments.find(p => isAfter(p.dueDate, today));
    return nextPayment ? nextPayment.dueDate : null;
  }
  
  // Find the next payment after the last payment date
  const nextPayment = payments.find(p => isAfter(p.dueDate, lastPaymentDate));
  return nextPayment ? nextPayment.dueDate : null;
}

export function getDaysUntilNextPayment(
  schedule: PaymentSchedule,
  lastPaymentDate?: Date
): number | null {
  const nextPaymentDate = getNextPaymentDate(schedule, lastPaymentDate);
  
  if (!nextPaymentDate) {
    return null;
  }
  
  return differenceInDays(nextPaymentDate, new Date());
}

export function getUpcomingPayments(
  schedule: PaymentSchedule,
  installmentAmount: number,
  daysAhead: number = 30
): ScheduledPayment[] {
  const allPayments = generatePaymentSchedule(schedule, installmentAmount);
  const today = new Date();
  const futureDate = addDays(today, daysAhead);
  
  return allPayments.filter(payment => 
    isAfter(payment.dueDate, today) && isBefore(payment.dueDate, futureDate)
  );
}

export function formatPaymentScheduleDescription(schedule: PaymentSchedule): string {
  if (schedule.frequency === 'monthly') {
    return `Monthly payments on day ${schedule.days[0]} of each month`;
  } else {
    return `Bi-weekly payments on days ${schedule.days[0]} and ${schedule.days[1]} of each month`;
  }
}