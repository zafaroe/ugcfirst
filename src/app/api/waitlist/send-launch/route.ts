import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { sendWaitlistLaunchDay } from '@/lib/email'

/**
 * POST /api/waitlist/send-launch
 *
 * Manual trigger to send launch email to ALL waitlist subscribers
 * who haven't received it yet.
 *
 * Requires x-launch-secret header matching LAUNCH_EMAIL_SECRET env var.
 *
 * Usage:
 * curl -X POST http://localhost:3000/api/waitlist/send-launch \
 *   -H "x-launch-secret: your-secret-here"
 */
export async function POST(request: NextRequest) {
  // Simple auth check — require a secret header to prevent accidental triggers
  const authHeader = request.headers.get('x-launch-secret')
  if (authHeader !== process.env.LAUNCH_EMAIL_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdminClient()

  // Get all waitlist subscribers who haven't received the launch email
  const { data: recipients, error } = await supabase
    .from('waitlist')
    .select('id, email')
    .is('launch_sent_at', null)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json(
      { error: 'Database error', details: error.message },
      { status: 500 }
    )
  }

  if (!recipients?.length) {
    return NextResponse.json({ message: 'No recipients to send to', sent: 0 })
  }

  console.log(`[Launch Email] Starting send to ${recipients.length} recipients`)

  let sent = 0
  let failed = 0

  for (const recipient of recipients) {
    try {
      await sendWaitlistLaunchDay(recipient.email)
      await supabase
        .from('waitlist')
        .update({ launch_sent_at: new Date().toISOString() })
        .eq('id', recipient.id)
      sent++

      // Rate limit: ~2 emails per second to stay within Resend limits
      await new Promise((resolve) => setTimeout(resolve, 500))
    } catch (err) {
      console.error(`[Launch Email] Failed for ${recipient.email}:`, err)
      failed++
    }
  }

  console.log(`[Launch Email] Complete. Sent: ${sent}, Failed: ${failed}`)

  return NextResponse.json({
    message: 'Launch emails sent',
    total: recipients.length,
    sent,
    failed,
  })
}
