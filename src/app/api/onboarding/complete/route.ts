import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, getAdminClient, unauthorizedResponse } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const { user, error } = await verifyAuth(request)
  if (error || !user) {
    return unauthorizedResponse(error || 'Unauthorized')
  }

  try {
    const adminClient = getAdminClient()

    // Update database flag (bypasses RLS via service role)
    await adminClient
      .from('user_credits')
      .update({ onboarding_completed: true })
      .eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Failed to mark onboarding complete:', err)
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}
