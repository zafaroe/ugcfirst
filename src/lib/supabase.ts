import { createClient, SupabaseClient, User } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

// ============================================
// ENVIRONMENT VARIABLES
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// ============================================
// CLIENT-SIDE SUPABASE CLIENT
// Uses anon key with RLS enforcement
// ============================================

let supabase: SupabaseClient | null = null

// Only create the client on the server side during module initialization
// For browser, we'll create it lazily to ensure proper session handling
if (typeof window === 'undefined' && supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

// Browser-side singleton
let browserSupabase: SupabaseClient | null = null

/**
 * Get Supabase client for browser-side use
 * Uses @supabase/ssr for proper cookie-based auth in Next.js
 */
export function getBrowserClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error('getBrowserClient should only be called on the client side')
  }

  if (!browserSupabase) {
    // These come from NEXT_PUBLIC_ env vars, compiled at build time
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !anonKey) {
      console.error('[Supabase] Missing env vars:', {
        hasUrl: !!url,
        hasAnonKey: !!anonKey,
      })
      throw new Error('Supabase environment variables not configured. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
    }
    // Use createBrowserClient from @supabase/ssr for proper Next.js integration
    browserSupabase = createBrowserClient(url, anonKey)
  }

  return browserSupabase
}

// ============================================
// SERVER-SIDE SUPABASE CLIENT
// Uses service role key - bypasses RLS
// ONLY use in API routes and server actions
// ============================================

let supabaseAdmin: SupabaseClient | null = null

if (supabaseUrl && supabaseServiceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Get the admin Supabase client (bypasses RLS)
 * @throws Error if not configured
 */
export function getAdminClient(): SupabaseClient {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured. Check SUPABASE_SERVICE_ROLE_KEY.')
  }
  return supabaseAdmin
}

/**
 * Get the public Supabase client (respects RLS)
 * @throws Error if not configured
 */
export function getPublicClient(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase client not configured. Check environment variables.')
  }
  return supabase
}

// ============================================
// AUTH VERIFICATION SINGLETON
// Reuses the public client for token verification
// ============================================

// Singleton for auth verification (uses anon key)
let authClient: SupabaseClient | null = null

export function getAuthClient(): SupabaseClient {
  if (!authClient) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase environment variables not configured')
    }
    authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return authClient
}

/**
 * Verify auth token and return user
 * Uses singleton client to avoid creating new connections
 */
export async function verifyAuth(request: NextRequest): Promise<{ user: User | null; error: string | null }> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Unauthorized' }
  }

  const token = authHeader.replace('Bearer ', '')
  const client = getAuthClient()

  const { data: { user }, error: authError } = await client.auth.getUser(token)

  if (authError || !user) {
    return { user: null, error: 'Invalid or expired token' }
  }

  return { user, error: null }
}

/**
 * Helper to create unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 })
}

export { supabase, supabaseAdmin }
