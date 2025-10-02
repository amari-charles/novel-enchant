import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createRun, setRunStatus } from "../../../packages/dal/runs.ts";
import { insertScenes, setCurrentImage, setSceneStatus } from "../../../packages/dal/scenes.ts";
import { nextAttempt, createImageAttempt, finalizeImage } from "../../../packages/dal/images.ts";
import { Registry } from "../../../packages/registry.ts";
import { supa } from "../../../packages/dal/db.ts";

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

    // Process enhancement synchronously in background
    EdgeRuntime.waitUntil(
      processEnhancement(runId, chapterId, chapterText, policy).catch(async (error) => {
        console.error('Enhancement processing error:', error);
        await setRunStatus(runId, 'failed');
      })
    );

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

async function processEnhancement(runId: string, chapterId: string | null, chapterText: string | null, policy: any) {
  // Step 1: Analyze chapter and create scenes
  const text = chapterText || await getChapterText(chapterId);
  const scenes = await createMockScenes(text, policy.capScenes);
  await insertScenes(runId, scenes);
  await setRunStatus(runId, "generating");

  // Step 2: Get all scenes for this run
  const { data: allScenes } = await supa()
    .from("scenes")
    .select("id,idx,description")
    .eq("enhancement_run_id", runId)
    .order("idx", { ascending: true });

  // Step 3: Generate images for all scenes sequentially
  const { data: run } = await supa()
    .from("enhancement_runs")
    .select("id,chapter_id,config")
    .eq("id", runId)
    .single();

  for (const scene of allScenes || []) {
    try {
      await generateImageForScene(scene, run);
    } catch (error) {
      console.error(`Error generating image for scene ${scene.id}:`, error);
      await setSceneStatus(scene.id, 'failed');
    }
  }

  // Step 4: Finalize run
  const { data: finalScenes } = await supa()
    .from("scenes")
    .select("status")
    .eq("enhancement_run_id", runId);

  const allTerminal = (finalScenes || []).every(s => ['completed', 'failed'].includes(s.status));
  if (allTerminal) {
    const anyCompleted = (finalScenes || []).some(s => s.status === 'completed');
    await setRunStatus(runId, anyCompleted ? 'completed' : 'failed');
  }
}

async function getChapterText(chapterId: string): Promise<string> {
  const { data: chapter } = await supa()
    .from("chapters")
    .select("content")
    .eq("id", chapterId)
    .single();
  return chapter.content;
}

async function createMockScenes(text: string, capScenes: number) {
  // Simple scene extraction - split by paragraphs and group
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const targetScenes = Math.min(capScenes, Math.max(3, Math.ceil(paragraphs.length / 3)));

  const scenes = [];
  const paragraphsPerScene = Math.ceil(paragraphs.length / targetScenes);

  for (let i = 0; i < paragraphs.length; i += paragraphsPerScene) {
    const sceneParagraphs = paragraphs.slice(i, i + paragraphsPerScene);
    const sceneText = sceneParagraphs.join('\n\n');

    // Extract simple title from first sentence
    const firstSentence = sceneText.split('.')[0] || sceneText.slice(0, 50);
    const title = firstSentence.length > 50 ? firstSentence.slice(0, 47) + '...' : firstSentence;

    scenes.push({
      idx: Math.floor(i / paragraphsPerScene),
      title: title.trim(),
      description: sceneText.slice(0, 500), // Limit description length
      characters: [] // Empty for mock
    });
  }

  return scenes.slice(0, targetScenes);
}

async function generateImageForScene(scene: any, run: any) {
  const mode: 'character_scene' | 'background_only' = 'background_only'; // stub
  const consistencyCtx = await Registry.consistency().buildContext({
    storyId: run.chapter_id,
    chapterId: run.chapter_id,
    sceneCharacters: []
  });

  const prompt = await (Registry as any).prompting().buildImagePrompt({
    scene: { title: `Scene ${scene.idx}`, description: scene.description, characters: [] },
    stylePreset: undefined,
    consistency: consistencyCtx,
    imageDefaults: run.config.imageDefaults,
    mode
  });

  const mod = await Registry.moderation().checkText({ text: prompt.prompt });
  if (!mod.allowed) throw new Error("moderation_blocked");

  const attempt = await nextAttempt(scene.id);
  const imageId = await createImageAttempt(scene.id, attempt, {
    prompt,
    provider: 'stub',
    status: 'generating'
  });

  // Generate deterministic mock SVG image
  const mockImageGenOutput = await generateMockImage(prompt.prompt);
  const stored = await Registry.storage().persist(mockImageGenOutput, {
    pathHint: `stories/${run.chapter_id}/chapters/${run.chapter_id}/runs/${run.id}/scenes/${scene.idx}/attempt-${attempt}.svg`
  });

  await finalizeImage(imageId, {
    storage_path: stored.storagePath,
    width: prompt.width,
    height: prompt.height,
    format: prompt.format
  });

  // Set current if first
  const { data: existing } = await supa()
    .from("scenes_current_image")
    .select("scene_id")
    .eq("scene_id", scene.id)
    .maybeSingle();

  if (!existing) await setCurrentImage(scene.id, imageId);

  // Mark scene as completed
  await setSceneStatus(scene.id, 'completed');
}

async function generateMockImage(prompt: string): Promise<{ kind: 'stream'; stream: ReadableStream<Uint8Array>; format: 'svg' }> {
  // Generate deterministic SVG based on prompt
  const hash = await hashString(prompt);
  const color1 = `hsl(${hash % 360}, 70%, 60%)`;
  const color2 = `hsl(${(hash + 120) % 360}, 70%, 40%)`;

  const svg = `
    <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#bg)"/>
      <rect x="100" y="100" width="1080" height="520" fill="rgba(255,255,255,0.1)" rx="20"/>
      <text x="640" y="300" font-family="Arial, sans-serif" font-size="32" text-anchor="middle" fill="white" font-weight="bold">
        AI Generated Scene
      </text>
      <text x="640" y="350" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="rgba(255,255,255,0.8)">
        ${prompt.slice(0, 80)}${prompt.length > 80 ? '...' : ''}
      </text>
      <circle cx="640" cy="450" r="80" fill="rgba(255,255,255,0.2)"/>
      <circle cx="640" cy="450" r="50" fill="rgba(255,255,255,0.3)"/>
    </svg>
  `;

  const encoder = new TextEncoder();
  const svgData = encoder.encode(svg);

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(svgData);
      controller.close();
    }
  });

  return { kind: 'stream', stream, format: 'svg' };
}

async function hashString(str: string): Promise<number> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  return hashArray.reduce((hash, byte) => hash + byte, 0);
}
