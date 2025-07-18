/**
 * Generate Reference Image Function
 * Creates reference images for entities to maintain consistency across generations
 */

import { handleError, ProcessingError, AIAPIError } from '../../../shared/errors.ts';
import { Entity, ImageMetadata, FunctionResponse, EntityReference } from '../../../shared/types.ts';
import { validateGenerateReferenceImageInput, validateRequestBody } from '../../utilities/validation/index.ts';
import { createReplicateClient } from '../../utilities/ai-client/index.ts';
import { uploadGeneratedImage } from '../../utilities/storage-helpers/index.ts';
import { STYLE_CONFIGURATIONS } from '../../../shared/constants.ts';
import { logInfo, logError } from '../../../shared/errors.ts';

// ============================================================================
// CORE FUNCTION
// ============================================================================

export const generateReferenceImage = async (
  entity: Entity,
  stylePreset: string = 'realistic',
  chapterNumber: number = 1,
  ageTag?: string,
  priority: number = 5
): Promise<EntityReference> => {
  const startTime = performance.now();
  
  try {
    logInfo('Starting reference image generation', { 
      entityId: entity.id,
      entityName: entity.name,
      entityType: entity.type,
      stylePreset,
      chapterNumber,
      ageTag,
      priority
    });
    
    // Build reference image prompt
    const referencePrompt = await buildReferencePrompt(entity, stylePreset, ageTag);
    
    // Generate image using AI service
    const generatedImage = await generateReferenceImageWithAI(referencePrompt, stylePreset);
    
    // Store the generated image and create EntityReference
    const imageMetadata = await storeReferenceImage(generatedImage, entity);
    
    // Create the EntityReference object
    const entityReference: EntityReference = {
      id: crypto.randomUUID(),
      imageUrl: imageMetadata.imageUrl,
      addedAtChapter: chapterNumber,
      ageTag: ageTag as EntityReference['ageTag'],
      stylePreset,
      description: `Reference image for ${entity.name} (${entity.type}) in ${stylePreset} style${ageTag ? ` (${ageTag})` : ''}`,
      isActive: true,
      priority,
      metadata: {
        generatedAt: new Date().toISOString(),
        modelVersion: imageMetadata.modelVersion,
        qualityScore: undefined, // Will be assessed separately
        generationMethod: 'ai_generated',
        sourcePrompt: referencePrompt,
      },
    };
    
    const endTime = performance.now();
    logInfo('Reference image generation completed', {
      processingTime: `${endTime - startTime}ms`,
      entityId: entity.id,
      imageUrl: entityReference.imageUrl,
      referenceId: entityReference.id,
      chapterNumber,
      ageTag,
      priority
    });
    
    return entityReference;
    
  } catch (error) {
    logError(error as Error, { 
      entityId: entity.id,
      entityName: entity.name,
      entityType: entity.type,
      stylePreset 
    });
    
    if (error instanceof AIAPIError) {
      throw new ProcessingError(`Reference image generation failed: ${error.message}`, { originalError: error });
    }
    
    throw error;
  }
};

// ============================================================================
// REFERENCE PROMPT CONSTRUCTION
// ============================================================================

const buildReferencePrompt = async (entity: Entity, stylePreset: string, ageTag?: string): Promise<string> => {
  const promptParts: string[] = [];
  
  // Add entity description
  promptParts.push(entity.description);
  
  // Add age tag modifier if specified
  if (ageTag) {
    promptParts.push(`${ageTag} appearance`);
  }
  
  // Add entity type-specific modifiers
  if (entity.type === 'character') {
    promptParts.push(...getCharacterReferenceModifiers(entity, ageTag));
  } else if (entity.type === 'location') {
    promptParts.push(...getLocationReferenceModifiers(entity));
  }
  
  // Add style-specific modifiers
  const styleModifiers = getStyleModifiers(stylePreset);
  promptParts.push(...styleModifiers);
  
  // Add reference image specific requirements
  promptParts.push(...getReferenceImageRequirements(entity.type));
  
  return promptParts.join(', ');
};

