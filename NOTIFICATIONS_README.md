# Payment Reminder Notification System

## Overview
The notification system enables automated payment reminders via email and WhatsApp. It supports configurable schedules for sending reminders before due dates, on due dates, and for overdue payments.

## Features

### 1. Automated Payment Reminders
- **7 days before due date** - Early reminder
- **3 days before due date** - Mid-reminder  
- **1 day before due date** - Final reminder
- **Due date** - Payment due today
- **1, 3, 7 days overdue** - Overdue notifications

### 2. Multi-Channel Support
- **Email notifications** via SMTP
- **WhatsApp notifications** via Twilio API
- Configurable per schedule (enable/disable each channel)

### 3. Configuration Management
- Web UI for managing reminder schedules
- Add/edit/delete custom schedules
- Enable/disable individual schedules
- Test notifications before deployment

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and fill in your credentials:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=notifications@yourcompany.com
EMAIL_PASS=your-app-password
EMAIL_FROM=CrediLife <notifications@yourcompany.com>

# WhatsApp Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_FROM=+14155238886
```

### 3. Email Setup (Gmail Example)
1. Enable 2-factor authentication on your Gmail account
2. Generate an app-specific password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use this password in `EMAIL_PASS`

### 4. WhatsApp Setup (Twilio)
1. Create a Twilio account at https://www.twilio.com
2. Get your Account SID and Auth Token from the Twilio Console
3. Set up WhatsApp sandbox:
   - Go to Messaging → Try it out → Send a WhatsApp message
   - Follow sandbox setup instructions
   - Note your sandbox number (use as `TWILIO_WHATSAPP_FROM`)

## Usage

### Access Notification Settings
Navigate to `/notifications` in your dashboard to:
- Configure reminder schedules
- Set up email and WhatsApp credentials
- Send test notifications
- Trigger manual reminder runs

### API Endpoints

#### Get Reminder Schedules
```
GET /api/notifications/schedules
```

#### Create New Schedule
```
POST /api/notifications/schedules
{
  "name": "14 Days Before",
  "daysBeforeDue": 14,
  "enabled": true,
  "channels": {
    "email": true,
    "whatsapp": false
  }
}
```

#### Update Schedule
```
PUT /api/notifications/schedules
{
  "id": "schedule_1",
  "enabled": false
}
```

#### Configure Services
```
POST /api/notifications/config
{
  "email": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "user": "email@company.com",
    "pass": "password"
  },
  "whatsapp": {
    "accountSid": "AC...",
    "authToken": "...",
    "fromNumber": "+14155238886"
  }
}
```

#### Send Test Notification
```
PUT /api/notifications/config
{
  "testEmail": "test@example.com",
  "testPhone": "+1234567890",
  "testMessage": "Test message"
}
```

#### Trigger Scheduled Reminders
```
POST /api/notifications/send-reminders
{
  "useMockData": false
}
```

## Scheduled Automation

To automate reminder sending, set up a cron job or scheduled task:

### Using Vercel Cron (vercel.json)
```json
{
  "crons": [{
    "path": "/api/notifications/send-reminders",
    "schedule": "0 9 * * *"
  }]
}
```

### Using Node Cron (for self-hosted)
```javascript
const cron = require('node-cron');

cron.schedule('0 9 * * *', async () => {
  await fetch('http://localhost:3000/api/notifications/send-reminders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ useMockData: false })
  });
});
```

## Testing

1. Navigate to `/notifications`
2. Go to the "Test" tab
3. Enter test email and/or phone number
4. Click "Send Test Notifications"

## Troubleshooting

### Email Not Sending
- Verify SMTP credentials
- Check firewall/port blocking
- For Gmail, ensure app password is used (not regular password)
- Check spam folder

### WhatsApp Not Working
- Verify Twilio credentials
- Ensure phone numbers include country code
- Check Twilio account balance
- Verify WhatsApp sandbox is active (for testing)

### Reminders Not Triggering
- Check reminder schedules are enabled
- Verify loan due dates are set correctly
- Check notification service status in UI
- Review API logs for errors

## Security Notes

1. **Never commit credentials** - Always use environment variables
2. **Use app passwords** - Don't use primary account passwords
3. **Limit API access** - Implement authentication for production
4. **Monitor usage** - Track notification sends to prevent abuse
5. **Test thoroughly** - Always test with small batches first

## Support

For issues or questions about the notification system:
1. Check the logs in the browser console
2. Review API responses in Network tab
3. Verify environment variables are set correctly
4. Test with mock data first before live data