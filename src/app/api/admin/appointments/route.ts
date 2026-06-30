import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

// Basic in-memory rate limiting for IP addresses (Max 100 requests per minute per IP for admin)
const ipRateLimit = new Map<string, { count: number, timestamp: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 100;

async function checkRateLimit(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  if (ip !== 'unknown') {
    const now = Date.now();
    const record = ipRateLimit.get(ip);
    if (record) {
      if (now - record.timestamp < RATE_LIMIT_WINDOW_MS) {
        if (record.count >= MAX_REQUESTS_PER_WINDOW) {
          return false; // Rate limit exceeded
        }
        record.count += 1;
      } else {
        ipRateLimit.set(ip, { count: 1, timestamp: now });
      }
    } else {
      ipRateLimit.set(ip, { count: 1, timestamp: now });
    }
  }
  return true;
}

async function verifyAdminAuth(request: Request) {
  const authHeader = request.headers.get('x-admin-auth') || request.headers.get('Authorization');
  let user;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    const adminSupabase = createAdminClient();
    const { data } = await adminSupabase.auth.getUser(token);
    user = data?.user;
  } else {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user;
  }
  
  const allowedEmails = [
    process.env.DOCTOR_EMAIL,
    process.env.VITE_STAFF_EMAIL,
    process.env.STAFF_EMAIL,
    'admin@lifehearing.com', // Fallback for legacy React frontend
    'doctor@lifehearing.com' // Fallback
  ].filter(Boolean).map(e => e?.toLowerCase());
  
  if (!user || !user.email || !allowedEmails.includes(user.email.toLowerCase())) {
    return null; // Reject if no user or if email does not match any admin email
  }
  
  return user;
}

export async function GET(request: Request) {
  try {
    if (!(await checkRateLimit(request))) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const user = await verifyAdminAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }

    return NextResponse.json({ appointments: data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await checkRateLimit(request))) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const user = await verifyAdminAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const body = await request.json();
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase.from('appointments').insert([body]).select();
    
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await checkRateLimit(request))) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const user = await verifyAdminAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'Missing appointment ID' }, { status: 400 });

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase.from('appointments').update(updates).eq('id', id).select();
    
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
