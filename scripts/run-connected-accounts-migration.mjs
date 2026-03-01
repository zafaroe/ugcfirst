import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const supabaseUrl = 'https://lxwnlwjauhpgigvgykbb.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4d25sd2phdWhwZ2lndmd5a2JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA1NjA1NCwiZXhwIjoyMDg3NjMyMDU0fQ.2-uE1DLqxe2A3ySqeFW-XUyh1mwE7fahoSMwR_mSXBw'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('Running connected_accounts migration...\n')

  // Read the migration file
  const migrationPath = join(__dirname, '../supabase/migrations/20260301_connected_accounts.sql')
  const sql = readFileSync(migrationPath, 'utf8')

  console.log('Migration SQL to run in Supabase SQL Editor:')
  console.log('=' .repeat(60))
  console.log(sql)
  console.log('=' .repeat(60))

  // Try to verify if table exists
  console.log('\nVerifying table...')
  const { data, error } = await supabase
    .from('connected_accounts')
    .select('id')
    .limit(1)

  if (error) {
    if (error.message.includes('does not exist') || error.code === '42P01') {
      console.log('❌ Table does not exist - please run the SQL above in Supabase SQL Editor')
    } else {
      console.log('Query error:', error.message)
      console.log('\nPlease run the SQL above in Supabase SQL Editor at:')
      console.log('https://supabase.com/dashboard/project/lxwnlwjauhpgigvgykbb/sql/new')
    }
  } else {
    console.log('✓ Table exists!')
    console.log(`Found ${data?.length || 0} rows`)
  }
}

runMigration()
