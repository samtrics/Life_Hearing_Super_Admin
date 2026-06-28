import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import CryptoJS from 'crypto-js'

export async function createClient() {
  const cookieStore = await cookies()
  const SECRET_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: 'dr-admin-portal',
      },
      cookies: {
        getAll() {
          return cookieStore.getAll().map(cookie => {
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
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              if (name.startsWith('dr-admin-portal')) {
                const encrypted = CryptoJS.AES.encrypt(value, SECRET_KEY).toString()
                cookieStore.set(name, encrypted, options)
              } else {
                cookieStore.set(name, value, options)
              }
            })
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  )
}
