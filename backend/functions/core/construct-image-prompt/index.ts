/**
 * Construct Image Prompt Function
 * Creates detailed prompts for AI image generation from scenes and entities
 */

import { handleError, ProcessingError } from '../../../shared/errors.ts';
import { Scene, EntityLink, Prompt, FunctionResponse, ChapterContext, PromptReference, EntityReference } from '../../../shared/types.ts';
import { validateConstructImagePromptInput, validateRequestBody } from '../../utilities/validation/index.ts';
import { generateUUID } from '../../../shared/utils.ts';
import { STYLE_CONFIGURATIONS, PROCESSING_PARAMS } from '../../../shared/constants.ts';
import { logInfo, logError } from '../../../shared/errors.ts';

// ============================================================================
// CORE FUNCTION
// ============================================================================

export const constructImagePrompt = async (
  scene: Scene,
  entityLinks: EntityLink[],
  style: string,
  customStylePrompt?: string,
  artisticDirection?: string,
  previousChapterContext?: ChapterContext,
  chapterNumber?: number
): Promise<Prompt> => {
  const startTime = performance.now();
  
  try {
    logInfo('Starting image prompt construction', { 
      sceneId: scene.id,
      entityLinksCount: entityLinks.length,
      style,
      hasCustomStyle: !!customStylePrompt,
      hasArtisticDirection: !!artisticDirection,
      chapterNumber,
      hasPreviousContext: !!previousChapterContext
    });
    
    // Build reference images from entity links and chapter context
    const referenceImages = await buildReferenceImages(entityLinks, previousChapterContext);
    
    // Build the prompt components with reference context
    const promptComponents = {
      scene: await buildScenePrompt(scene),
      characters: await buildCharacterPrompts(
        entityLinks.filter(link => link.resolvedEntityId && isCharacterEntity(link)),
        referenceImages.filter(ref => ref.entityType === 'character'),
        chapterNumber
      ),
      locations: await buildLocationPrompts(
        entityLinks.filter(link => link.resolvedEntityId && isLocationEntity(link)),
        referenceImages.filter(ref => ref.entityType === 'location'),
        chapterNumber
      ),
      style: await buildStylePrompt(style, customStylePrompt, previousChapterContext),
      technical: await buildTechnicalPrompt(scene, style),
      artistic: artisticDirection ? await buildArtisticPrompt(artisticDirection) : '',
    };
    
    // Construct the main prompt
    const mainPrompt = assembleMainPrompt(promptComponents);
    
    // Construct the negative prompt
    const negativePrompt = buildNegativePrompt(style);
    
    // Get reference image URLs for backwards compatibility
    const refImageUrls = referenceImages.map(ref => ref.imageUrl);
    
    // Get technical parameters
    const technicalParams = getTechnicalParameters(style);
    
    const prompt: Prompt = {
      id: generateUUID(),
      text: mainPrompt,
      negativePrompt,
      style,
      refImageUrls,
      referenceImages,
      technicalParams,
    };
    
    const endTime = performance.now();
    logInfo('Image prompt construction completed', {
      processingTime: `${endTime - startTime}ms`,
      promptLength: mainPrompt.length,
      negativePromptLength: negativePrompt.length,
      refImageCount: refImageUrls.length,
      referenceImageCount: referenceImages.length,
      chapterNumber,
      technicalParams: technicalParams
    });
    
    return prompt;
    
  } catch (error) {
    logError(error as Error, { 
      sceneId: scene.id,
      entityLinksCount: entityLinks.length,
      style 
    });
    throw error;
  }
};

// ============================================================================
// PROMPT COMPONENT BUILDERS
// ============================================================================

const buildScenePrompt = async (scene: Scene): Promise<string> => {
  let scenePrompt = scene.text;
  
  // Add contextual information
  if (scene.timeOfDay) {
    scenePrompt += `, ${scene.timeOfDay} lighting`;
  }
  
  if (scene.emotionalTone) {
    scenePrompt += `, ${scene.emotionalTone} atmosphere`;
  }
  
  // Add action level indicators
  if (scene.actionLevel !== undefined) {
    if (scene.actionLevel > 0.7) {
      scenePrompt += ', dynamic action scene';
    } else if (scene.actionLevel < 0.3) {
      scenePrompt += ', calm peaceful scene';
    }
  }
  
  return scenePrompt;
};

const buildCharacterPrompts = async (
  characterLinks: EntityLink[], 
  referenceImages: PromptReference[] = [],
  chapterNumber?: number
): Promise<string> => {
  if (characterLinks.length === 0) {
    return '';
  }
  
  const characterPrompts: string[] = [];
  
  for (const link of characterLinks) {
    if (link.resolvedEntityId) {
      // Get reference images for this character
      const characterRefs = referenceImages.filter(ref => ref.entityId === link.resolvedEntityId);
      
      // Build character prompt with evolution context
      const characterPrompt = await buildSingleCharacterPrompt(
        link.mentionText, 
        characterRefs,
        chapterNumber
      );
      if (characterPrompt) {
        characterPrompts.push(characterPrompt);
      }
    }
  }
  
  return characterPrompts.length > 0 ? `featuring ${characterPrompts.join(', ')}` : '';
};

