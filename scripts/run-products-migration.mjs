import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkAndReportMigration() {
  console.log('Checking user_products table...');

  // Try to query the table
  const { data, error } = await supabase.from('user_products').select('id').limit(1);

  if (error) {
    if (error.code === '42P01') {
      console.error('\n❌ Table user_products does not exist!');
      console.log('\nPlease run this SQL in your Supabase SQL Editor:');
      console.log('https://supabase.com/dashboard/project/lrqkgrqjdaaborpjvzgb/sql/new\n');
      console.log('--- Copy this SQL ---\n');
      console.log(`
CREATE TABLE IF NOT EXISTS user_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  images JSONB DEFAULT '[]',
  price TEXT,
  features JSONB DEFAULT '[]',
  source TEXT NOT NULL CHECK (source IN ('url', 'manual')),
  source_url TEXT,
  generation_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_products_user_id ON user_products(user_id);
CREATE INDEX IF NOT EXISTS idx_user_products_last_used ON user_products(user_id, last_used_at DESC NULLS LAST);

ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own products" ON user_products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own products" ON user_products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products" ON user_products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own products" ON user_products FOR DELETE USING (auth.uid() = user_id);
`);
      process.exit(1);
    } else {
      console.error('Error querying table:', error.message);
      process.exit(1);
    }
  } else {
    console.log('✅ Table user_products exists and is accessible!');
    console.log(`Found ${data?.length || 0} products in initial query.`);
  }
}

checkAndReportMigration().catch(console.error);
