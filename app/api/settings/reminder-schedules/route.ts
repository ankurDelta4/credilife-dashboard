import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
    const apiKey = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY || '';
    
    // Fetch all reminder schedules ordered by priority
    const response = await fetch(`${backendUrl}/reminder_schedules?order=priority.desc,schedule_type.asc,days_offset.asc&select=*`, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const schedules = await response.json();
      
      // Transform database format to frontend format
      const transformedSchedules = schedules.map((schedule: any) => ({
        id: schedule.id,
        name: schedule.name,
        description: schedule.description,
        days: Math.abs(schedule.days_offset),
        type: schedule.schedule_type,
        email: schedule.email_enabled,
        whatsapp: schedule.whatsapp_enabled,
        sms: schedule.sms_enabled,
        enabled: schedule.is_enabled,
        priority: schedule.priority,
        emailTemplateId: schedule.email_template_id,
        whatsappTemplateId: schedule.whatsapp_template_id,
        smsTemplateId: schedule.sms_template_id
      }));
      
      return NextResponse.json({
        success: true,
        schedules: transformedSchedules
      });
    } else {
      throw new Error(`Database request failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Error loading reminder schedules:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load reminder schedules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
    const apiKey = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY || '';
    
    // Validate required fields
    if (!body.name || body.days === undefined || !body.type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, days, type' },
        { status: 400 }
      );
    }
    
    // Transform frontend format to database format
    const scheduleData = {
      name: body.name,
      description: body.description || '',
      schedule_type: body.type,
      days_offset: body.type === 'after' ? -Math.abs(body.days) : body.days,
      email_enabled: body.email !== false,
      whatsapp_enabled: body.whatsapp === true,
      sms_enabled: body.sms === true,
      is_enabled: body.enabled !== false,
      priority: body.priority || 0,
      email_template_id: body.emailTemplateId || null,
      whatsapp_template_id: body.whatsappTemplateId || null,
      sms_template_id: body.smsTemplateId || null
    };
    
    // Check if we're updating existing schedule
    if (body.id) {
      // Update existing schedule
      const response = await fetch(`${backendUrl}/reminder_schedules?id=eq.${body.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scheduleData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update schedule: ${response.status}`);
      }
    } else {
      // Create new schedule
      const response = await fetch(`${backendUrl}/reminder_schedules`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scheduleData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create schedule:', response.status, errorText);
        throw new Error(`Failed to create schedule: ${response.status} - ${errorText}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Reminder schedule saved successfully'
    });
  } catch (error) {
    console.error('Error saving reminder schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save reminder schedule' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Schedule ID is required' },
        { status: 400 }
      );
    }
    
    const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
    const apiKey = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY || '';
    
    const response = await fetch(`${backendUrl}/reminder_schedules?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete schedule: ${response.status}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Reminder schedule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting reminder schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete reminder schedule' },
      { status: 500 }
    );
  }
}