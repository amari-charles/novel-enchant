import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SupabaseUrlService } from "../../../packages/providers/url/supabase-url.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get JWT token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7);

    // Create Supabase client with user's JWT token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    // Get runId from body (POST request)
    const body = await req.json().catch(() => ({}));
    const { runId } = body;

    if (!runId) {
      return new Response(
        JSON.stringify({ error: 'Missing runId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: run } = await supabase.from("enhancement_runs").select("*").eq("id", runId).single();
    if (!run) {
      return new Response(
        JSON.stringify({ error: 'Run not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: scenes } = await supabase.from("scenes").select("id,idx,title").eq("enhancement_run_id", runId).order("idx");
    const { data: pointers } = await supabase.from("scenes_current_image").select("scene_id,image_id").in("scene_id", scenes?.map(s => s.id) || []);
    const { data: images } = await supabase.from("scene_images").select("id,storage_path").in("id", pointers?.map(p => p.image_id) || []);

    const urlSvc = new SupabaseUrlService();
    const signed = await Promise.all(images?.map(async i => ({ id: i.id, url: await urlSvc.signedUrl(i.storage_path, 3600) })) || []);
    const byId = new Map(signed.map(s => [s.id, s.url]));

    const payload = {
      status: run.status,
      scenes: (scenes || []).map(s => ({
        sceneId: s.id,
        idx: s.idx,
        title: s.title,
        currentImage: (() => {
          const pid = pointers?.find(p => p.scene_id === s.id)?.image_id;
          return pid ? { url: byId.get(pid)! } : undefined;
        })()
      })),
      startedAt: run.started_at,
      finishedAt: run.finished_at
    };

    return new Response(
      JSON.stringify(payload),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Status check error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to get status' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});