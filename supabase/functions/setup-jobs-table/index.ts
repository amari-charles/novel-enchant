import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Use Postgres client directly via Deno
    const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");

    const dbUrl = Deno.env.get('SUPABASE_DB_URL') ?? '';
    if (!dbUrl) {
      throw new Error('SUPABASE_DB_URL not configured');
    }

    const client = new Client(dbUrl);
    await client.connect();

    try {
      await client.queryArray(`
        CREATE TABLE IF NOT EXISTS jobs (
          id uuid primary key default gen_random_uuid(),
          type text not null,
          payload jsonb not null,
          status text not null check (status in ('queued', 'running', 'completed', 'failed')) default 'queued',
          run_after timestamptz default now(),
          max_attempts int default 3,
          attempts int default 0,
          last_error text,
          reserved_by text,
          lease_until timestamptz,
          user_id uuid,
          run_id uuid,
          scene_id uuid,
          created_at timestamptz default now(),
          updated_at timestamptz default now()
        );
      `);

      await client.queryArray(`CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);`);
      await client.queryArray(`CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);`);
      await client.queryArray(`CREATE INDEX IF NOT EXISTS idx_jobs_run_id ON jobs(run_id);`);
      await client.queryArray(`CREATE INDEX IF NOT EXISTS idx_jobs_run_after ON jobs(run_after);`);
      await client.queryArray(`ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;`);
      await client.queryArray(`DROP POLICY IF EXISTS "Service role can manage jobs" ON jobs;`);
      await client.queryArray(`CREATE POLICY "Service role can manage jobs" ON jobs FOR ALL USING (true);`);

      await client.end();

      return new Response(
        JSON.stringify({ success: true, message: 'Jobs table created successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (dbError) {
      await client.end();
      throw dbError;
    }
  } catch (error) {
    console.error('Setup error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to setup jobs table' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
