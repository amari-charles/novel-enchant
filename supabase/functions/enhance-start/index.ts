import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createRun } from "../../../packages/dal/runs.ts";
import { Registry } from "../../../packages/registry.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
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

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Create Supabase client with the user's JWT token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    // Get user from JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { chapterId, chapterText, chapterTitle, stylePreset, capScenes } = body;

    // Accept either chapterId (legacy) or chapterText (new direct approach)
    if (!chapterId && !chapterText) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: chapterId or chapterText' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const policy = {
      pipelineVersion: 'v1_simple',
      textProvider: 'stub',
      imageProvider: 'stub',
      moderationProvider: 'stub',
      consistencyPolicy: 'none',
      capScenes: capScenes || 10,
      imageDefaults: { width: 1280, height: 720, format: 'webp' as const }
    };

    const runId = await createRun(chapterId || null, {
      pipeline_version: policy.pipelineVersion,
      text_provider: policy.textProvider,
      image_provider: policy.imageProvider,
      moderation_provider: policy.moderationProvider,
      consistency_policy: policy.consistencyPolicy,
      style_preset: stylePreset || 'cinematic',
      config: {
        capScenes: policy.capScenes,
        imageDefaults: policy.imageDefaults,
        chapterText: chapterText || null,
        chapterTitle: chapterTitle || null
      }
    }, supabase, userId);

    await Registry.queue().enqueue("AnalyzeChapter", { runId }, { userId, runId });

    // Worker dispatch runs on a schedule (every minute via cron)
    // No need to trigger manually - jobs will be picked up automatically

    return new Response(
      JSON.stringify({ success: true, runId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Enhancement start error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to start enhancement' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});