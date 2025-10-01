/**
 * Supabase Edge Function: Extract Scenes
 * Processes text to automatically detect and extract scenes
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractScenesRequest {
  text: string;
  jobId: string;
  options?: {
    targetScenesPerThousandWords?: number;
    maxScenes?: number;
    minSceneLength?: number;
  };
}

interface Scene {
  id: string;
  chapter_id: string;
  excerpt: string;
  order_index: number;
}

interface Chapter {
  id: string;
  title?: string;
  order_index: number;
  scenes: Scene[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    const { text, jobId, options = {} } = await req.json() as ExtractScenesRequest;

    if (!text || !jobId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: text and jobId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract configuration
    const targetScenesPerThousandWords = options.targetScenesPerThousandWords || 4;
    const maxScenes = options.maxScenes || 30;
    const minSceneLength = options.minSceneLength || 50; // Lowered from 100 to 50

    // Process text
    const wordCount = countWords(text);
    const targetSceneCount = Math.min(
      Math.ceil((wordCount / 1000) * targetScenesPerThousandWords),
      maxScenes
    );

    // Extract chapters and scenes
    const chapters = extractChaptersAndScenes(text, targetSceneCount, minSceneLength);

    // Update job with extracted scenes and mark as completed
    const { error: updateError } = await supabase
      .from('enhance_jobs')
      .update({
        result_json: { chapters },
        status: 'completed', // Mark as completed since scene extraction is done
        progress: 100,
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (updateError) {
      console.error('Job update error:', updateError);
      throw new Error(`Failed to update job: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        chapters,
        totalScenes: chapters.reduce((sum, ch) => sum + ch.scenes.length, 0),
        wordCount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Scene extraction error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Scene extraction failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function extractChaptersAndScenes(
  text: string,
  targetSceneCount: number,
  minSceneLength: number
): Chapter[] {
  const chapters: Chapter[] = [];

  // Detect chapter boundaries
  const chapterBoundaries = detectChapterBoundaries(text);

  if (chapterBoundaries.length > 0) {
    // Process text by chapters
    for (let i = 0; i < chapterBoundaries.length; i++) {
      const startIdx = chapterBoundaries[i];
      const endIdx = i < chapterBoundaries.length - 1
        ? chapterBoundaries[i + 1]
        : text.length;

      const chapterText = text.slice(startIdx, endIdx);
      const chapterTitle = extractChapterTitle(chapterText);

      const chapter: Chapter = {
        id: `chapter_${i + 1}`,
        title: chapterTitle,
        order_index: i,
        scenes: extractScenesFromText(
          chapterText,
          `chapter_${i + 1}`,
          Math.ceil(targetSceneCount / Math.max(chapterBoundaries.length, 1)),
          minSceneLength
        ),
      };

      chapters.push(chapter);
    }
  } else {
    // No chapters detected, treat as single chapter
    chapters.push({
      id: 'chapter_1',
      title: undefined,
      order_index: 0,
      scenes: extractScenesFromText(text, 'chapter_1', targetSceneCount, minSceneLength),
    });
  }

  return chapters;
}

function detectChapterBoundaries(text: string): number[] {
  const boundaries: number[] = [];
  const lines = text.split('\n');
  let currentIndex = 0;

  const chapterPatterns = [
    /^chapter\s+\d+/i,
    /^chapter\s+[IVXLCDM]+/i,
    /^part\s+\d+/i,
    /^\d+\./,
  ];

  for (const line of lines) {
    const trimmedLine = line.trim();

    for (const pattern of chapterPatterns) {
      if (pattern.test(trimmedLine)) {
        boundaries.push(currentIndex);
        break;
      }
    }

    currentIndex += line.length + 1; // +1 for newline
  }

  return boundaries;
}

function extractChapterTitle(text: string): string | undefined {
  const lines = text.split('\n');
  const firstLine = lines[0]?.trim();

  if (firstLine && firstLine.length < 100) {
    // Check if it looks like a title
    if (/^(chapter|part)\s+/i.test(firstLine)) {
      return firstLine;
    }
  }

  return undefined;
}

function extractScenesFromText(
  text: string,
  chapterId: string,
  targetSceneCount: number,
  minSceneLength: number
): Scene[] {
  const scenes: Scene[] = [];

  // Detect scene breaks
  const sceneBreaks = detectSceneBreaks(text);

  if (sceneBreaks.length > 0) {
    // Use detected scene breaks
    for (let i = 0; i < sceneBreaks.length; i++) {
      const startIdx = sceneBreaks[i];
      const endIdx = i < sceneBreaks.length - 1
        ? sceneBreaks[i + 1]
        : text.length;

      const sceneText = text.slice(startIdx, endIdx).trim();

      if (sceneText.length >= minSceneLength) {
        scenes.push({
          id: `scene_${chapterId}_${i + 1}`,
          chapter_id: chapterId,
          excerpt: createExcerpt(sceneText, 500),
          order_index: i,
        });
      }
    }
  }

  // If no scenes or too few, divide text evenly
  if (scenes.length < targetSceneCount / 2) {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

    // If no paragraphs, split by sentences or just create scenes from the whole text
    if (paragraphs.length === 0) {
      paragraphs.push(text); // Use the whole text as one paragraph
    }

    const scenesNeeded = Math.min(targetSceneCount, Math.max(1, paragraphs.length));
    const paragraphsPerScene = Math.max(1, Math.floor(paragraphs.length / scenesNeeded));

    scenes.length = 0; // Clear existing scenes

    for (let i = 0; i < scenesNeeded; i++) {
      const startIdx = i * paragraphsPerScene;
      const endIdx = Math.min((i + 1) * paragraphsPerScene, paragraphs.length);
      const sceneText = paragraphs.slice(startIdx, endIdx).join('\n\n');

      // Always add at least one scene, even if short
      if (sceneText.trim().length > 0 && (sceneText.length >= minSceneLength || i === 0)) {
        scenes.push({
          id: `scene_${chapterId}_${i + 1}`,
          chapter_id: chapterId,
          excerpt: createExcerpt(sceneText, 500),
          order_index: i,
        });
      }
    }

    // If still no scenes, create at least one from the text
    if (scenes.length === 0 && text.trim().length > 0) {
      scenes.push({
        id: `scene_${chapterId}_1`,
        chapter_id: chapterId,
        excerpt: createExcerpt(text, 500),
        order_index: 0,
      });
    }
  }

  return scenes;
}

function detectSceneBreaks(text: string): number[] {
  const breaks: number[] = [0]; // Start of text is always a scene start
  const lines = text.split('\n');
  let currentIndex = 0;

  const sceneBreakPatterns = [
    /^\*\*\*+$/,
    /^---+$/,
    /^___+$/,
    /^#$/,
  ];

  for (const line of lines) {
    const trimmedLine = line.trim();

    for (const pattern of sceneBreakPatterns) {
      if (pattern.test(trimmedLine)) {
        breaks.push(currentIndex);
        break;
      }
    }

    currentIndex += line.length + 1;
  }

  return breaks;
}

function createExcerpt(text: string, maxLength: number): string {
  let excerpt = text.slice(0, maxLength);

  // Clean up
  excerpt = excerpt.replace(/\s+/g, ' ').trim();

  // Try to end at sentence boundary
  const lastPeriod = excerpt.lastIndexOf('.');
  const lastQuestion = excerpt.lastIndexOf('?');
  const lastExclamation = excerpt.lastIndexOf('!');

  const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);

  if (lastSentenceEnd > excerpt.length * 0.7) {
    excerpt = excerpt.slice(0, lastSentenceEnd + 1);
  } else if (excerpt.length === maxLength) {
    excerpt += '...';
  }

  return excerpt;
}