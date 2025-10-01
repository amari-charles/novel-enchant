import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");

    const dbUrl = Deno.env.get('SUPABASE_DB_URL') ?? '';
    if (!dbUrl) {
      throw new Error('SUPABASE_DB_URL not configured');
    }

    const client = new Client(dbUrl);
    await client.connect();

    try {
      // Add user_id column
      await client.queryArray(`ALTER TABLE enhancement_runs ADD COLUMN IF NOT EXISTS user_id uuid`);

      // Update RLS policies
      const policies = [
        `DROP POLICY IF EXISTS "Users can view runs of own chapters" ON enhancement_runs`,
        `CREATE POLICY "Users can view runs of own chapters" ON enhancement_runs FOR SELECT USING (
          auth.role() = 'service_role' OR
          user_id = auth.uid() OR
          (chapter_id IS NOT NULL AND chapter_id IN (
            SELECT c.id FROM chapters c
            JOIN stories s ON c.story_id = s.id
            WHERE s.user_id = auth.uid()
          ))
        )`,
        `DROP POLICY IF EXISTS "Users can insert runs for own chapters" ON enhancement_runs`,
        `CREATE POLICY "Users can insert runs for own chapters" ON enhancement_runs FOR INSERT WITH CHECK (
          auth.role() = 'service_role' OR
          user_id = auth.uid() OR
          (chapter_id IS NOT NULL AND chapter_id IN (
            SELECT c.id FROM chapters c
            JOIN stories s ON c.story_id = s.id
            WHERE s.user_id = auth.uid()
          ))
        )`,
        `DROP POLICY IF EXISTS "Users can update runs of own chapters" ON enhancement_runs`,
        `CREATE POLICY "Users can update runs of own chapters" ON enhancement_runs FOR UPDATE USING (
          auth.role() = 'service_role' OR
          user_id = auth.uid() OR
          (chapter_id IS NOT NULL AND chapter_id IN (
            SELECT c.id FROM chapters c
            JOIN stories s ON c.story_id = s.id
            WHERE s.user_id = auth.uid()
          ))
        )`,
        `DROP POLICY IF EXISTS "Users can view scenes of own runs" ON scenes`,
        `CREATE POLICY "Users can view scenes of own runs" ON scenes FOR SELECT USING (
          auth.role() = 'service_role' OR
          enhancement_run_id IN (
            SELECT r.id FROM enhancement_runs r
            WHERE r.user_id = auth.uid()
              OR (r.chapter_id IS NOT NULL AND r.chapter_id IN (
                SELECT c.id FROM chapters c
                JOIN stories s ON c.story_id = s.id
                WHERE s.user_id = auth.uid()
              ))
          )
        )`,
        `DROP POLICY IF EXISTS "Users can insert scenes to own runs" ON scenes`,
        `CREATE POLICY "Users can insert scenes to own runs" ON scenes FOR INSERT WITH CHECK (
          auth.role() = 'service_role' OR
          enhancement_run_id IN (
            SELECT r.id FROM enhancement_runs r
            WHERE r.user_id = auth.uid()
              OR (r.chapter_id IS NOT NULL AND r.chapter_id IN (
                SELECT c.id FROM chapters c
                JOIN stories s ON c.story_id = s.id
                WHERE s.user_id = auth.uid()
              ))
          )
        )`,
        `DROP POLICY IF EXISTS "Users can update scenes of own runs" ON scenes`,
        `CREATE POLICY "Users can update scenes of own runs" ON scenes FOR UPDATE USING (
          auth.role() = 'service_role' OR
          enhancement_run_id IN (
            SELECT r.id FROM enhancement_runs r
            WHERE r.user_id = auth.uid()
              OR (r.chapter_id IS NOT NULL AND r.chapter_id IN (
                SELECT c.id FROM chapters c
                JOIN stories s ON c.story_id = s.id
                WHERE s.user_id = auth.uid()
              ))
          )
        )`
      ];

      for (const policy of policies) {
        await client.queryArray(policy);
      }

      await client.end();

      return new Response(
        JSON.stringify({ success: true, message: 'Migration applied successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (dbError) {
      await client.end();
      throw dbError;
    }
  } catch (error) {
    console.error('Migration error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to apply migration' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
