import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lxwnlwjauhpgigvgykbb.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4d25sd2phdWhwZ2lndmd5a2JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA1NjA1NCwiZXhwIjoyMDg3NjMyMDU0fQ.2-uE1DLqxe2A3ySqeFW-XUyh1mwE7fahoSMwR_mSXBw'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('Running email tracking migration via Supabase...')

  // Run each ALTER TABLE statement via RPC
  const migrations = [
    'ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS day3_sent_at TIMESTAMPTZ DEFAULT NULL',
    'ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS day7_sent_at TIMESTAMPTZ DEFAULT NULL',
    'ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS launch_sent_at TIMESTAMPTZ DEFAULT NULL',
    'CREATE INDEX IF NOT EXISTS idx_waitlist_email_tracking ON public.waitlist(created_at) WHERE day3_sent_at IS NULL OR day7_sent_at IS NULL'
  ]

  for (const sql of migrations) {
    console.log(`Executing: ${sql.substring(0, 60)}...`)
    const { error } = await supabase.rpc('exec_sql', { query: sql })
    if (error) {
      // exec_sql might not exist, try direct approach
      console.log('Note: exec_sql not available, will need to run in Supabase SQL Editor')
    } else {
      console.log('✓ Success')
    }
  }

  // Verify by querying the table
  console.log('\nVerifying columns...')
  const { data, error } = await supabase
    .from('waitlist')
    .select('id, email, day3_sent_at, day7_sent_at, launch_sent_at')
    .limit(1)

  if (error) {
    if (error.message.includes('day3_sent_at') || error.message.includes('day7_sent_at') || error.message.includes('launch_sent_at')) {
      console.log('❌ Columns not found - migration needs to be run manually in Supabase SQL Editor')
      console.log('\nRun this SQL in Supabase SQL Editor:')
      console.log('---')
      console.log(`ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS day3_sent_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS day7_sent_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS launch_sent_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_waitlist_email_tracking
  ON public.waitlist(created_at)
  WHERE day3_sent_at IS NULL OR day7_sent_at IS NULL;`)
      console.log('---')
    } else {
      console.error('Query error:', error.message)
    }
  } else {
    console.log('✓ Columns verified!')
    if (data && data.length > 0) {
      console.log('Sample row columns:', Object.keys(data[0]))
    }
  }
}

runMigration()
