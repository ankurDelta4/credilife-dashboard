import { NextRequest, NextResponse } from 'next/server';
import {
  getReminderSchedules,
  addReminderSchedule,
  updateReminderSchedule,
  deleteReminderSchedule,
  ReminderSchedule,
} from '@/lib/services/notifications';

export async function GET(request: NextRequest) {
  try {
    const schedules = getReminderSchedules();
    
    return NextResponse.json({
      success: true,
      data: schedules,
      count: schedules.length,
    });
  } catch (error) {
    console.error('Error fetching reminder schedules:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reminder schedules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { name, daysBeforeDue, enabled = true, channels } = body;

    if (!name || daysBeforeDue === undefined || !channels) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newSchedule = addReminderSchedule({
      name,
      daysBeforeDue,
      enabled,
      channels: {
        email: channels.email || false,
        whatsapp: channels.whatsapp || false,
      },
    });

    return NextResponse.json({
      success: true,
      data: newSchedule,
      message: 'Reminder schedule created successfully',
    });
  } catch (error) {
    console.error('Error creating reminder schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create reminder schedule' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    const updatedSchedule = updateReminderSchedule(id, updates);

    if (!updatedSchedule) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedSchedule,
      message: 'Reminder schedule updated successfully',
    });
  } catch (error) {
    console.error('Error updating reminder schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update reminder schedule' },
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

    const deleted = deleteReminderSchedule(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reminder schedule deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting reminder schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete reminder schedule' },
      { status: 500 }
    );
  }
}