import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sendWelcomeEmail } from '@/lib/email'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Default redirect to login with error
  let redirectTo = `${origin}/login?error=auth_failed`

  if (code) {
    const cookieStore = await cookies()

    // Track cookies that need to be set on the response
    const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookies) {
            cookies.forEach(({ name, value, options }) => {
              cookiesToSet.push({ name, value, options: options as Record<string, unknown> })
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if this is a password recovery flow
      const type = searchParams.get('type')
      if (type === 'recovery') {
        redirectTo = `${origin}/reset-password`
      } else {
        // Check if user has completed onboarding
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // Use service role client to check user_credits (bypasses RLS)
          const adminClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
              auth: {
                autoRefreshToken: false,
                persistSession: false,
              },
            }
          )

          const { data: credits } = await adminClient
            .from('user_credits')
            .select('onboarding_completed')
            .eq('user_id', user.id)
            .single()

          // Redirect new users to onboarding
          if (!credits?.onboarding_completed) {
            // Send welcome email to new users (fire and forget)
            sendWelcomeEmail(user.email!, user.user_metadata?.name).catch(() => {})
            redirectTo = `${origin}/onboarding`
          } else {
            redirectTo = `${origin}/dashboard`
          }
        } else {
          redirectTo = `${origin}/dashboard`
        }
      }
    }

    // Create redirect response and set all cookies on it
    const response = NextResponse.redirect(redirectTo)

    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })

    return response
  }

  return NextResponse.redirect(redirectTo)
}
