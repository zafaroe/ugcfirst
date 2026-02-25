import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local manually
const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
const envVars: Record<string, string> = {}
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function updateTestUser() {
  // First, get the test user
  const { data: users, error: fetchError } = await supabase.auth.admin.listUsers()

  if (fetchError) {
    console.error('Error fetching users:', fetchError)
    return
  }

  const testUser = users.users.find((u) => u.email === 'test@ugcfirst.com')

  if (!testUser) {
    console.log('Test user not found. Creating one...')

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'test@ugcfirst.com',
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: {
        name: 'Test User',
      },
    })

    if (createError) {
      console.error('Error creating user:', createError)
      return
    }

    console.log('Created test user:', newUser.user?.id)
    console.log('Email: test@ugcfirst.com')
    console.log('Password: TestPassword123!')
    return
  }

  // Update the password for existing user
  const { data, error: updateError } = await supabase.auth.admin.updateUserById(
    testUser.id,
    { password: 'TestPassword123!' }
  )

  if (updateError) {
    console.error('Error updating password:', updateError)
    return
  }

  console.log('Updated test user password!')
  console.log('User ID:', testUser.id)
  console.log('Email: test@ugcfirst.com')
  console.log('Password: TestPassword123!')
}

updateTestUser()
