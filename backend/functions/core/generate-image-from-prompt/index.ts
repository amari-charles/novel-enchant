/**
 * Generate Image From Prompt Function
 * Creates images using AI image generation services
 */

import { handleError, ProcessingError, AIAPIError } from '../../../shared/errors.ts';
import { Prompt, GeneratedImage, FunctionResponse } from '../../../shared/types.ts';
import { validateGenerateImageFromPromptInput, validateRequestBody } from '../../utilities/validation/index.ts';
import { createReplicateClient } from '../../utilities/ai-client/index.ts';
import { PROCESSING_PARAMS } from '../../../shared/constants.ts';
import { logInfo, logError } from '../../../shared/errors.ts';

// ============================================================================
// CORE FUNCTION
// ============================================================================

export const generateImageFromPrompt = async (
  prompt: Prompt,
  priority?: number,
  sceneId?: string,
  replaceExisting: boolean = true
): Promise<GeneratedImage> => {
  const startTime = performance.now();
  
  try {
    logInfo('Starting image generation', { 
      promptId: prompt.id,
      promptLength: prompt.text.length,
      style: prompt.style,
      priority: priority || 5,
      sceneId,
      replaceExisting,
      technicalParams: prompt.technicalParams
    });
    
    // Validate prompt content
    if (!prompt.text || prompt.text.trim().length === 0) {
      throw new ProcessingError('Prompt text cannot be empty');
    }
    
    // Check for existing image to replace
    let previousImageId: string | undefined;
    if (replaceExisting && sceneId) {
      previousImageId = await findExistingImageForScene(sceneId);
      if (previousImageId) {
        logInfo('Found existing image to replace', { 
          sceneId, 
          previousImageId 
        });
      }
    }
    
    // Generate image using AI service
    const generatedImage = await generateWithAI(prompt);
    
    // Handle version replacement if successful
    if (generatedImage.status === 'success' && replaceExisting && previousImageId) {
      await replaceExistingImage(previousImageId, generatedImage, sceneId!);
    }
    
    const endTime = performance.now();
    logInfo('Image generation completed', {
      processingTime: `${endTime - startTime}ms`,
      promptId: prompt.id,
      status: generatedImage.status,
      imageUrl: generatedImage.imageUrl ? 'Generated' : 'Failed',
      cost: generatedImage.metadata.cost || 0,
      replacedPrevious: !!previousImageId
    });
    
    return generatedImage;
    
  } catch (error) {
    logError(error as Error, { 
      promptId: prompt.id,
      promptLength: prompt.text.length,
      style: prompt.style 
    });
    
    if (error instanceof AIAPIError) {
      throw new ProcessingError(`Image generation failed: ${error.message}`, { originalError: error });
    }
    
    throw error;
  }
};

// ============================================================================
// AI IMAGE GENERATION
// ============================================================================

const generateWithAI = async (prompt: Prompt): Promise<GeneratedImage> => {
  try {
    // For now, this is mocked - in production it would use Replicate API
    // const replicateClient = createReplicateClient();
    // const result = await replicateClient.generateImage(...);
    
    // Mock implementation for testing
    const mockResult = await mockGenerateImage(prompt);
    
    return mockResult;
    
  } catch (error) {
    if (error instanceof AIAPIError) {
      throw error;
    }
    
    throw new AIAPIError(`Image generation service error: ${error.message}`, { originalError: error });
  }
};

// ============================================================================
// MOCK IMAGE GENERATION (TO BE REPLACED WITH REAL AI)
// ============================================================================

