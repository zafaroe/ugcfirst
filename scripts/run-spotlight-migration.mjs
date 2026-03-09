import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function runMigration() {
  console.log('Running spotlight mode migration...\n');

  // Drop existing constraint
  const { error: dropError } = await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE generations DROP CONSTRAINT IF EXISTS generations_mode_check`
  });

  if (dropError) {
    // Try using direct SQL query via postgres extension
    console.log('Using direct Supabase query approach...');
  }

  // Use direct queries
  try {
    // Test by adding a spotlight generation to see if the constraint exists
    const { error: testError } = await supabase
      .from('generations')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Will fail but shows the error
        product_name: 'Test',
        product_image_url: 'https://test.com/img.png',
        mode: 'spotlight',
      });

    if (testError) {
      console.log('Current error when inserting spotlight:', testError.message);
      console.log('\n⚠️  The database constraint needs to be updated manually.');
      console.log('Please run this SQL in Supabase SQL Editor:\n');
      console.log('-------------------------------------------');
      console.log(`
-- Drop existing constraint
ALTER TABLE generations DROP CONSTRAINT IF EXISTS generations_mode_check;

-- Add new constraint with spotlight
ALTER TABLE generations ADD CONSTRAINT generations_mode_check
  CHECK (mode IN ('diy', 'concierge', 'spotlight'));

-- Add spotlight columns
ALTER TABLE generations ADD COLUMN IF NOT EXISTS spotlight_category_id TEXT;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS spotlight_style_id TEXT;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS spotlight_duration TEXT DEFAULT '5';
`);
      console.log('-------------------------------------------');
    } else {
      console.log('✅ Spotlight mode is already supported!');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

runMigration();
