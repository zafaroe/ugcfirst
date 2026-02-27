import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY

if (!RESEND_API_KEY) {
  console.warn('RESEND_API_KEY not configured. Email features disabled.')
}

export const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

export const EMAIL_CONFIG = {
  from: 'UGCFirst <hello@ugcfirst.com>',
  replyTo: 'support@ugcfirst.com',
}

export function isConfigured(): boolean {
  return !!resend
}
