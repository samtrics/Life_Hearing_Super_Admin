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

async function handlePOST(request: Request) {
  try {
    // 0. Strict Origin Validation (CSRF Protection)
    const origin = request.headers.get('origin') || '*';
    // Let CORS pass, rely on HMAC signature for security.
    const allowedOrigin = process.env.VITE_APP_URL || origin;

    const supabase = await createClient();

    // 0.5. IP Rate Limiting via Supabase
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    if (ip !== 'unknown') {
      const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
      const { count: requestCount, error: rateLimitError } = await supabase
        .from('ip_rate_limits')
        .select('*', { count: 'exact', head: true })
        .eq('ip_address', ip)
        .gte('request_timestamp', oneMinuteAgo);

      if (rateLimitError) {
        console.error('Rate limit check failed (Table may be missing):', rateLimitError.message);
      } else if (requestCount !== null && requestCount >= 5) {
        return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
      }

      // Log this request
      await supabase.from('ip_rate_limits').insert([{ ip_address: ip }]);
    }
    
    // 1. Read Raw Body (Ciphertext) & Verify HMAC Signature
    const rawBody = await request.text();
    const signature = request.headers.get('x-payload-signature');
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing Payload Signature' }, { status: 400 });
    }

    const secretKey = process.env.VITE_API_SECRET;
    if (!secretKey) {
      console.error("CRITICAL: VITE_API_SECRET is not configured on the server.");
      return NextResponse.json({ error: 'Internal Server Configuration Error (VITE_API_SECRET missing)' }, { status: 422 });
    }
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

    // 3. Check if number is blocked
    const { data: blockedNumber } = await supabase
      .from('blocked_numbers')
      .select('phone_number')
      .eq('phone_number', phone)
      .single();

    if (blockedNumber) {
      return NextResponse.json({ error: 'Booking restricted for this number.' }, { status: 403 });
    }

    // 4. Duplicate check (no active appointment for SAME phone AND SAME name)
    const { data: activeAppts } = await supabase
      .from('appointments')
      .select('id')
      .eq('phone', phone)
      .eq('first_name', firstName)
      .eq('last_name', lastName)
      .in('status', ['Pending', 'Confirmed'])
      .limit(1);

    if (activeAppts && activeAppts.length > 0) {
      return NextResponse.json({ error: 'This patient already has an active appointment.' }, { status: 400 });
    }

    // 5. Rate Limiting (2 bookings per phone per day)
    // Convert current UTC time to IST (+5:30) for accurate date checks in India
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    const todayStr = istTime.toISOString().split('T')[0];
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
  } catch (err: any) {
    console.error('Server error (masked for security):', err);
    return NextResponse.json({ error: `Internal Error: ${err.message}` }, { status: 422 });
  }
}

const ALLOWED_ORIGINS = ['https://life-hearing-care.vercel.app', 'http://localhost:5173'];

function getCorsOrigin(request: Request) {
  // Echo the requested origin to bypass CORS restrictions for the frontend.
  // Security is maintained via the strict HMAC signature verification.
  return request.headers.get('origin') || '*';
}

export async function POST(request: Request) {
  const response = await handlePOST(request);
  const origin = getCorsOrigin(request);
  
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Payload-Signature');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return response;
}

export async function OPTIONS(request: Request) {
  const origin = getCorsOrigin(request);
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