const mockGenerateImage = async (prompt: Prompt): Promise<GeneratedImage> => {
  // This is a mock implementation for testing
  // In production, this would be replaced with actual Replicate API calls
  
  logInfo('Mock image generation started', { promptId: prompt.id });
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock success/failure based on prompt complexity
  const shouldSucceed = Math.random() > 0.1; // 90% success rate
  
  if (shouldSucceed) {
    // Mock successful generation
    const mockImageUrl = `https://mock-cdn.example.com/images/${prompt.id}.jpg`;
    
    return {
      imageUrl: mockImageUrl,
      status: 'success',
      metadata: {
        seed: Math.floor(Math.random() * 1000000),
        modelVersion: 'mock-sdxl-v1.0',
        generationTime: 2000,
        cost: calculateMockCost(prompt),
      },
    };
  } else {
    // Mock failure
    return {
      imageUrl: '',
      status: 'error',
      metadata: {
        modelVersion: 'mock-sdxl-v1.0',
        generationTime: 2000,
        cost: 0,
      },
      error: 'Mock generation failure for testing',
    };
  }
};

const calculateMockCost = (prompt: Prompt): number => {
  // Mock cost calculation based on parameters
  const basePrice = 0.01; // $0.01 base
  const { width, height, steps } = prompt.technicalParams;
  
  // Cost increases with resolution and steps
  const resolutionMultiplier = (width * height) / (512 * 512);
  const stepsMultiplier = steps / 20;
  
  return Math.round(basePrice * resolutionMultiplier * stepsMultiplier * 100) / 100;
};

// ============================================================================
// REAL IMAGE GENERATION (COMMENTED OUT - FOR FUTURE USE)
// ============================================================================

/*
const generateWithReplicate = async (prompt: Prompt): Promise<GeneratedImage> => {
  const replicateClient = createReplicateClient();
  
  try {
    const result = await replicateClient.generateImage(
      prompt.text,
      prompt.negativePrompt,
      prompt.technicalParams.width,
      prompt.technicalParams.height,
      prompt.technicalParams.steps,
      prompt.technicalParams.cfgScale
    );
    
    if (result.imageUrl) {
      return {
        imageUrl: result.imageUrl,
        status: 'success',
        metadata: {
          seed: Math.floor(Math.random() * 1000000), // Replicate doesn't always return seed
          modelVersion: 'sdxl-1.0',
          generationTime: 0, // Would be calculated from timestamps
          cost: calculateReplicateCost(prompt.technicalParams),
        },
      };
    } else {
      return {
        imageUrl: '',
        status: 'error',
        metadata: {
          modelVersion: 'sdxl-1.0',
          generationTime: 0,
          cost: 0,
        },
        error: 'No image URL returned from Replicate',
      };
    }
    
  } catch (error) {
    return {
      imageUrl: '',
      status: 'error',
      metadata: {
        modelVersion: 'sdxl-1.0',
        generationTime: 0,
        cost: 0,
      },
      error: error.message,
    };
  }
};

const calculateReplicateCost = (params: any): number => {
  // Replicate SDXL pricing (as of 2024)
  const basePrice = 0.0055; // $0.0055 per image
  const { width, height, steps } = params;
  
  // Cost increases with resolution and steps
  const resolutionMultiplier = (width * height) / (1024 * 1024);
  const stepsMultiplier = steps / 50;
  
  return Math.round(basePrice * resolutionMultiplier * stepsMultiplier * 100) / 100;
};
*/

// ============================================================================
// QUALITY VALIDATION
// ============================================================================

const validateGeneratedImage = (result: GeneratedImage): void => {
  if (result.status === 'success' && result.imageUrl) {
    // Validate image URL format
    try {
      new URL(result.imageUrl);
    } catch {
      throw new ProcessingError('Invalid image URL returned from generation service');
    }
  }
  
  if (result.status === 'error' && !result.error) {
    throw new ProcessingError('Generation failed but no error message provided');
  }
};

// ============================================================================
// RETRY LOGIC
// ============================================================================