const buildSingleCharacterPrompt = async (
  mentionText: string, 
  referenceImages: PromptReference[] = [],
  chapterNumber?: number
): Promise<string> => {
  // This is a simplified version - in production, we'd fetch full entity data
  // including appearance descriptions, clothing, etc.
  
  // For now, just return the mention text with some enhancement
  if (isPronoun(mentionText)) {
    return ''; // Skip pronouns in image prompts
  }
  
  return mentionText;
};

const buildLocationPrompts = async (
  locationLinks: EntityLink[], 
  referenceImages: PromptReference[] = [],
  chapterNumber?: number
): Promise<string> => {
  if (locationLinks.length === 0) {
    return '';
  }
  
  const locationPrompts: string[] = [];
  
  for (const link of locationLinks) {
    if (link.resolvedEntityId) {
      // Get reference images for this location
      const locationRefs = referenceImages.filter(ref => ref.entityId === link.resolvedEntityId);
      
      // Build location prompt with context
      const locationPrompt = await buildSingleLocationPrompt(
        link.mentionText, 
        locationRefs,
        chapterNumber
      );
      if (locationPrompt) {
        locationPrompts.push(locationPrompt);
      }
    }
  }
  
  return locationPrompts.length > 0 ? `set in ${locationPrompts.join(', ')}` : '';
};

const buildSingleLocationPrompt = async (
  mentionText: string, 
  referenceImages: PromptReference[] = [],
  chapterNumber?: number
): Promise<string> => {
  // This is a simplified version - in production, we'd fetch full entity data
  // including detailed descriptions, atmosphere, etc.
  
  // Add reference image context if available
  if (referenceImages.length > 0) {
    const referenceNote = referenceImages.map(ref => ref.description).join(', ');
    return `${mentionText} (${referenceNote})`;
  }
  
  return mentionText;
};

const buildStylePrompt = async (
  style: string, 
  customStylePrompt?: string, 
  previousChapterContext?: ChapterContext
): Promise<string> => {
  const styleConfig = STYLE_CONFIGURATIONS[style as keyof typeof STYLE_CONFIGURATIONS];
  
  if (!styleConfig) {
    throw new ProcessingError(`Unknown style: ${style}`);
  }
  
  let stylePrompt = styleConfig.basePrompt;
  
  if (customStylePrompt) {
    stylePrompt += `, ${customStylePrompt}`;
  }
  
  return stylePrompt;
};

const buildTechnicalPrompt = async (scene: Scene, style: string): Promise<string> => {
  const technicalElements: string[] = [];
  
  // Add composition guidance
  if (scene.actionLevel !== undefined) {
    if (scene.actionLevel > 0.7) {
      technicalElements.push('dynamic composition');
    } else if (scene.actionLevel < 0.3) {
      technicalElements.push('balanced composition');
    }
  }
  
  // Add quality modifiers
  technicalElements.push(
    'high quality',
    'detailed',
    'professional artwork',
    'masterpiece'
  );
  
  return technicalElements.join(', ');
};

const buildArtisticPrompt = async (artisticDirection: string): Promise<string> => {
  return artisticDirection;
};

// ============================================================================
// REFERENCE IMAGE HANDLING
// ============================================================================

const buildReferenceImages = async (
  entityLinks: EntityLink[],
  previousChapterContext?: ChapterContext
): Promise<PromptReference[]> => {
  const referenceImages: PromptReference[] = [];
  
  for (const link of entityLinks) {
    if (!link.resolvedEntityId) continue;
    
    // Get reference images from previous chapter context
    let entityReferences: EntityReference[] = [];
    if (previousChapterContext?.entityStates[link.resolvedEntityId]) {
      entityReferences = previousChapterContext.entityStates[link.resolvedEntityId];
    }
    
    // Create PromptReference objects from the latest references
    // Use top 3 most recent/highest priority references
    const sortedReferences = entityReferences
      .filter(ref => ref.isActive)
      .sort((a, b) => {
        // Sort by priority (higher first), then by addedAtChapter (newer first)
        if (a.priority !== b.priority) return b.priority - a.priority;
        return b.addedAtChapter - a.addedAtChapter;
      })
      .slice(0, 3); // Take top 3
    
    // Convert to PromptReference format
    sortedReferences.forEach((ref, index) => {
      referenceImages.push({
        entityId: link.resolvedEntityId!,
        entityName: link.mentionText,
        entityType: determineEntityType(link),
        imageUrl: ref.imageUrl,
        weight: 1.0 - (index * 0.2), // Decreasing weight: 1.0, 0.8, 0.6
        ageTag: ref.ageTag,
        description: ref.description,
      });
    });
  }
  
  return referenceImages;
};

