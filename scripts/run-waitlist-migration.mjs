import postgres from 'postgres'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const connectionString = 'postgresql://postgres.lxwnlwjauhpgigvgykbb:Wd2sXmvzAzNSjK7!@aws-0-us-east-1.pooler.supabase.com:5432/postgres'

async function runMigration() {
  console.log('Connecting to database...')

  const sql = postgres(connectionString, {
    ssl: 'require',
    prepare: false,
    connect_timeout: 30
  })

  try {
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260226_add_waitlist.sql')
    const migration = readFileSync(migrationPath, 'utf-8')

    console.log('Running waitlist migration...')

    // Execute each statement separately
    const statements = migration
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      if (statement.includes('CREATE TABLE') ||
          statement.includes('ALTER TABLE') ||
          statement.includes('CREATE POLICY') ||
          statement.includes('DROP POLICY') ||
          statement.includes('CREATE INDEX') ||
          statement.includes('GRANT')) {
        try {
          await sql.unsafe(statement)
          console.log('✓ Executed:', statement.substring(0, 60) + '...')
        } catch (err) {
          if (err.message.includes('already exists')) {
            console.log('⏭ Skipped (already exists):', statement.substring(0, 60) + '...')
          } else {
            console.error('✗ Error:', err.message)
          }
        }
      }
    }

    console.log('\n✓ Migration complete!')

    // Test inserting a record
    console.log('\nTesting insert...')
    const result = await sql`
      INSERT INTO public.waitlist (email, source)
      VALUES ('test-migration@example.com', 'migration_test')
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email
    `
    console.log('Test insert result:', result)

    // Clean up test record
    await sql`DELETE FROM public.waitlist WHERE email = 'test-migration@example.com'`
    console.log('Test record cleaned up')

  } catch (err) {
    console.error('Migration error:', err)
  } finally {
    await sql.end()
  }
}

runMigration()
