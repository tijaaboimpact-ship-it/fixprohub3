import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * OAuth PKCE callback: exchanges `?code=` for a session stored in cookies, then
 * redirects into the app.
 *
 * Note: legacy `createRouteHandlerClient` was removed from `@supabase/auth-helpers-nextjs`;
 * Supabase documents `createServerClient` from `@supabase/ssr` for Route Handlers.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  let next = searchParams.get('next') ?? '/dashboard'
  if (!next.startsWith('/')) {
    next = '/dashboard'
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: 'Missing NEXT_PUBLIC_SUPABASE_URL or anon/publishable key' },
      { status: 500 }
    )
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  const cookieStore = await cookies()
  let authCookieHeaders: Record<string, string> = {}

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet, headers) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // If `cookies()` is read-only in this context, rely on middleware refresh.
        }
        authCookieHeaders = headers
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocal = process.env.NODE_ENV === 'development'

  const destination = isLocal
    ? `${origin}${next}`
    : forwardedHost
      ? `https://${forwardedHost}${next}`
      : `${origin}${next}`

  const response = NextResponse.redirect(destination)
  Object.entries(authCookieHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}
