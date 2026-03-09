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

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1];
console.log('Project ref:', projectRef);

async function createTable() {
  console.log('Creating user_products table via SQL API...');

  const sql = `
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

    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_products' AND policyname = 'Users can view own products') THEN
        CREATE POLICY "Users can view own products" ON user_products FOR SELECT USING (auth.uid() = user_id);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_products' AND policyname = 'Users can insert own products') THEN
        CREATE POLICY "Users can insert own products" ON user_products FOR INSERT WITH CHECK (auth.uid() = user_id);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_products' AND policyname = 'Users can update own products') THEN
        CREATE POLICY "Users can update own products" ON user_products FOR UPDATE USING (auth.uid() = user_id);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_products' AND policyname = 'Users can delete own products') THEN
        CREATE POLICY "Users can delete own products" ON user_products FOR DELETE USING (auth.uid() = user_id);
      END IF;
    END $$;
  `;

  // Use the SQL API endpoint
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({ sql }),
  });

  if (!response.ok) {
    // Try using the direct postgres connection via postgrest
    console.log('exec_sql RPC not available, trying alternative...');

    // We can use the supabase-js to execute raw SQL via management API
    // But that requires management API access. Let's try a different approach.

    // Create the table using the Management API
    const mgmtResponse = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!mgmtResponse.ok) {
      console.log('Management API also not available.');
      console.log('\n⚠️  Please run this SQL manually in the Supabase SQL Editor:\n');
      console.log(`https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
      console.log(sql);
      process.exit(1);
    }
  }

  console.log('✅ Table created successfully!');
}

createTable().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
