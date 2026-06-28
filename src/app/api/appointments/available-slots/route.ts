import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Basic in-memory rate limiting for IP addresses (Max 30 requests per minute per IP)
const ipRateLimit = new Map<string, { count: number, timestamp: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

export async function GET(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (ip !== 'unknown') {
      const now = Date.now();
      const record = ipRateLimit.get(ip);
      if (record) {
        if (now - record.timestamp < RATE_LIMIT_WINDOW_MS) {
          if (record.count >= MAX_REQUESTS_PER_WINDOW) {
            return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
          }
          record.count += 1;
        } else {
          ipRateLimit.set(ip, { count: 1, timestamp: now });
        }
      } else {
        ipRateLimit.set(ip, { count: 1, timestamp: now });
      }
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Get Clinic Settings
    const { data: settings } = await supabase
      .from('clinic_settings')
      .select('*')
      .limit(1)
      .single();

    if (!settings) {
      return NextResponse.json({ error: 'Clinic settings not configured' }, { status: 500 });
    }

    // Check if holiday
    const isHoliday = (settings.holiday_dates || []).includes(date);
    if (isHoliday) {
      return NextResponse.json({ slots: [] });
    }

    // 2. Generate all possible slots
    const startHour = parseInt(settings.working_start.split(':')[0]);
    const endHour = parseInt(settings.working_end.split(':')[0]);
    const duration = settings.appointment_duration || 30;
    
    const allSlots: string[] = [];
    for (let h = startHour; h < endHour; h++) {
      allSlots.push(`${h.toString().padStart(2, '0')}:00`);
      if (duration === 30) {
        allSlots.push(`${h.toString().padStart(2, '0')}:30`);
      }
    }

    // 3. Get booked slots
    const { data: appointments } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('appointment_date', date)
      .in('status', ['Pending', 'Confirmed']);

    const bookedSlots = (appointments || []).map(a => {
      // In the DB, time might be saved as "10:00" or "morning".
      // We need to parse it if it's exact time. Assuming new flow saves exact time like "10:30"
      return a.appointment_time;
    });

    // 4. Filter available
    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    return NextResponse.json({ slots: availableSlots });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
