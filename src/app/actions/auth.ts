'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { logAuditAction } from '@/utils/audit-logger'
import { headers, cookies } from 'next/headers'
import CryptoJS from 'crypto-js'
import { sendSamtricsAlert } from '@/utils/samtrics'

// In-memory rate limiting for admin login (Max 5 attempts per minute)
const loginRateLimit = new Map<string, { count: number, timestamp: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;

export async function loginWithEmailPassword(formData: FormData) {
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';

  if (ip !== 'unknown') {
    const now = Date.now();
    const record = loginRateLimit.get(ip);
    
    if (record) {
      if (now - record.timestamp < RATE_LIMIT_WINDOW_MS) {
        if (record.count >= MAX_LOGIN_ATTEMPTS) {
          return { error: 'Too many login attempts. Please try again later.' };
        }
        record.count += 1;
      } else {
        loginRateLimit.set(ip, { count: 1, timestamp: now });
      }
    } else {
      loginRateLimit.set(ip, { count: 1, timestamp: now });
    }
  }
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const allowedEmail = process.env.DOCTOR_EMAIL
  if (allowedEmail && email.toLowerCase() !== allowedEmail.toLowerCase()) {
    return { error: 'Access Denied: You are not authorized to access this portal.' }
  }

  const supabase = await createClient()

  // Authenticate using Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    await sendSamtricsAlert('ADMIN_LOGIN_FAILED', 'WARNING', { email: email, reason: error.message })
    return { error: error.message }
  }

  await sendSamtricsAlert('ADMIN_LOGIN_SUCCESS', 'INFO', { email: email, ip })

  // ----------------------------------------------------
  // SESSION HIJACKING PREVENTION: Fingerprint Generation
  // ----------------------------------------------------
  const userAgent = headersList.get('user-agent') || 'unknown';
  const fingerprintData = `${ip}-${userAgent}`;
  const secret = process.env.VITE_API_SECRET || "default_development_secret_key_123!";
  const fingerprintHash = CryptoJS.HmacSHA256(fingerprintData, secret).toString(CryptoJS.enc.Hex);

  const cookieStore = await cookies();
  cookieStore.set('dr-admin-fingerprint', fingerprintHash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });

  // Log successful login
  await logAuditAction('LOGIN', { method: 'password' })

  redirect('/admin/dashboard')
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('dr-admin-fingerprint');
  
  const supabase = await createClient()
  await logAuditAction('LOGOUT')
  await supabase.auth.signOut()
  redirect('/admin-login')
}
