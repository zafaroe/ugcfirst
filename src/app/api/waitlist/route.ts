import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email, source = 'landing_page' } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Create admin client inline to avoid module initialization issues
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Waitlist error: Missing Supabase environment variables')
      return NextResponse.json(
        { success: false, message: 'Service configuration error. Please try again later.' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { error } = await supabase
      .from('waitlist')
      .insert({ email: email.toLowerCase().trim(), source })

    if (error) {
      // Check for duplicate email (unique constraint violation)
      if (error.code === '23505') {
        return NextResponse.json({
          success: true,
          message: "You're already on the waitlist! We'll notify you when we launch.",
          isAlreadySubscribed: true,
        })
      }

      console.error('Waitlist Supabase error:', error)
      return NextResponse.json(
        { success: false, message: 'Something went wrong. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "You're on the list! We'll notify you when we launch.",
    })
  } catch (err) {
    console.error('Waitlist error:', err)
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
