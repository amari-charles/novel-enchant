/**
 * Extract Visual Scenes Function
 * Uses AI to identify visually compelling scenes from text chunks
 */

import { handleError, ProcessingError, AIAPIError } from '../../../shared/errors.ts';
import { Scene, FunctionResponse } from '../../../shared/types.ts';
import { validateExtractVisualScenesInput, validateRequestBody } from '../../utilities/validation/index.ts';
import { createOpenAIClient } from '../../utilities/ai-client/index.ts';
import { generateUUID } from '../../../shared/utils.ts';
import { PROCESSING_PARAMS } from '../../../shared/constants.ts';
import { logInfo, logError } from '../../../shared/errors.ts';

// ============================================================================
// CORE FUNCTION
// ============================================================================

export const extractVisualScenes = async (
  chunk: { id: string; index: number; text: string; boundaries: 'natural' | 'forced' },
  context: {
    storyId: string;
    title: string;
    genre?: string;
    stylePreset: string;
    existingCharacters: string[];
    existingLocations: string[];
  }
): Promise<Scene[]> => {
  const startTime = performance.now();
  
  try {
    logInfo('Starting visual scene extraction', {
      chunkId: chunk.id,
      chunkLength: chunk.text.length,
      storyTitle: context.title,
      genre: context.genre,
      style: context.stylePreset
    });
    
    if (chunk.text.length < 100) {
      logInfo('Chunk too short for scene extraction', { chunkId: chunk.id, length: chunk.text.length });
      return [];
    }
    
    const openAIClient = createOpenAIClient();
    
    // Extract scenes using AI
    const extractedScenes = await openAIClient.extractScenes(
      chunk.text,
      context,
      PROCESSING_PARAMS.SCENE_EXTRACTION.MAX_SCENES_PER_CHUNK
    );
    
    // Process and validate extracted scenes
    const processedScenes: Scene[] = [];
    
    for (let i = 0; i < extractedScenes.length; i++) {
      const rawScene = extractedScenes[i];
      
      // Validate minimum scores
      if (rawScene.visualScore < PROCESSING_PARAMS.SCENE_EXTRACTION.MIN_VISUAL_SCORE) {
        logInfo('Scene filtered out due to low visual score', {
          title: rawScene.title,
          visualScore: rawScene.visualScore,
          minRequired: PROCESSING_PARAMS.SCENE_EXTRACTION.MIN_VISUAL_SCORE
        });
        continue;
      }
      
      if (rawScene.impactScore < PROCESSING_PARAMS.SCENE_EXTRACTION.MIN_IMPACT_SCORE) {
        logInfo('Scene filtered out due to low impact score', {
          title: rawScene.title,
          impactScore: rawScene.impactScore,
          minRequired: PROCESSING_PARAMS.SCENE_EXTRACTION.MIN_IMPACT_SCORE
        });
        continue;
      }
      
      // Create processed scene
      const scene: Scene = {
        id: generateUUID(),
        text: rawScene.description,
        summary: rawScene.title,
        visualScore: Math.min(Math.max(rawScene.visualScore, 0), 1), // Clamp to 0-1
        impactScore: Math.min(Math.max(rawScene.impactScore, 0), 1), // Clamp to 0-1
        timeOfDay: validateTimeOfDay(rawScene.timeOfDay),
        emotionalTone: validateEmotionalTone(rawScene.emotionalTone),
        actionLevel: calculateActionLevel(rawScene.description, rawScene.emotionalTone),
      };
      
      processedScenes.push(scene);
    }
    
    // Sort scenes by impact score (highest first)
    processedScenes.sort((a, b) => b.impactScore - a.impactScore);
    
    const endTime = performance.now();
    logInfo('Visual scene extraction completed', {
      processingTime: `${endTime - startTime}ms`,
      rawScenesFound: extractedScenes.length,
      finalScenesCount: processedScenes.length,
      avgVisualScore: processedScenes.length > 0 ? 
        Math.round(processedScenes.reduce((sum, scene) => sum + scene.visualScore, 0) / processedScenes.length * 100) / 100 : 0,
      avgImpactScore: processedScenes.length > 0 ? 
        Math.round(processedScenes.reduce((sum, scene) => sum + scene.impactScore, 0) / processedScenes.length * 100) / 100 : 0
    });
    
    return processedScenes;
    
  } catch (error) {
    logError(error as Error, {
      chunkId: chunk.id,
      chunkLength: chunk.text.length,
      storyTitle: context.title
    });
    
    if (error instanceof AIAPIError) {
      throw new ProcessingError(`AI scene extraction failed: ${error.message}`, { originalError: error });
    }
    
    throw error;
  }
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

const validateTimeOfDay = (timeOfDay?: string): 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night' | 'unknown' | undefined => {
  if (!timeOfDay) return undefined;
  
  const validTimes = ['dawn', 'morning', 'afternoon', 'evening', 'night', 'unknown'];
  const normalized = timeOfDay.toLowerCase();
  
  if (validTimes.includes(normalized)) {
    return normalized as 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night' | 'unknown';
  }
  
  // Try to map common variations
  const timeMap: Record<string, 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night' | 'unknown'> = {
    'sunrise': 'dawn',
    'early morning': 'morning',
    'am': 'morning',
    'noon': 'afternoon',
    'midday': 'afternoon',
    'pm': 'afternoon',
    'late afternoon': 'evening',
    'dusk': 'evening',
    'twilight': 'evening',
    'sunset': 'evening',
    'late evening': 'night',
    'midnight': 'night',
    'late night': 'night'
  };
  
  for (const [key, value] of Object.entries(timeMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  return 'unknown';
};

const validateEmotionalTone = (emotionalTone?: string): 'happy' | 'sad' | 'tense' | 'romantic' | 'action' | 'mysterious' | 'peaceful' | undefined => {
  if (!emotionalTone) return undefined;
  
  const validTones = ['happy', 'sad', 'tense', 'romantic', 'action', 'mysterious', 'peaceful'];
  const normalized = emotionalTone.toLowerCase();
  
  if (validTones.includes(normalized)) {
    return normalized as 'happy' | 'sad' | 'tense' | 'romantic' | 'action' | 'mysterious' | 'peaceful';
  }
  
  // Try to map common variations
  const toneMap: Record<string, 'happy' | 'sad' | 'tense' | 'romantic' | 'action' | 'mysterious' | 'peaceful'> = {
    'joyful': 'happy',
    'cheerful': 'happy',
    'upbeat': 'happy',
    'melancholy': 'sad',
    'sorrowful': 'sad',
    'depressed': 'sad',
    'anxious': 'tense',
    'suspenseful': 'tense',
    'dramatic': 'tense',
    'intense': 'tense',
    'love': 'romantic',
    'intimate': 'romantic',
    'passion': 'romantic',
    'exciting': 'action',
    'thrilling': 'action',
    'fast-paced': 'action',
    'enigmatic': 'mysterious',
    'secretive': 'mysterious',
    'unknown': 'mysterious',
    'calm': 'peaceful',
    'serene': 'peaceful',
    'tranquil': 'peaceful',
    'quiet': 'peaceful'
  };
  
  for (const [key, value] of Object.entries(toneMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  return undefined;
};

const calculateActionLevel = (description: string, emotionalTone?: string): number => {
  const text = description.toLowerCase();
  let actionLevel = 0;
  
  // Action words that increase the score
  const actionWords = [
    'running', 'fighting', 'battle', 'chase', 'explosion', 'crash',
    'jump', 'fall', 'attack', 'defend', 'strike', 'hit', 'kick',
    'dodge', 'escape', 'flee', 'rush', 'dash', 'sprint', 'charge',
    'struggle', 'wrestle', 'combat', 'conflict', 'war', 'violence'
  ];
  
  // Count action words
  for (const word of actionWords) {
    if (text.includes(word)) {
      actionLevel += 0.1;
    }
  }
  
  // Emotional tone modifiers
  if (emotionalTone === 'action') {
    actionLevel += 0.3;
  } else if (emotionalTone === 'tense') {
    actionLevel += 0.2;
  } else if (emotionalTone === 'peaceful') {
    actionLevel -= 0.2;
  }
  
  // Dialogue vs action ratio
  const dialogueMatches = text.match(/["']/g) || [];
  const totalWords = text.split(/\s+/).length;
  
  if (dialogueMatches.length > totalWords * 0.1) {
    actionLevel -= 0.1; // Lots of dialogue = less action
  }
  
  // Clamp to 0-1 range
  return Math.min(Math.max(actionLevel, 0), 1);
};

// ============================================================================
// SUPABASE EDGE FUNCTION HANDLER
// ============================================================================

export default async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
  
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST method is allowed' },
      timestamp: new Date().toISOString(),
    }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // Validate and parse request body
    const body = await validateRequestBody(req);
    const input = validateExtractVisualScenesInput(body);
    
    // Execute the core function
    const result = await extractVisualScenes(input.chunk, input.context);
    
    // Return successful response
    const response: FunctionResponse<Scene[]> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    const errorResponse = handleError(error);
    
    return new Response(JSON.stringify(errorResponse), {
      status: error.code === 'VALIDATION_ERROR' ? 400 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// ============================================================================
// ALTERNATIVE DIRECT EXPORT (for testing)
// ============================================================================

// Export the core function for testing and internal use
export { extractVisualScenes as coreFunction };