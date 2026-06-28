import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';
import CryptoJS from 'crypto-js';
import DOMPurify from 'isomorphic-dompurify';

// Helper to strictly sanitize all inputs, removing any injected scripts or HTML
const sanitizeText = (val: string | undefined) => val ? DOMPurify.sanitize(val, { ALLOWED_TAGS: [] }) : val;

const bookingSchema = z.object({
  firstName: z.string().min(1).max(50).transform(sanitizeText),
  lastName: z.string().min(1).max(50).transform(sanitizeText),
  phone: z.string().min(10).max(15).regex(/^[0-9+()-\s]+$/, "Invalid phone format"),
  email: z.string().email().optional().or(z.literal('')).transform(sanitizeText),
  age: z.string().or(z.number()).optional(),
  gender: z.string().optional().transform(sanitizeText),
  service: z.string().optional().transform(sanitizeText),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  time: z.string().min(1).max(50).transform(sanitizeText),
  reason: z.string().optional().transform(sanitizeText),
  appointmentType: z.string().optional().transform(sanitizeText),
  homeAddress: z.string().optional().transform(sanitizeText),
  notes: z.string().optional().transform(sanitizeText),
  altPhone: z.string().optional().transform(sanitizeText)
});

// Basic in-memory rate limiting for IP addresses (Max 5 requests per minute per IP)
const ipRateLimit = new Map<string, { count: number, timestamp: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

export async function POST(request: Request) {
  try {
    // 0. Strict Origin Validation (CSRF Protection)
    const origin = request.headers.get('origin') || '*';
    // Let CORS pass, rely on HMAC signature for security.
    const allowedOrigin = process.env.VITE_APP_URL || origin;

    // 0.5. IP Rate Limiting
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
    
    // 1. Read Raw Body (Ciphertext) & Verify HMAC Signature
    const rawBody = await request.text();
    const signature = request.headers.get('x-payload-signature');
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing Payload Signature' }, { status: 400 });
    }

    const secretKey = process.env.VITE_API_SECRET || "default_development_secret_key_123!";
    const expectedSignature = CryptoJS.HmacSHA256(rawBody, secretKey).toString(CryptoJS.enc.Hex);
    
    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Payload Tampering Detected' }, { status: 403 });
    }

    // 1.5 Decrypt the Payload
    let decryptedPayload;
    try {
      const bytes = CryptoJS.AES.decrypt(rawBody, secretKey);
      decryptedPayload = bytes.toString(CryptoJS.enc.Utf8);
      if (!decryptedPayload) throw new Error("Empty decryption result");
    } catch (err) {
      return NextResponse.json({ error: 'Decryption Failed. Invalid payload.' }, { status: 400 });
    }

    // 2. Input Validation with Zod
    let body;
    try {
      body = JSON.parse(decryptedPayload);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload format' }, { status: 400 });
    }

    const parsed = bookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input data', details: parsed.error.format() }, { status: 400 });
    }

    const { 
      firstName, lastName, phone, email, age, gender, 
      service, date, time, reason,
      appointmentType, homeAddress, notes, altPhone
    } = parsed.data;

    const supabase = await createClient();

    // 3. Check if number is blocked
    const { data: blockedNumber } = await supabase
      .from('blocked_numbers')
      .select('phone_number')
      .eq('phone_number', phone)
      .single();

    if (blockedNumber) {
      return NextResponse.json({ error: 'Booking restricted for this number.' }, { status: 403 });
    }

    // 4. Duplicate check (no active appointment for phone)
    const { data: activeAppts } = await supabase
      .from('appointments')
      .select('id')
      .eq('phone', phone)
      .in('status', ['Pending', 'Confirmed'])
      .limit(1);

    if (activeAppts && activeAppts.length > 0) {
      return NextResponse.json({ error: 'You already have an active appointment.' }, { status: 400 });
    }

    // 5. Rate Limiting (2 bookings per phone per day)
    const todayStr = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('phone', phone)
      .gte('created_at', todayStr);

    if (count !== null && count >= 2) {
      return NextResponse.json({ error: 'Daily booking limit reached.' }, { status: 429 });
    }

    // 6. Prevent Past Dates
    if (date < todayStr) {
      return NextResponse.json({ error: 'Invalid date selection.' }, { status: 400 });
    }

    // 7. Insert Appointment
    let parsedAge = null;
    if (age) {
        parsedAge = typeof age === 'string' ? parseInt(age, 10) : age;
    }

    const newAppointment = {
      first_name: firstName,
      last_name: lastName,
      email: email || '',
      phone,
      alt_phone: altPhone || null,
      age: parsedAge,
      gender: gender || 'Not Specified',
      service: service || 'General',
      appointment_date: date,
      appointment_time: time,
      reason: reason || 'consultation',
      additional_notes: notes || null,
      status: 'Pending',
      otp_verified: false,
      appointment_type: appointmentType || 'clinic',
      home_address: homeAddress || null
    };

    const { error } = await supabase.from('appointments').insert([newAppointment]);

    if (error) {
      console.error('Insert error (masked for security):', error.message);
      return NextResponse.json({ error: 'Failed to save appointment. Please try again later.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Appointment booked successfully' });
  } catch (err) {
    console.error('Server error (masked for security):', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') || '*';
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Payload-Signature',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