const getCharacterReferenceModifiers = (entity: Entity, ageTag?: string): string[] => {
  const modifiers: string[] = [];
  
  // Standard character reference requirements
  modifiers.push(
    'full body portrait',
    'standing pose',
    'neutral expression',
    'clear facial features',
    'detailed clothing',
    'consistent lighting'
  );
  
  // Add character-specific modifiers based on description
  const description = entity.description.toLowerCase();
  
  if (description.includes('warrior') || description.includes('fighter')) {
    modifiers.push('battle-ready stance', 'confident posture');
  }
  
  if (description.includes('mage') || description.includes('wizard')) {
    modifiers.push('mystical aura', 'arcane accessories');
  }
  
  if (description.includes('noble') || description.includes('royal')) {
    modifiers.push('regal bearing', 'elegant posture');
  }
  
  if (description.includes('young')) {
    modifiers.push('youthful appearance');
  } else if (description.includes('old') || description.includes('elderly')) {
    modifiers.push('mature appearance', 'weathered features');
  }
  
  return modifiers;
};

const getLocationReferenceModifiers = (entity: Entity): string[] => {
  const modifiers: string[] = [];
  
  // Standard location reference requirements
  modifiers.push(
    'wide establishing shot',
    'clear architectural details',
    'environmental context',
    'atmospheric lighting',
    'high detail'
  );
  
  // Add location-specific modifiers based on description
  const description = entity.description.toLowerCase();
  
  if (description.includes('castle') || description.includes('fortress')) {
    modifiers.push('medieval architecture', 'imposing structure');
  }
  
  if (description.includes('forest') || description.includes('woods')) {
    modifiers.push('natural environment', 'lush vegetation');
  }
  
  if (description.includes('city') || description.includes('town')) {
    modifiers.push('urban environment', 'populated area');
  }
  
  if (description.includes('temple') || description.includes('shrine')) {
    modifiers.push('sacred architecture', 'spiritual atmosphere');
  }
  
  return modifiers;
};

const getStyleModifiers = (stylePreset: string): string[] => {
  const styleConfig = STYLE_CONFIGURATIONS[stylePreset as keyof typeof STYLE_CONFIGURATIONS];
  
  if (!styleConfig) {
    return ['realistic', 'detailed', 'high quality'];
  }
  
  const modifiers = [styleConfig.basePrompt];
  
  // Add reference-specific style modifiers
  if (stylePreset === 'realistic') {
    modifiers.push('photorealistic', 'natural lighting', 'reference sheet style');
  } else if (stylePreset === 'fantasy') {
    modifiers.push('fantasy art', 'detailed illustration', 'concept art style');
  } else if (stylePreset === 'anime') {
    modifiers.push('anime style', 'character sheet', 'clean lines');
  }
  
  return modifiers;
};

const getReferenceImageRequirements = (entityType: 'character' | 'location'): string[] => {
  const requirements = [
    'reference image',
    'consistent design',
    'multiple angles view',
    'detailed features',
    'professional quality',
    'clean background'
  ];
  
  if (entityType === 'character') {
    requirements.push(
      'character turnaround',
      'front view',
      'clear proportions',
      'distinctive features'
    );
  } else {
    requirements.push(
      'architectural accuracy',
      'environmental details',
      'landmark features',
      'atmospheric elements'
    );
  }
  
  return requirements;
};

// ============================================================================
// AI IMAGE GENERATION
// ============================================================================

const generateReferenceImageWithAI = async (
  prompt: string,
  stylePreset: string
): Promise<{ imageUrl: string; modelVersion: string }> => {
  try {
    // For now, this is mocked - in production it would use Replicate API
    // const replicateClient = createReplicateClient();
    // const result = await replicateClient.generateImage(prompt, negativePrompt, ...);
    
    // Mock implementation for testing
    const mockResult = await mockGenerateReferenceImage(prompt, stylePreset);
    
    return mockResult;
    
  } catch (error) {
    if (error instanceof AIAPIError) {
      throw error;
    }
    
    throw new AIAPIError(`Reference image generation service error: ${error.message}`, { originalError: error });
  }
};

