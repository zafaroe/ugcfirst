import { resend, EMAIL_CONFIG, isConfigured } from './resend'
import {
  WaitlistConfirmationEmail,
  subject as waitlistSubject,
} from './templates/waitlist-confirmation'
import {
  WelcomeEmail,
  subject as welcomeSubject,
} from './templates/welcome-email'
import {
  WaitlistDay3BehindScenesEmail,
  subject as day3Subject,
} from './templates/waitlist-day3-behind-scenes'
import {
  WaitlistDay7EarlyAccessEmail,
  subject as day7Subject,
} from './templates/waitlist-day7-early-access'
import {
  WaitlistLaunchDayEmail,
  subject as launchSubject,
} from './templates/waitlist-launch-day'

/**
 * Send waitlist confirmation email.
 * Fire-and-forget: logs errors but never throws.
 */
export async function sendWaitlistConfirmation(email: string): Promise<void> {
  if (!isConfigured() || !resend) {
    console.log('[Email] Resend not configured, skipping waitlist confirmation')
    return
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      replyTo: EMAIL_CONFIG.replyTo,
      to: email,
      subject: waitlistSubject,
      react: WaitlistConfirmationEmail({ email }),
    })

    if (error) {
      console.error('[Email] Failed to send waitlist confirmation:', error)
      return
    }

    console.log('[Email] Waitlist confirmation sent:', data?.id)
  } catch (err) {
    console.error('[Email] Error sending waitlist confirmation:', err)
  }
}

/**
 * Send welcome email to new users.
 * Fire-and-forget: logs errors but never throws.
 */
export async function sendWelcomeEmail(
  email: string,
  name?: string
): Promise<void> {
  if (!isConfigured() || !resend) {
    console.log('[Email] Resend not configured, skipping welcome email')
    return
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      replyTo: EMAIL_CONFIG.replyTo,
      to: email,
      subject: welcomeSubject,
      react: WelcomeEmail({ name }),
    })

    if (error) {
      console.error('[Email] Failed to send welcome email:', error)
      return
    }

    console.log('[Email] Welcome email sent:', data?.id)
  } catch (err) {
    console.error('[Email] Error sending welcome email:', err)
  }
}

/**
 * Send Day 3 waitlist nurture email (founder story).
 * Fire-and-forget: logs errors but never throws.
 */
export async function sendWaitlistDay3(email: string): Promise<void> {
  if (!isConfigured() || !resend) {
    console.log('[Email] Resend not configured, skipping Day 3 email')
    return
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      replyTo: EMAIL_CONFIG.replyTo,
      to: email,
      subject: day3Subject,
      react: WaitlistDay3BehindScenesEmail(),
    })

    if (error) {
      console.error('[Email] Failed to send Day 3 email:', error)
      return
    }

    console.log('[Email] Day 3 email sent:', data?.id)
  } catch (err) {
    console.error('[Email] Error sending Day 3 email:', err)
  }
}

/**
 * Send Day 7 waitlist nurture email (early access preview).
 * Fire-and-forget: logs errors but never throws.
 */
export async function sendWaitlistDay7(email: string): Promise<void> {
  if (!isConfigured() || !resend) {
    console.log('[Email] Resend not configured, skipping Day 7 email')
    return
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      replyTo: EMAIL_CONFIG.replyTo,
      to: email,
      subject: day7Subject,
      react: WaitlistDay7EarlyAccessEmail(),
    })

    if (error) {
      console.error('[Email] Failed to send Day 7 email:', error)
      return
    }

    console.log('[Email] Day 7 email sent:', data?.id)
  } catch (err) {
    console.error('[Email] Error sending Day 7 email:', err)
  }
}

/**
 * Send Launch Day waitlist email.
 * Fire-and-forget: logs errors but never throws.
 */
export async function sendWaitlistLaunchDay(email: string): Promise<void> {
  if (!isConfigured() || !resend) {
    console.log('[Email] Resend not configured, skipping Launch Day email')
    return
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      replyTo: EMAIL_CONFIG.replyTo,
      to: email,
      subject: launchSubject,
      react: WaitlistLaunchDayEmail(),
    })

    if (error) {
      console.error('[Email] Failed to send Launch Day email:', error)
      return
    }

    console.log('[Email] Launch Day email sent:', data?.id)
  } catch (err) {
    console.error('[Email] Error sending Launch Day email:', err)
  }
}
