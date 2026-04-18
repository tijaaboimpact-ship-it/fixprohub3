'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useCallback, useState, type ReactNode } from 'react'

type GoogleSignInButtonProps = {
  className?: string
  children?: ReactNode
}

/**
 * Google OAuth for Next.js App Router + Supabase (PKCE + cookie session).
 * Uses `createBrowserClient` from `@supabase/ssr` so the code verifier lines up
 * with the server-side `exchangeCodeForSession` route.
 */
export function GoogleSignInButton({ className, children }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signInWithGoogle = useCallback(async () => {
    setLoading(true)
    setError(null)

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    if (!url || !key) {
      setError(
        'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)'
      )
      setLoading(false)
      return
    }

    const supabase = createBrowserClient(url, key)

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (oauthError) {
      setError(oauthError.message)
    }

    setLoading(false)
  }, [])

  return (
    <div>
      <button
        type="button"
        onClick={() => void signInWithGoogle()}
        disabled={loading}
        className={className}
      >
        {children ?? (loading ? 'Redirecting…' : 'Continue with Google')}
      </button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