// ============================================================================
// MOCK GENERATION (TO BE REPLACED WITH REAL AI)
// ============================================================================

const mockGenerateReferenceImage = async (
  prompt: string,
  stylePreset: string
): Promise<{ imageUrl: string; modelVersion: string }> => {
  // This is a mock implementation for testing
  // In production, this would be replaced with actual Replicate API calls
  
  logInfo('Mock reference image generation started', { 
    promptLength: prompt.length,
    stylePreset 
  });
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Mock success/failure based on prompt quality
  const shouldSucceed = Math.random() > 0.05; // 95% success rate for references
  
  if (shouldSucceed) {
    // Generate a unique mock URL
    const mockImageUrl = `https://mock-cdn.example.com/references/${crypto.randomUUID()}.jpg`;
    
    return {
      imageUrl: mockImageUrl,
      modelVersion: 'mock-sdxl-reference-v1.0',
    };
  } else {
    throw new AIAPIError('Mock reference image generation failure for testing');
  }
};

// ============================================================================
// IMAGE STORAGE
// ============================================================================

const storeReferenceImage = async (
  generatedImage: { imageUrl: string; modelVersion: string },
  entity: Entity
): Promise<ImageMetadata> => {
  try {
    // For now, this is mocked - in production it would use Supabase Storage
    // const { path, publicUrl } = await uploadGeneratedImage(
    //   generatedImage.imageUrl,
    //   entity.story_id,
    //   entity.id
    // );
    
    // Mock storage operation
    const mockStorageResult = await mockStoreReferenceImage(generatedImage, entity);
    
    return {
      imageUrl: mockStorageResult.publicUrl,
      modelVersion: generatedImage.modelVersion,
      generationParams: {
        entityId: entity.id,
        entityType: entity.type,
        entityName: entity.name,
        generatedAt: new Date().toISOString(),
        purpose: 'reference',
      },
    };
    
  } catch (error) {
    throw new ProcessingError(`Failed to store reference image: ${error.message}`, { originalError: error });
  }
};

const mockStoreReferenceImage = async (
  generatedImage: { imageUrl: string; modelVersion: string },
  entity: Entity
): Promise<{ path: string; publicUrl: string }> => {
  // Mock storage operation
  logInfo('Mock reference image storage started', { 
    entityId: entity.id,
    originalUrl: generatedImage.imageUrl 
  });
  
  // Simulate storage time
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const mockPath = `references/${entity.id}/${crypto.randomUUID()}.jpg`;
  const mockPublicUrl = `https://mock-storage.example.com/${mockPath}`;
  
  return {
    path: mockPath,
    publicUrl: mockPublicUrl,
  };
};

// ============================================================================
// QUALITY VALIDATION
// ============================================================================

const validateReferenceImageQuality = (
  imageUrl: string,
  entity: Entity
): Promise<{ isValid: boolean; issues: string[] }> => {
  // In production, this would analyze the image for quality issues
  // For now, return a mock validation
  
  const issues: string[] = [];
  
  // Mock quality checks
  if (Math.random() < 0.1) {
    issues.push('Image may be too dark for reference use');
  }
  
  if (Math.random() < 0.05) {
    issues.push('Some details may be unclear');
  }
  
  return Promise.resolve({
    isValid: issues.length === 0,
    issues,
  });
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
    const input = validateGenerateReferenceImageInput(body);
    
    // Execute the core function
    const result = await generateReferenceImage(
      input.entity, 
      input.stylePreset, 
      input.chapterNumber || 1,
      input.ageTag,
      input.priority || 5
    );
    
    // Return successful response
    const response: FunctionResponse<EntityReference> = {
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
export { generateReferenceImage as coreFunction };