const generateWithRetry = async (
  prompt: Prompt,
  maxRetries: number = PROCESSING_PARAMS.IMAGE_GENERATION.MAX_RETRIES
): Promise<GeneratedImage> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logInfo(`Image generation attempt ${attempt}/${maxRetries}`, { promptId: prompt.id });
      
      const result = await generateWithAI(prompt);
      validateGeneratedImage(result);
      
      if (result.status === 'success') {
        return result;
      }
      
      // If it's an error but we have retries left, continue
      if (attempt < maxRetries) {
        logInfo(`Generation failed, retrying...`, { 
          promptId: prompt.id, 
          attempt, 
          error: result.error 
        });
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        continue;
      }
      
      // Last attempt failed
      return result;
      
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        logInfo(`Generation attempt failed, retrying...`, { 
          promptId: prompt.id, 
          attempt, 
          error: error.message 
        });
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        continue;
      }
      
      // Last attempt failed
      throw error;
    }
  }
  
  throw lastError || new ProcessingError('All generation attempts failed');
};

// ============================================================================
// VERSION REPLACEMENT LOGIC
// ============================================================================

const findExistingImageForScene = async (sceneId: string): Promise<string | undefined> => {
  try {
    // In production, this would query the database for existing images for this scene
    // SELECT id FROM scene_images WHERE scene_id = ? AND is_selected = true
    
    logInfo('Searching for existing image', { sceneId });
    
    // Mock implementation - in reality this would be a database query
    // Return null to simulate no existing image for now
    return undefined;
    
  } catch (error) {
    logError(error as Error, { sceneId });
    return undefined; // Don't fail generation if we can't check existing images
  }
};

const replaceExistingImage = async (
  previousImageId: string,
  newImage: GeneratedImage,
  sceneId: string
): Promise<void> => {
  try {
    logInfo('Replacing existing image', { 
      previousImageId, 
      newImageUrl: newImage.imageUrl,
      sceneId 
    });
    
    // In production, this would:
    // 1. Update the previous image record to mark it as replaced
    // 2. Create a new image record with version tracking
    // 3. Update the scene to point to the new image
    
    // Mock database operations
    await markImageAsReplaced(previousImageId, newImage);
    await createNewImageRecord(newImage, sceneId, previousImageId);
    await updateSceneActiveImage(sceneId, newImage.imageUrl);
    
  } catch (error) {
    logError(error as Error, { 
      previousImageId, 
      sceneId,
      newImageUrl: newImage.imageUrl 
    });
    
    // Don't throw - replacement failure shouldn't fail the generation
    logInfo('Image replacement failed, but generation succeeded', { 
      previousImageId, 
      sceneId 
    });
  }
};

const markImageAsReplaced = async (
  previousImageId: string,
  newImage: GeneratedImage
): Promise<void> => {
  // In production: UPDATE scene_images SET is_selected = false, replaced_at = NOW(), replaced_by_url = ? WHERE id = ?
  
  logInfo('Marking previous image as replaced', { 
    previousImageId,
    replacedByUrl: newImage.imageUrl 
  });
  
  // Mock implementation - would be actual database update
  await new Promise(resolve => setTimeout(resolve, 100));
};

const createNewImageRecord = async (
  newImage: GeneratedImage,
  sceneId: string,
  replacedImageId: string
): Promise<void> => {
  // In production: INSERT INTO scene_images (scene_id, image_url, version, replaced_image_id, ...)
  
  logInfo('Creating new image record', { 
    sceneId,
    imageUrl: newImage.imageUrl,
    replacedImageId 
  });
  
  // Mock implementation - would be actual database insert
  await new Promise(resolve => setTimeout(resolve, 100));
};

const updateSceneActiveImage = async (
  sceneId: string,
  newImageUrl: string
): Promise<void> => {
  // In production: UPDATE scenes SET active_image_url = ? WHERE id = ?
  
  logInfo('Updating scene active image', { 
    sceneId,
    newImageUrl 
  });
  
  // Mock implementation - would be actual database update
  await new Promise(resolve => setTimeout(resolve, 100));
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
    const input = validateGenerateImageFromPromptInput(body);
    
    // Execute the core function with retry logic
    const result = await generateImageFromPrompt(
      input.prompt,
      input.priority,
      input.sceneId,
      input.replaceExisting !== false // Default to true
    );
    
    // Return successful response
    const response: FunctionResponse<GeneratedImage> = {
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
export { generateImageFromPrompt as coreFunction };