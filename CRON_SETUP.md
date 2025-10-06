# Cron Worker Setup for Automated Notifications

## Overview
The cron worker automatically sends payment reminders to customers based on configured schedules. It runs independently alongside your Next.js application.

## Quick Start

### 1. Run Both App and Cron Together
```bash
npm run dev:all
```
This starts both the Next.js app and the cron worker.

### 2. Run Cron Worker Separately
```bash
# In terminal 1
npm run dev

# In terminal 2
npm run cron
```

## Available Scripts

- `npm run cron` - Start the cron worker
- `npm run cron:test` - Start cron with test mode enabled
- `npm run dev:all` - Start both app and cron together

## Scheduled Tasks

### Production Schedules

1. **Daily Payment Reminders**
   - Time: 9:00 AM daily
   - Purpose: Send reminders for upcoming payments
   - Checks all loans and sends notifications based on configured reminder schedules

2. **Weekly Overdue Summary**
   - Time: 10:00 AM every Monday
   - Purpose: Send summary of overdue payments
   - Focuses on loans that are past due

3. **Health Check**
   - Time: Every hour
   - Purpose: Logs that the cron worker is running
   - Helps monitor if the cron is active

### Test Schedule (Disabled by Default)

For testing, you can enable a 1-minute interval schedule:

1. Edit `cron-worker.js`
2. Find `testSchedule` section
3. Change `enabled: false` to `enabled: true`
4. Restart the cron worker

## Configuration

### Environment Variables

```env
# API URL (defaults to http://localhost:3001)
NEXT_PUBLIC_API_URL=http://localhost:3001

# Timezone (defaults to America/New_York)
TZ=America/New_York

# Enable/Disable cron (defaults to true)
ENABLE_CRON=true
```

### Customizing Schedules

Edit `cron-worker.js` to modify schedules:

```javascript
// Example: Change daily reminder to 2 PM
dailyReminders: {
  schedule: '0 14 * * *',  // 2:00 PM
  name: 'Daily Payment Reminders',
  task: async () => { ... }
}
```

### Cron Schedule Format
```
* * * * *
│ │ │ │ │
│ │ │ │ └── Day of week (0-7, 0/7 = Sunday)
│ │ │ └──── Month (1-12)
│ │ └────── Day of month (1-31)
│ └──────── Hour (0-23)
└────────── Minute (0-59)
```

Examples:
- `0 9 * * *` - Every day at 9:00 AM
- `*/5 * * * *` - Every 5 minutes
- `0 0 * * 0` - Every Sunday at midnight
- `0 */2 * * *` - Every 2 hours

## Monitoring

### View Logs
The cron worker outputs detailed logs:
- ✅ Successful operations
- ❌ Errors and failures
- 📅 Scheduled tasks
- ❤️ Health checks

### Check Status
Look for these log messages:
```
🚀 Starting CrediLife Cron Worker...
✅ Scheduling: Daily Payment Reminders (0 9 * * *)
🎯 Cron worker is running. Press Ctrl+C to stop.
```

## Production Deployment

### Option 1: PM2 (Recommended)
```bash
# Install PM2
npm install -g pm2

# Start the cron worker
pm2 start cron-worker.js --name "credilife-cron"

# Save PM2 configuration
pm2 save
pm2 startup
```

### Option 2: Docker
```dockerfile
# Add to your Dockerfile
CMD ["sh", "-c", "npm run start & node cron-worker.js"]
```

### Option 3: Systemd Service (Linux)
Create `/etc/systemd/system/credilife-cron.service`:
```ini
[Unit]
Description=CrediLife Cron Worker
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/your/app
ExecStart=/usr/bin/node /path/to/your/app/cron-worker.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable credilife-cron
sudo systemctl start credilife-cron
```

## Troubleshooting

### Cron Not Running
1. Check if the process is running: `ps aux | grep cron-worker`
2. Verify environment variables are set
3. Check API URL is correct
4. Look for error messages in logs

### Notifications Not Sending
1. Verify email/WhatsApp credentials in `/notifications` page
2. Check if schedules are enabled
3. Ensure loans have valid due dates
4. Test with manual trigger first

### Time Zone Issues
Set the correct timezone:
```bash
export TZ=America/New_York
npm run cron
```

Or modify in `cron-worker.js`:
```javascript
timezone: 'Asia/Kolkata' // Your timezone
```

## Testing

1. **Enable Test Mode**: Set `testSchedule` to `enabled: true`
2. **Use Mock Data**: The test schedule uses mock data by default
3. **Manual Trigger**: Use the "Send Scheduled Reminders" button in UI
4. **Check Logs**: Monitor console output for success/failure

## Security Notes

- Keep cron worker in a secure environment
- Don't expose the notification API endpoints publicly
- Monitor for unusual activity in logs
- Implement rate limiting if needed
- Use environment variables for sensitive data

## Support

For issues:
1. Check the cron worker logs
2. Verify API endpoints are accessible
3. Test with the manual trigger button
4. Review this documentation

The cron worker is essential for automated payment reminders and helps reduce manual work while ensuring customers are notified on time.