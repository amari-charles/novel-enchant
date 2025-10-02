import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { Registry } from "../../../packages/registry.ts";
import { supa } from "../../../packages/dal/db.ts";
import { nextAttempt, createImageAttempt, finalizeImage } from "../../../packages/dal/images.ts";
import { setCurrentImage, setSceneStatus } from "../../../packages/dal/scenes.ts";

serve(async (req) => {
  try {
    const { sceneId, attempt } = await req.json();
    const { data: scene } = await supa().from("scenes").select("id,idx,description,enhancement_run_id").eq("id", sceneId).single();
    const { data: run } = await supa().from("enhancement_runs").select("id,chapter_id,config").eq("id", scene.enhancement_run_id).single();

    const mode: 'character_scene' | 'background_only' = 'background_only'; // stub
    const consistencyCtx = await Registry.consistency().buildContext({ storyId: run.chapter_id, chapterId: run.chapter_id, sceneCharacters: [] });
    const prompt = await (Registry as any).prompting().buildImagePrompt({
      scene: { title: `Scene ${scene.idx}`, description: scene.description, characters: [] },
      stylePreset: undefined, consistency: consistencyCtx, imageDefaults: run.config.imageDefaults, mode
    });

    const mod = await Registry.moderation().checkText({ text: prompt.prompt });
    if (!mod.allowed) throw new Error("moderation_blocked");

    const newAttempt = attempt ?? await nextAttempt(sceneId);
    const imageId = await createImageAttempt(sceneId, newAttempt, { prompt, provider: 'stub', status: 'generating' });

    // Generate deterministic mock SVG image
    const mockImageGenOutput = await generateMockImage(prompt.prompt);
    const stored = await Registry.storage().persist(mockImageGenOutput, {
      pathHint: `stories/${run.chapter_id}/chapters/${run.chapter_id}/runs/${run.id}/scenes/${scene.idx}/attempt-${newAttempt}.svg`
    });

    await finalizeImage(imageId, { storage_path: stored.storagePath, width: prompt.width, height: prompt.height, format: prompt.format });

    // Set current if first
    const { data: existing } = await supa().from("scenes_current_image").select("scene_id").eq("scene_id", sceneId).maybeSingle();
    if (!existing) await setCurrentImage(sceneId, imageId);

    // Mark scene as completed
    await setSceneStatus(sceneId, 'completed');

    // Enqueue next scene (serial)
    const { data: next } = await supa()
      .from('scenes')
      .select('id')
      .eq('enhancement_run_id', run.id)
      .gt('idx', scene.idx)
      .order('idx', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (next?.id) {
      await Registry.queue().enqueue("GenerateImage", { sceneId: next.id, attempt: 0 }, { runId: run.id });
    } else {
      // No more scenes, finalize the run
      await Registry.queue().enqueue("FinalizeRun", { runId: run.id }, { runId: run.id });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Image generation error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

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