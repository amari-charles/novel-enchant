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
      // Drop old temp chapters table
      await client.queryArray(`DROP TABLE IF EXISTS chapters CASCADE`);

      // Rename enhanced_copies to chapters
      await client.queryArray(`ALTER TABLE enhanced_copies RENAME TO chapters`);

      // Add story_id column
      await client.queryArray(`ALTER TABLE chapters ADD COLUMN story_id uuid REFERENCES stories(id) ON DELETE CASCADE`);

      // Add content column
      await client.queryArray(`ALTER TABLE chapters ADD COLUMN content text`);

      // Migrate data - create story for each chapter
      await client.queryArray(`
        DO $$
        DECLARE
          chapter_record RECORD;
          new_story_id uuid;
        BEGIN
          FOR chapter_record IN SELECT * FROM chapters WHERE story_id IS NULL LOOP
            INSERT INTO stories (user_id, title, created_at)
            VALUES (chapter_record.user_id, chapter_record.title, chapter_record.created_at)
            RETURNING id INTO new_story_id;

            UPDATE chapters
            SET story_id = new_story_id, content = chapter_record.original_content
            WHERE id = chapter_record.id;
          END LOOP;
        END $$;
      `);

      // Make story_id NOT NULL
      await client.queryArray(`ALTER TABLE chapters ALTER COLUMN story_id SET NOT NULL`);

      // Drop original_content
      await client.queryArray(`ALTER TABLE chapters DROP COLUMN IF EXISTS original_content`);

      // Update RLS policies
      await client.queryArray(`DROP POLICY IF EXISTS "Users can view own enhanced copies" ON chapters`);
      await client.queryArray(`DROP POLICY IF EXISTS "Users can insert own enhanced copies" ON chapters`);
      await client.queryArray(`DROP POLICY IF EXISTS "Users can update own enhanced copies" ON chapters`);
      await client.queryArray(`DROP POLICY IF EXISTS "Users can delete own enhanced copies" ON chapters`);

      await client.queryArray(`CREATE POLICY "Users can view own chapters" ON chapters FOR SELECT USING (auth.uid() = user_id)`);
      await client.queryArray(`CREATE POLICY "Users can insert own chapters" ON chapters FOR INSERT WITH CHECK (auth.uid() = user_id)`);
      await client.queryArray(`CREATE POLICY "Users can update own chapters" ON chapters FOR UPDATE USING (auth.uid() = user_id)`);
      await client.queryArray(`CREATE POLICY "Users can delete own chapters" ON chapters FOR DELETE USING (auth.uid() = user_id)`);

      // Update indexes
      await client.queryArray(`DROP INDEX IF EXISTS idx_enhanced_copies_user_id`);
      await client.queryArray(`CREATE INDEX IF NOT EXISTS idx_chapters_user_id ON chapters(user_id)`);
      await client.queryArray(`CREATE INDEX IF NOT EXISTS idx_chapters_story_id ON chapters(story_id)`);

      // Add columns to stories
      await client.queryArray(`ALTER TABLE stories ADD COLUMN IF NOT EXISTS description text`);
      await client.queryArray(`ALTER TABLE stories ADD COLUMN IF NOT EXISTS author text`);
      await client.queryArray(`ALTER TABLE stories ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now()`);

      await client.end();

      return new Response(
        JSON.stringify({ success: true, message: 'Database restructured successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (dbError) {
      await client.end();
      throw dbError;
    }
  } catch (error) {
    console.error('Restructure error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to restructure' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
