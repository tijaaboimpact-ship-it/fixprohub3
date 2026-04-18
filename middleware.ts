import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refreshes the Supabase session on every matched request so SSR / Route Handlers
 * see an up-to-date auth cookie.
 *
 * Note: `createMiddlewareClient` from legacy `@supabase/auth-helpers-nextjs` was
 * removed; Supabase now documents `createServerClient` from `@supabase/ssr` for
 * middleware (same underlying SSR cookie contract).
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      'Supabase middleware: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) in .env.local'
    )
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value)
        })
      },
    },
  })

  // Triggers refresh / cookie sync; do not add logic between client creation and this call.
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Skip Next internals and common static assets so middleware stays fast.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
