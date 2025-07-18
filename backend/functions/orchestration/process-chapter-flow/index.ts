/**
 * Process Chapter Flow Function
 * Processes a single chapter and generates visuals with entity evolution and reference continuity
 */

import { handleError, ProcessingError, ValidationError } from '../../../shared/errors.ts';
import { 
  FunctionResponse, 
  StoryChapter,
  Story,
  Scene,
  Entity,
  EntityLink,
  EntityReference,
  Prompt,
  GeneratedImage,
  QualityReport,
  Chunk,
  RawMention,
  ChapterContext
} from '../../../shared/types.ts';
import { validateRequestBody } from '../../utilities/validation/index.ts';

// Import all core functions
import { chunkTextIntoSections } from '../../core/chunk-text-into-sections/index.ts';
import { extractVisualScenes } from '../../core/extract-visual-scenes/index.ts';
import { identifySceneMentions } from '../../core/identify-scene-mentions/index.ts';
import { resolveMentionsToEntities } from '../../core/resolve-mentions-to-entities/index.ts';
import { extractNewEntitiesFromScene } from '../../core/extract-new-entities/index.ts';
import { mergeEntities } from '../../core/merge-entities/index.ts';
import { trackEntityEvolution } from '../../core/track-entity-evolution/index.ts';
import { generateReferenceImage } from '../../core/generate-reference-image/index.ts';
import { constructImagePrompt } from '../../core/construct-image-prompt/index.ts';
import { generateImageFromPrompt } from '../../core/generate-image-from-prompt/index.ts';
import { assessImageQuality } from '../../core/assess-image-quality/index.ts';

import { logInfo, logError } from '../../../shared/errors.ts';

// Import database helpers
import {
  getChapter,
  getStory,
  getPreviousChapter,
  getKnownEntities,
  getPreviousEntities,
  createScene,
  linkEntitiesToScene,
  upsertEntities,
  createEntityReference,
  getRecentReferenceImages,
  upsertSceneImage,
  updateChapterStatus,
  buildChapterContext
} from './database-helpers.ts';

// ============================================================================
// CORE FUNCTION
// ============================================================================

export interface ProcessChapterOptions {
  previousChapterId?: string;
  forceRegenerate?: boolean;
  skipImageGeneration?: boolean;
}

