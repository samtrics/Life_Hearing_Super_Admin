import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Basic in-memory rate limiting for IP addresses (Max 100 requests per minute per IP for admin)
const ipRateLimit = new Map<string, { count: number, timestamp: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 100;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
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
    const supabase = await createClient();

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await request.json();
    
    // SECURITY: Validate status against allowed values only
    const ALLOWED_STATUSES = ['Pending', 'Confirmed', 'Cancelled', 'Completed', 'Under Review'];
    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value.' }, { status: 400 });
    }

    const { error, data } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Updated successfully', appointment: data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
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
    const supabase = await createClient();

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', resolvedParams.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