const determineEntityType = (link: EntityLink): 'character' | 'location' => {
  // This is a simplified implementation
  // In production, this would use the actual entity data
  return isCharacterEntity(link) ? 'character' : 'location';
};

// ============================================================================
// PROMPT ASSEMBLY
// ============================================================================

const assembleMainPrompt = (components: {
  scene: string;
  characters: string;
  locations: string;
  style: string;
  technical: string;
  artistic: string;
}): string => {
  const promptParts: string[] = [];
  
  // Start with the scene description
  promptParts.push(components.scene);
  
  // Add characters
  if (components.characters) {
    promptParts.push(components.characters);
  }
  
  // Add locations
  if (components.locations) {
    promptParts.push(components.locations);
  }
  
  // Add style
  if (components.style) {
    promptParts.push(components.style);
  }
  
  // Add artistic direction
  if (components.artistic) {
    promptParts.push(components.artistic);
  }
  
  // Add technical elements
  if (components.technical) {
    promptParts.push(components.technical);
  }
  
  return promptParts.join(', ');
};

const buildNegativePrompt = (style: string): string => {
  const styleConfig = STYLE_CONFIGURATIONS[style as keyof typeof STYLE_CONFIGURATIONS];
  
  const baseNegative = [
    'low quality',
    'blurry',
    'pixelated',
    'distorted',
    'ugly',
    'duplicate',
    'mutated',
    'extra limbs',
    'missing limbs',
    'bad anatomy',
    'bad proportions',
    'malformed',
    'watermark',
    'signature',
    'text',
    'logo'
  ];
  
  let negativePrompt = baseNegative.join(', ');
  
  if (styleConfig?.negativePrompt) {
    negativePrompt += `, ${styleConfig.negativePrompt}`;
  }
  
  return negativePrompt;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const isCharacterEntity = (link: EntityLink): boolean => {
  // In a real implementation, we'd check the entity type from the database
  // For now, use heuristics
  const text = link.mentionText.toLowerCase();
  const characterIndicators = ['he', 'she', 'they', 'him', 'her', 'them'];
  
  return characterIndicators.includes(text) || 
         (text.charAt(0) === text.charAt(0).toUpperCase() && !isLocationWord(text));
};

const isLocationEntity = (link: EntityLink): boolean => {
  // In a real implementation, we'd check the entity type from the database
  // For now, use heuristics
  return isLocationWord(link.mentionText);
};

const isLocationWord = (text: string): boolean => {
  const locationWords = [
    'castle', 'palace', 'tower', 'hall', 'room', 'chamber', 'kitchen', 'garden',
    'forest', 'mountain', 'river', 'lake', 'city', 'town', 'village', 'street',
    'inn', 'tavern', 'temple', 'market', 'library', 'house', 'building'
  ];
  
  const lowerText = text.toLowerCase();
  return locationWords.some(word => lowerText.includes(word));
};

const isPronoun = (text: string): boolean => {
  const pronouns = ['he', 'she', 'they', 'him', 'her', 'them', 'his', 'hers', 'their'];
  return pronouns.includes(text.toLowerCase());
};

const extractReferenceImageUrls = (entityLinks: EntityLink[]): string[] => {
  // In a real implementation, this would fetch reference images from the database
  // For now, return empty array
  return [];
};

const getTechnicalParameters = (style: string) => {
  const styleConfig = STYLE_CONFIGURATIONS[style as keyof typeof STYLE_CONFIGURATIONS];
  
  const defaults = {
    width: PROCESSING_PARAMS.IMAGE_GENERATION.DEFAULT_WIDTH,
    height: PROCESSING_PARAMS.IMAGE_GENERATION.DEFAULT_HEIGHT,
    steps: PROCESSING_PARAMS.IMAGE_GENERATION.DEFAULT_STEPS,
    cfgScale: PROCESSING_PARAMS.IMAGE_GENERATION.DEFAULT_CFG_SCALE,
    sampler: PROCESSING_PARAMS.IMAGE_GENERATION.DEFAULT_SAMPLER,
  };
  
  if (styleConfig?.technicalParams) {
    return {
      ...defaults,
      ...styleConfig.technicalParams,
    };
  }
  
  return defaults;
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
    const input = validateConstructImagePromptInput(body);
    
    // Execute the core function
    const result = await constructImagePrompt(
      input.scene,
      input.entityLinks,
      input.style,
      input.customStylePrompt,
      input.artisticDirection
    );
    
    // Return successful response
    const response: FunctionResponse<Prompt> = {
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
export { constructImagePrompt as coreFunction };