import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
    const apiKey = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY || '';
    
    // Default reminder schedules
    const defaultSchedules = [
      { name: '7 Days Before Due', schedule_type: 'before', days_offset: 7, email_enabled: true, whatsapp_enabled: false, is_enabled: true, priority: 7 },
      { name: '3 Days Before Due', schedule_type: 'before', days_offset: 3, email_enabled: true, whatsapp_enabled: false, is_enabled: true, priority: 6 },
      { name: '1 Day Before Due', schedule_type: 'before', days_offset: 1, email_enabled: true, whatsapp_enabled: false, is_enabled: true, priority: 5 },
      { name: 'Due Date', schedule_type: 'due', days_offset: 0, email_enabled: true, whatsapp_enabled: false, is_enabled: true, priority: 4 },
      { name: '1 Day Overdue', schedule_type: 'after', days_offset: -1, email_enabled: true, whatsapp_enabled: false, is_enabled: true, priority: 3 },
      { name: '3 Days Overdue', schedule_type: 'after', days_offset: -3, email_enabled: true, whatsapp_enabled: false, is_enabled: true, priority: 2 },
      { name: '7 Days Overdue', schedule_type: 'after', days_offset: -7, email_enabled: true, whatsapp_enabled: false, is_enabled: true, priority: 1 }
    ];
    
    // Default email configuration (Mailtrap)
    const defaultEmailConfig = {
      name: 'Default Mailtrap Configuration',
      smtp_host: 'sandbox.smtp.mailtrap.io',
      smtp_port: 587,
      username: 'f089b4f479d48f',
      password: '822f95cdb12df4',
      from_email: 'noreply@credilife.com',
      from_name: 'CrediLife',
      use_tls: true,
      is_active: true,
      is_default: true
    };
    
    // Check if any reminder schedules exist
    const schedulesResponse = await fetch(`${backendUrl}/reminder_schedules?select=count`, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (schedulesResponse.ok) {
      const schedulesData = await schedulesResponse.json();
      if (schedulesData.length === 0) {
        // Insert default schedules
        const insertSchedulesResponse = await fetch(`${backendUrl}/reminder_schedules`, {
          method: 'POST',
          headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(defaultSchedules)
        });
        
        if (!insertSchedulesResponse.ok) {
          throw new Error(`Failed to insert default schedules: ${insertSchedulesResponse.status}`);
        }
      }
    }
    
    // Check if any email configurations exist
    const configResponse = await fetch(`${backendUrl}/email_configurations?select=count`, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (configResponse.ok) {
      const configData = await configResponse.json();
      if (configData.length === 0) {
        // Insert default email configuration
        const insertConfigResponse = await fetch(`${backendUrl}/email_configurations`, {
          method: 'POST',
          headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(defaultEmailConfig)
        });
        
        if (!insertConfigResponse.ok) {
          throw new Error(`Failed to insert default email config: ${insertConfigResponse.status}`);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Default configurations seeded successfully'
    });
  } catch (error) {
    console.error('Error seeding defaults:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed default configurations' },
      { status: 500 }
    );
  }
}