export const processChapterFlow = async (
  chapterId: string,
  options: ProcessChapterOptions = {}
): Promise<{
  chapter: StoryChapter;
  scenes: Scene[];
  entities: Entity[];
  images: GeneratedImage[];
  qualityReports: QualityReport[];
}> => {
  const startTime = performance.now();
  
  try {
    logInfo('Starting chapter processing flow', {
      chapterId,
      previousChapterId: options.previousChapterId,
      forceRegenerate: options.forceRegenerate,
      skipImageGeneration: options.skipImageGeneration
    });

    // Load chapter and story data
    const chapter = await getChapter(chapterId);
    const story = await getStory(chapter.storyId);
    
    logInfo('Chapter and story data loaded', {
      chapterId: chapter.id,
      chapterNumber: chapter.chapterNumber,
      storyId: story.id,
      storyTitle: story.title
    });

    // Load context from previous chapter
    const previousChapter = options.previousChapterId 
      ? await getPreviousChapter(options.previousChapterId)
      : null;

    const previousEntities = previousChapter 
      ? await getPreviousEntities(previousChapter.id)
      : [];

    const knownEntities = await getKnownEntities(story.id);

    const chapterContext = previousChapter 
      ? await buildChapterContext(story.id, previousChapter.chapterNumber)
      : undefined;

    logInfo('Context loaded', {
      previousChapter: previousChapter?.id,
      previousEntitiesCount: previousEntities.length,
      knownEntitiesCount: knownEntities.length,
      hasChapterContext: !!chapterContext
    });

    // 1. Chunk chapter text
    const chunks = await chunkTextIntoSections(chapter.content);
    
    logInfo('Chapter text chunked', {
      chunksCount: chunks.length,
      chunkSizes: chunks.map(c => c.text.length)
    });

    // Initialize collection arrays
    const allScenes: Scene[] = [];
    const allEntities: Entity[] = [...knownEntities];
    const allImages: GeneratedImage[] = [];
    const allQualityReports: QualityReport[] = [];

    // 2. Process each chunk
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      
      logInfo('Processing chunk', {
        chunkIndex,
        chunkId: chunk.id,
        textLength: chunk.text.length
      });

      // Extract visual scenes from chunk
      const scenes = await extractVisualScenes(chunk, {
        storyId: story.id,
        title: story.title,
        genre: story.genre,
        stylePreset: story.stylePreset,
        existingCharacters: allEntities.filter(e => e.type === 'character').map(e => e.name),
        existingLocations: allEntities.filter(e => e.type === 'location').map(e => e.name),
      });

      logInfo('Visual scenes extracted', {
        chunkIndex,
        scenesCount: scenes.length,
        sceneTypes: scenes.map(s => s.emotionalTone || 'unknown')
      });

      // Process each scene in the chunk
      for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex++) {
        const scene = scenes[sceneIndex];
        
        logInfo('Processing scene', {
          chunkIndex,
          sceneIndex,
          sceneId: scene.id,
          visualScore: scene.visualScore
        });

        // Create scene record
        const createdScene = await createScene(scene, chapter.id, chunkIndex, sceneIndex);
        allScenes.push(createdScene);

        // Extract and resolve entity mentions
        const mentions = await identifySceneMentions(scene.text);
        const linkedMentions = await resolveMentionsToEntities(mentions, allEntities);

        logInfo('Entity mentions processed', {
          sceneId: scene.id,
          mentionsCount: mentions.length,
          linkedCount: linkedMentions.filter(m => m.resolvedEntityId).length
        });

        // Extract new entities
        const newEntities = await extractNewEntitiesFromScene(scene.text, linkedMentions);
        
        if (newEntities.length > 0) {
          logInfo('New entities discovered', {
            sceneId: scene.id,
            newEntitiesCount: newEntities.length,
            entityNames: newEntities.map(e => e.name)
          });

          // Merge with existing entities
          const mergedEntities = await mergeEntities(newEntities, allEntities);
          
          // Update our entity collection
          allEntities.splice(0, allEntities.length, ...mergedEntities);
          
          // Persist entities to database
          await upsertEntities(mergedEntities);
        }

        // Link entities to scene
        await linkEntitiesToScene(createdScene.id, linkedMentions);

        // 3. Generate missing reference images
        for (const entityLink of linkedMentions) {
          if (!entityLink.resolvedEntityId) continue;
          
          const entity = allEntities.find(e => e.id === entityLink.resolvedEntityId);
          if (!entity) continue;

          const existingRefs = entity.referenceImages || [];
          
          // Check if we need new reference images for this style
          const styleRefs = existingRefs.filter(ref => 
            ref.stylePreset === story.stylePreset && ref.isActive
          );
          
          if (styleRefs.length === 0) {
            logInfo('Generating reference image for entity', {
              entityId: entity.id,
              entityName: entity.name,
              entityType: entity.type,
              stylePreset: story.stylePreset
            });

            try {
              const newRef = await generateReferenceImage(
                entity,
                story.stylePreset,
                chapter.chapterNumber,
                undefined, // ageTag - could be determined from chapter context
                5 // priority
              );

              // Add reference to entity
              if (!entity.referenceImages) entity.referenceImages = [];
              entity.referenceImages.push(newRef);

              // Persist reference to database
              await createEntityReference(newRef, entity.id);

              logInfo('Reference image generated successfully', {
                entityId: entity.id,
                referenceId: newRef.id,
                imageUrl: newRef.imageUrl
              });

            } catch (error) {
              logError(error as Error, { 
                entityId: entity.id, 
                entityName: entity.name 
              });
              // Continue processing even if reference generation fails
            }
          }
        }

        // 4. Skip image generation if requested
        if (options.skipImageGeneration) {
          logInfo('Skipping image generation for scene', { sceneId: scene.id });
          continue;
        }

        // Get recent reference images for prompt construction
        const entityIds = linkedMentions
          .filter(m => m.resolvedEntityId)
          .map(m => m.resolvedEntityId!);

        const refImages = await getRecentReferenceImages(entityIds, {
          stylePreset: story.stylePreset,
          limitPerEntity: 3
        });

        logInfo('Reference images loaded for prompt', {
          sceneId: scene.id,
          entityIdsCount: entityIds.length,
          refImagesCount: refImages.length
        });

        // 5. Construct image prompt
        const prompt = await constructImagePrompt(
          scene,
          linkedMentions,
          story.stylePreset,
          story.customStylePrompt,
          undefined, // artisticDirection
          chapterContext,
          chapter.chapterNumber
        );

        logInfo('Image prompt constructed', {
          sceneId: scene.id,
          promptId: prompt.id,
          promptLength: prompt.text.length,
          referenceImagesCount: prompt.referenceImages.length
        });

        // 6. Generate scene image
        try {
          const image = await generateImageFromPrompt(
            prompt,
            5, // priority
            scene.id,
            true // replaceExisting
          );

          if (image.status === 'success') {
            // Store image in database
            await upsertSceneImage(scene.id, image, prompt.id);
            allImages.push(image);

            logInfo('Scene image generated successfully', {
              sceneId: scene.id,
              imageUrl: image.imageUrl,
              modelVersion: image.metadata.modelVersion
            });

            // 7. Assess image quality (async)
            try {
              const qualityReport = await assessImageQuality(
                image.imageUrl,
                prompt,
                scene
              );

              allQualityReports.push(qualityReport);

              logInfo('Image quality assessed', {
                sceneId: scene.id,
                qualityScore: qualityReport.qualityScore,
                issuesCount: qualityReport.issues.length
              });

            } catch (qualityError) {
              logError(qualityError as Error, { 
                sceneId: scene.id, 
                imageUrl: image.imageUrl 
              });
              // Continue even if quality assessment fails
            }

          } else {
            logError(new Error('Image generation failed'), {
              sceneId: scene.id,
              status: image.status,
              error: image.error
            });
          }

        } catch (imageError) {
          logError(imageError as Error, { 
            sceneId: scene.id, 
            promptId: prompt.id 
          });
          // Continue processing even if image generation fails
        }
      }
    }

    // 8. Mark chapter as complete
    await updateChapterStatus(chapterId, 'completed');

    const endTime = performance.now();
    logInfo('Chapter processing flow completed', {
      processingTime: `${endTime - startTime}ms`,
      chapterId,
      chapterNumber: chapter.chapterNumber,
      scenesProcessed: allScenes.length,
      entitiesTotal: allEntities.length,
      imagesGenerated: allImages.length,
      qualityReports: allQualityReports.length
    });

    return {
      chapter,
      scenes: allScenes,
      entities: allEntities,
      images: allImages,
      qualityReports: allQualityReports,
    };

  } catch (error) {
    // Mark chapter as failed
    try {
      await updateChapterStatus(chapterId, 'failed');
    } catch (updateError) {
      logError(updateError as Error, { chapterId });
    }

    logError(error as Error, {
      chapterId,
      previousChapterId: options.previousChapterId
    });
    
    throw error;
  }
};

