import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import CryptoJS from 'crypto-js'
import { sendSamtricsAlert } from '@/utils/samtrics'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const SECRET_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: 'dr-admin-portal',
      },
      cookies: {
        getAll() {
          return request.cookies.getAll().map(cookie => {
            if (cookie.name.startsWith('dr-admin-portal')) {
              try {
                const decrypted = CryptoJS.AES.decrypt(cookie.value, SECRET_KEY).toString(CryptoJS.enc.Utf8)
                return { ...cookie, value: decrypted || cookie.value }
              } catch {
                return cookie
              }
            }
            return cookie
          })
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const finalValue = name.startsWith('dr-admin-portal') ? CryptoJS.AES.encrypt(value, SECRET_KEY).toString() : value
            request.cookies.set(name, finalValue)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            const finalValue = name.startsWith('dr-admin-portal') ? CryptoJS.AES.encrypt(value, SECRET_KEY).toString() : value
            supabaseResponse.cookies.set(name, finalValue, options)
          })
        },
      },
    }
  )

  // Fast, local verification (safe because our cookies are AES encrypted)
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user

  if (user) {
    // ----------------------------------------------------
    // SESSION HIJACKING PREVENTION: Fingerprint Validation
    // ----------------------------------------------------
    const storedFingerprint = request.cookies.get('dr-admin-fingerprint')?.value;
    
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const clientUserAgent = request.headers.get('user-agent') || 'unknown';
    const fingerprintData = `${clientIp}-${clientUserAgent}`;
    const secret = process.env.VITE_API_SECRET || "default_development_secret_key_123!";
    const expectedFingerprint = CryptoJS.HmacSHA256(fingerprintData, secret).toString(CryptoJS.enc.Hex);

    if (!storedFingerprint || storedFingerprint !== expectedFingerprint) {
      // Fingerprint mismatch (Session stolen or missing cookie)
      await sendSamtricsAlert('SESSION_HIJACKING_ATTEMPT', 'CRITICAL', { clientIp, clientUserAgent })
      await supabase.auth.signOut();
      supabaseResponse.cookies.delete('dr-admin-fingerprint');
      
      const url = request.nextUrl.clone();
      url.pathname = '/admin-login';
      return NextResponse.redirect(url);
    }
  }

  const isAuthRoute = request.nextUrl.pathname.startsWith('/admin-login')
  const isAdminRoute = (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/api/admin')) && !isAuthRoute

  // UN-BYPASSABLE ROLE CHECK: If logged in but email doesn't match DOCTOR_EMAIL, clear session
  const allowedEmail = process.env.DOCTOR_EMAIL
  if (user && allowedEmail && user.email?.toLowerCase() !== allowedEmail.toLowerCase()) {
    await supabase.auth.signOut()
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/admin-login'
    return NextResponse.redirect(url)
  }

  // If user is not signed in and the current path is under /admin, redirect to /admin-login
  if (!user && isAdminRoute) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/admin-login'
    return NextResponse.redirect(url)
  }

  // If user is signed in and current path is /admin-login, redirect to /admin/dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
