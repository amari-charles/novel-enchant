import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { Registry } from "../../../packages/registry.ts";
import { setRunStatus } from "../../../packages/dal/runs.ts";
import { insertScenes } from "../../../packages/dal/scenes.ts";
import { supa } from "../../../packages/dal/db.ts";

serve(async (req) => {
  try {
    const { runId } = await req.json();
    const { data: run } = await supa().from("enhancement_runs").select("id,chapter_id,config").eq("id", runId).single();
    const { data: chapter } = await supa().from("chapters").select("content").eq("id", run.chapter_id).single();

    // Use stub text analysis that creates mock scenes
    const scenes = await createMockScenes(chapter.content, run.config.capScenes);

    await insertScenes(runId, scenes);
    await setRunStatus(runId, "generating");

    // Enqueue first scene only (per-run concurrency=1)
    const { data: firstScene } = await supa().from("scenes").select("id,idx").eq("enhancement_run_id", runId).order("idx").limit(1).single();
    await Registry.queue().enqueue("GenerateImage", { sceneId: firstScene.id, attempt: 0 }, { runId });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Analysis error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

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