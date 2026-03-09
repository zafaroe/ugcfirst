import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xraudtwmmfsglxxgmcpd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYXVkdHdtbWZzZ2x4eGdtY3BkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY3MzYzNywiZXhwIjoyMDU2MjQ5NjM3fQ.LYy0aLqU6J6Sfm4akqvVUHDx8TaEF1XrC-GBbNXDYLo'
);

// Try to select the persona_profile column
const { data, error } = await supabase
  .from('user_products')
  .select('id, persona_profile')
  .limit(1);

if (error) {
  console.error('Error:', error.message);
  if (error.message.includes('persona_profile')) {
    console.log('\n❌ The persona_profile column does NOT exist.');
    console.log('Run this migration in Supabase SQL Editor:');
    console.log(`
ALTER TABLE user_products
ADD COLUMN IF NOT EXISTS persona_profile JSONB;
`);
  }
} else {
  console.log('✅ persona_profile column exists!');
  console.log('Sample data:', data);
}
