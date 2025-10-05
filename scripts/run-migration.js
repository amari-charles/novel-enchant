/**
 * Run migration SQL against remote Supabase database
 * Usage: VITE_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/run-migration.js
 */
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const { createClient } = await import('@supabase/supabase-js');

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cquunkrscfpocntjekfq.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Read migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20251003000000_polymorphic_media_ownership.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Running migration: 20251003000000_polymorphic_media_ownership.sql');
  console.log('SQL length:', sql.length, 'characters');

  // Split SQL into individual statements (simple split on semicolon)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Executing ${statements.length} SQL statements...`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    console.log(`\n[${i + 1}/${statements.length}] Executing...`);

    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement,
      });

      if (error) {
        console.error('Error:', error);
        // Continue with other statements
      } else {
        console.log('✓ Success');
      }
    } catch (err) {
      console.error('Exception:', err.message);
    }
  }

  console.log('\n✅ Migration execution completed!');
}

runMigration().catch(console.error);
