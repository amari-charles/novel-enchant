import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { supa } from "../../../packages/dal/db.ts";
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
    const url = new URL(req.url);
    const runId = url.searchParams.get('runId');

    if (!runId) {
      return new Response(
        JSON.stringify({ error: 'Missing runId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: run } = await supa().from("enhancement_runs").select("*").eq("id", runId).single();
    if (!run) {
      return new Response(
        JSON.stringify({ error: 'Run not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: scenes } = await supa().from("scenes").select("id,idx,title").eq("enhancement_run_id", runId).order("idx");
    const { data: pointers } = await supa().from("scenes_current_image").select("scene_id,image_id").in("scene_id", scenes?.map(s => s.id) || []);
    const { data: images } = await supa().from("images").select("id,storage_path").in("id", pointers?.map(p => p.image_id) || []);

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