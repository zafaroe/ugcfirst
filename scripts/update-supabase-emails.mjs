#!/usr/bin/env node
/**
 * Update Supabase Auth Email Templates
 *
 * Usage:
 * 1. Get your access token from: https://supabase.com/dashboard/account/tokens
 * 2. Run: SUPABASE_ACCESS_TOKEN=your_token node scripts/update-supabase-emails.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PROJECT_REF = 'lxwnlwjauhpgigvgykbb'
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN

if (!ACCESS_TOKEN) {
  console.error('❌ Missing SUPABASE_ACCESS_TOKEN')
  console.log('')
  console.log('To get your access token:')
  console.log('1. Go to https://supabase.com/dashboard/account/tokens')
  console.log('2. Generate a new access token')
  console.log('3. Run: SUPABASE_ACCESS_TOKEN=your_token node scripts/update-supabase-emails.mjs')
  process.exit(1)
}

const templates = {
  confirm_signup: 'confirm-signup.html',
  reset_password: 'reset-password.html',
  magic_link: 'magic-link.html',
  invite: 'invite-user.html',
}

async function updateEmailTemplates() {
  console.log('📧 Updating Supabase email templates...\n')

  // First, get current config
  const getResponse = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
    {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!getResponse.ok) {
    const error = await getResponse.text()
    console.error('❌ Failed to get current config:', error)
    process.exit(1)
  }

  const currentConfig = await getResponse.json()

  // Read templates and build update payload
  const templateDir = path.join(__dirname, '..', 'supabase', 'email-templates')

  const emailConfig = {}

  for (const [key, filename] of Object.entries(templates)) {
    const filePath = path.join(templateDir, filename)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')

      // Map to Supabase config keys
      const configKey = `mailer_templates_${key}_content`
      emailConfig[configKey] = content

      console.log(`✓ Loaded ${filename}`)
    } else {
      console.log(`⚠ Template not found: ${filename}`)
    }
  }

  // Update the config
  const updateResponse = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailConfig),
    }
  )

  if (!updateResponse.ok) {
    const error = await updateResponse.text()
    console.error('\n❌ Failed to update templates:', error)
    process.exit(1)
  }

  console.log('\n✅ All email templates updated successfully!')
}

updateEmailTemplates().catch(console.error)