// ============================================================================
// ENTITY EVOLUTION TRACKING
// ============================================================================

const trackEntityEvolutionForChapter = async (
  entities: Entity[],
  chapterNumber: number
): Promise<void> => {
  for (const entity of entities) {
    try {
      // Track how this entity has evolved in this chapter
      const evolutionResult = await trackEntityEvolution(
        entity,
        entity.description,
        chapterNumber
      );

      if (evolutionResult.updated) {
        logInfo('Entity evolution tracked', {
          entityId: entity.id,
          entityName: entity.name,
          chapterNumber,
          changes: evolutionResult.changes
        });
      }

    } catch (error) {
      logError(error as Error, { 
        entityId: entity.id, 
        chapterNumber 
      });
      // Continue even if evolution tracking fails
    }
  }
};

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

export const getChapterProcessingProgress = async (
  chapterId: string
): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  currentStep: string;
  stepsCompleted: number;
  totalSteps: number;
}> => {
  // In production, this would track actual progress
  // For now, return mock progress
  
  logInfo('Getting chapter processing progress', { chapterId });
  
  return {
    status: 'processing',
    progress: 75,
    currentStep: 'Generating scene images',
    stepsCompleted: 6,
    totalSteps: 8,
  };
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
    
    if (!body.chapterId) {
      throw new ValidationError('Missing required field: chapterId');
    }
    
    // Execute the core function
    const result = await processChapterFlow(body.chapterId, {
      previousChapterId: body.previousChapterId,
      forceRegenerate: body.forceRegenerate,
      skipImageGeneration: body.skipImageGeneration,
    });
    
    // Return successful response
    const response: FunctionResponse<typeof result> = {
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
export { processChapterFlow as coreFunction };