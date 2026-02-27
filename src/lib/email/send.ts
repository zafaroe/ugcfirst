import { resend, EMAIL_CONFIG, isConfigured } from './resend'
import {
  WaitlistConfirmationEmail,
  subject as waitlistSubject,
} from './templates/waitlist-confirmation'
import {
  WelcomeEmail,
  subject as welcomeSubject,
} from './templates/welcome-email'

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
