const cron = require('node-cron');

// Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const ENABLE_CRON = process.env.ENABLE_CRON !== 'false'; // Default to true

// Define cron schedules
const schedules = {
  // Daily reminder check at 9:00 AM
  dailyReminders: {
    schedule: '0 9 * * *',
    name: 'Daily Payment Reminders',
    task: async () => {
      console.log(`[${new Date().toISOString()}] Running daily payment reminders...`);
      try {
        const response = await fetch(`${API_URL}/api/notifications/send-reminders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ useMockData: false })
        });
        
        const data = await response.json();
        if (data.success) {
          console.log(`✅ Daily reminders sent successfully:`, data.summary);
        } else {
          console.error('❌ Failed to send daily reminders:', data.error);
        }
      } catch (error) {
        console.error('❌ Error sending daily reminders:', error);
      }
    }
  },

  // Evening reminder check at 6:00 PM (optional second run)
  eveningReminders: {
    schedule: '0 18 * * *',
    name: 'Evening Payment Reminders',
    enabled: false, // Disabled by default, enable if needed
    task: async () => {
      console.log(`[${new Date().toISOString()}] Running evening payment reminders...`);
      try {
        const response = await fetch(`${API_URL}/api/notifications/send-reminders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ useMockData: false })
        });
        
        const data = await response.json();
        if (data.success) {
          console.log(`✅ Evening reminders sent successfully:`, data.summary);
        } else {
          console.error('❌ Failed to send evening reminders:', data.error);
        }
      } catch (error) {
        console.error('❌ Error sending evening reminders:', error);
      }
    }
  },

  // Weekly overdue summary (Mondays at 10:00 AM)
  weeklyOverdueSummary: {
    schedule: '0 10 * * 1',
    name: 'Weekly Overdue Summary',
    enabled: true,
    task: async () => {
      console.log(`[${new Date().toISOString()}] Running weekly overdue summary...`);
      try {
        const response = await fetch(`${API_URL}/api/notifications/send-reminders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            useMockData: false,
            overdueOnly: true // You can add this filter in your API
          })
        });
        
        const data = await response.json();
        if (data.success) {
          console.log(`✅ Weekly overdue summary sent:`, data.summary);
        } else {
          console.error('❌ Failed to send weekly summary:', data.error);
        }
      } catch (error) {
        console.error('❌ Error sending weekly summary:', error);
      }
    }
  },

  // Health check - runs every hour to ensure the cron is working
  healthCheck: {
    schedule: '0 * * * *',
    name: 'Health Check',
    enabled: true,
    task: async () => {
      console.log(`[${new Date().toISOString()}] ❤️  Cron worker is healthy and running`);
    }
  },

  // Test schedule - runs every minute (ONLY FOR TESTING)
  testSchedule: {
    schedule: '* * * * *', // Every minute
    name: 'Test Schedule (1 min interval)',
    enabled: false, // CHANGE TO true FOR TESTING
    task: async () => {
      console.log(`[${new Date().toISOString()}] 🧪 TEST: Running test reminder check...`);
      try {
        const response = await fetch(`${API_URL}/api/notifications/send-reminders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ useMockData: true }) // Use mock data for testing
        });
        
        const data = await response.json();
        if (data.success) {
          console.log(`✅ TEST reminders sent:`, data.summary);
        } else {
          console.error('❌ TEST failed:', data.error);
        }
      } catch (error) {
        console.error('❌ TEST error:', error);
      }
    }
  }
};

// Initialize and start cron jobs
function startCronJobs() {
  console.log('🚀 Starting CrediLife Cron Worker...');
  console.log(`📍 API URL: ${API_URL}`);
  console.log(`⏰ Current time: ${new Date().toISOString()}`);
  console.log('');

  if (!ENABLE_CRON) {
    console.log('⚠️  Cron jobs are disabled (ENABLE_CRON=false)');
    return;
  }

  // Schedule all enabled jobs
  Object.entries(schedules).forEach(([key, job]) => {
    if (job.enabled !== false) {
      console.log(`✅ Scheduling: ${job.name} (${job.schedule})`);
      
      const task = cron.schedule(job.schedule, job.task, {
        scheduled: true,
        timezone: process.env.TZ || 'America/New_York' // Set your timezone
      });

      // Start the task
      task.start();
    } else {
      console.log(`⏸️  Skipped: ${job.name} (disabled)`);
    }
  });

  console.log('');
  console.log('🎯 Cron worker is running. Press Ctrl+C to stop.');
  console.log('');

  // Log upcoming schedules
  console.log('📅 Scheduled Tasks:');
  console.log('• Daily Reminders: Every day at 9:00 AM');
  console.log('• Weekly Summary: Every Monday at 10:00 AM');
  console.log('• Health Check: Every hour');
  console.log('');
  console.log('💡 TIP: To test immediately, enable testSchedule in cron-worker.js');
  console.log('');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down cron worker gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down cron worker gracefully...');
  process.exit(0);
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit, keep the cron running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit, keep the cron running
});

// Start the cron worker
startCronJobs();

// Keep the process alive
setInterval(() => {
  // Keep-alive interval - prevents the process from exiting
}, 1000 * 60 * 60); // Check every hour