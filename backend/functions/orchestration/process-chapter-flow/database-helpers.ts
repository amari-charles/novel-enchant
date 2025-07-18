/**
 * Database Helpers for Process Chapter Flow
 * Mock implementations for testing - to be replaced with real Supabase calls
 */

import { 
  Story, 
  StoryChapter, 
  Entity,
  EntityReference,
  Scene,
  GeneratedImage,
  QualityReport,
  EntityLink,
  ChapterContext,
  UUID,
  ProcessingStatus
} from '../../../shared/types.ts';
import { logInfo, logError } from '../../../shared/errors.ts';

// ============================================================================
// CHAPTER & STORY RETRIEVAL
// ============================================================================

export const getChapter = async (chapterId: string): Promise<StoryChapter> => {
  try {
    logInfo('Getting chapter by ID', { chapterId });

    // In production, this would be:
    // const { data, error } = await supabase
    //   .from('chapters')
    //   .select('*')
    //   .eq('id', chapterId)
    //   .single();

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const chapter: StoryChapter = {
      id: chapterId,
      storyId: `story-${chapterId.split('-')[0]}`,
      chapterNumber: 1,
      title: 'Chapter 1: The Beginning',
      content: 'Mock chapter content for testing purposes. This would normally contain the actual chapter text from the database.',
      wordCount: 1250,
      processingStatus: 'processing',
      createdAt: new Date().toISOString(),
    };

    logInfo('Chapter retrieved successfully', {
      chapterId: chapter.id,
      chapterNumber: chapter.chapterNumber,
      wordCount: chapter.wordCount
    });

    return chapter;

  } catch (error) {
    logError(error as Error, { chapterId });
    throw error;
  }
};

export const getStory = async (storyId: string): Promise<Story> => {
  try {
    logInfo('Getting story by ID', { storyId });

    // In production, this would be:
    // const { data, error } = await supabase
    //   .from('stories')
    //   .select('*')
    //   .eq('id', storyId)
    //   .single();

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 30));
    
    const story: Story = {
      id: storyId,
      userId: `user-${storyId.split('-')[0]}`,
      title: 'The Chronicles of Aethermoor',
      description: 'A fantasy epic about magic and adventure',
      genre: 'fantasy',
      stylePreset: 'fantasy',
      customStylePrompt: 'cinematic, detailed, high fantasy style',
      status: 'processing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    logInfo('Story retrieved successfully', {
      storyId: story.id,
      title: story.title,
      genre: story.genre
    });

    return story;

  } catch (error) {
    logError(error as Error, { storyId });
    throw error;
  }
};

export const getPreviousChapter = async (chapterId: string): Promise<StoryChapter | null> => {
  try {
    logInfo('Getting previous chapter', { chapterId });

    // In production, this would be:
    // const { data, error } = await supabase
    //   .from('chapters')
    //   .select('*')
    //   .eq('id', chapterId)
    //   .single();

    // Mock implementation - return null for first chapter
    await new Promise(resolve => setTimeout(resolve, 25));
    
    // For testing, return a mock previous chapter
    const previousChapter: StoryChapter = {
      id: `previous-${chapterId}`,
      storyId: `story-${chapterId.split('-')[0]}`,
      chapterNumber: 0,
      title: 'Prologue',
      content: 'Previous chapter content...',
      wordCount: 800,
      processingStatus: 'completed',
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    };

    logInfo('Previous chapter retrieved', { 
      previousChapterId: previousChapter.id,
      chapterNumber: previousChapter.chapterNumber 
    });

    return previousChapter;

  } catch (error) {
    logError(error as Error, { chapterId });
    return null;
  }
};

// ============================================================================
// ENTITY MANAGEMENT
// ============================================================================

export const getKnownEntities = async (storyId: string): Promise<Entity[]> => {
  try {
    logInfo('Getting known entities for story', { storyId });

    // In production, this would be:
    // const { data, error } = await supabase
    //   .from('entities')
    //   .select('*, entity_references(*)')
    //   .eq('story_id', storyId)
    //   .eq('is_active', true);

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 75));
    
    const entities: Entity[] = [
      {
        id: crypto.randomUUID(),
        name: 'Lyra Stormwind',
        type: 'character',
        description: 'A young mage with silver hair and piercing blue eyes',
        aliases: ['Lyra', 'The Storm Mage'],
        firstAppearance: 'Chapter 1',
        referenceImages: [],
        storyId,
      },
      {
        id: crypto.randomUUID(),
        name: 'The Crystal Tower',
        type: 'location',
        description: 'A towering spire of pure crystal that houses the magical academy',
        aliases: ['The Tower', 'Crystal Spire'],
        firstAppearance: 'Chapter 1',
        referenceImages: [],
        storyId,
      },
    ];

    logInfo('Known entities retrieved', {
      storyId,
      entitiesCount: entities.length,
      entityNames: entities.map(e => e.name)
    });

    return entities;

  } catch (error) {
    logError(error as Error, { storyId });
    throw error;
  }
};

export const getPreviousEntities = async (chapterId: string): Promise<Entity[]> => {
  try {
    logInfo('Getting entities from previous chapter', { chapterId });

    // In production, this would query entities that appeared in the previous chapter
    // and their states at that time

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const entities: Entity[] = [
      {
        id: crypto.randomUUID(),
        name: 'Lyra Stormwind',
        type: 'character',
        description: 'A young mage with silver hair, now bearing a small scar on her left hand',
        aliases: ['Lyra', 'The Storm Mage'],
        firstAppearance: 'Chapter 1',
        referenceImages: [],
      },
    ];

    logInfo('Previous entities retrieved', {
      chapterId,
      entitiesCount: entities.length
    });

    return entities;

  } catch (error) {
    logError(error as Error, { chapterId });
    throw error;
  }
};

export const buildChapterContext = async (
  storyId: string, 
  previousChapterNumber: number
): Promise<ChapterContext> => {
  try {
    logInfo('Building chapter context', { storyId, previousChapterNumber });

    // In production, this would aggregate:
    // - Entity states from previous chapter
    // - Previous chapter scenes
    // - Style evolution data

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const context: ChapterContext = {
      chapterNumber: previousChapterNumber,
      entityStates: {
        'lyra-id': [{
          id: crypto.randomUUID(),
          imageUrl: 'https://example.com/lyra-ref.jpg',
          addedAtChapter: previousChapterNumber,
          ageTag: 'young',
          stylePreset: 'fantasy',
          description: 'Lyra in her blue robes',
          isActive: true,
          priority: 10,
          metadata: {
            generatedAt: new Date().toISOString(),
            modelVersion: 'sdxl-1.0',
            qualityScore: 8.5,
            generationMethod: 'ai_generated',
          },
        }],
      },
      previousScenes: [
        {
          id: crypto.randomUUID(),
          text: 'Previous scene text...',
          summary: 'Lyra discovers her magical abilities',
          visualScore: 8.5,
          impactScore: 9.0,
          timeOfDay: 'morning',
          emotionalTone: 'mysterious',
        },
      ],
      styleEvolution: [
        'Initial fantasy style established',
        'Added more detail to magical elements',
      ],
    };

    logInfo('Chapter context built successfully', {
      storyId,
      previousChapterNumber,
      entityStatesCount: Object.keys(context.entityStates).length,
      previousScenesCount: context.previousScenes.length
    });

    return context;

  } catch (error) {
    logError(error as Error, { storyId, previousChapterNumber });
    throw error;
  }
};

// ============================================================================
// SCENE OPERATIONS
// ============================================================================

export const createScene = async (
  scene: Scene,
  chapterId: string,
  chunkIndex: number,
  sceneIndex: number
): Promise<Scene> => {
  try {
    logInfo('Creating scene record', {
      sceneId: scene.id,
      chapterId,
      chunkIndex,
      sceneIndex
    });

    // In production, this would be:
    // const { data, error } = await supabase
    //   .from('scenes')
    //   .insert({
    //     id: scene.id,
    //     chapter_id: chapterId,
    //     scene_number: sceneIndex,
    //     title: scene.summary,
    //     description: scene.text,
    //     visual_score: scene.visualScore,
    //     impact_score: scene.impactScore,
    //     time_of_day: scene.timeOfDay,
    //     emotional_tone: scene.emotionalTone,
    //     processing_status: 'pending',
    //   })
    //   .select()
    //   .single();

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 50));

    logInfo('Scene record created successfully', {
      sceneId: scene.id,
      chapterId,
      visualScore: scene.visualScore
    });

    return scene;

  } catch (error) {
    logError(error as Error, { sceneId: scene.id, chapterId });
    throw error;
  }
};

export const linkEntitiesToScene = async (
  sceneId: string,
  entityLinks: EntityLink[]
): Promise<void> => {
  try {
    logInfo('Linking entities to scene', {
      sceneId,
      entityLinksCount: entityLinks.length
    });

    // In production, this would be:
    // const sceneEntityLinks = entityLinks
    //   .filter(link => link.resolvedEntityId)
    //   .map(link => ({
    //     scene_id: sceneId,
    //     entity_id: link.resolvedEntityId,
    //     mention_text: link.mentionText,
    //     confidence: link.confidence,
    //   }));
    //
    // const { error } = await supabase
    //   .from('scene_entity_links')
    //   .insert(sceneEntityLinks);

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 30));

    const linkedCount = entityLinks.filter(link => link.resolvedEntityId).length;
    logInfo('Entities linked to scene successfully', {
      sceneId,
      linkedEntitiesCount: linkedCount
    });

  } catch (error) {
    logError(error as Error, { sceneId, entityLinksCount: entityLinks.length });
    throw error;
  }
};

// ============================================================================
// ENTITY PERSISTENCE
// ============================================================================

export const upsertEntities = async (entities: Entity[]): Promise<void> => {
  try {
    logInfo('Upserting entities', {
      entitiesCount: entities.length,
      entityNames: entities.map(e => e.name)
    });

    // In production, this would be:
    // const { error } = await supabase
    //   .from('entities')
    //   .upsert(entities.map(entity => ({
    //     id: entity.id,
    //     story_id: entity.storyId,
    //     name: entity.name,
    //     type: entity.type,
    //     description: entity.description,
    //     aliases: entity.aliases,
    //     first_appearance: entity.firstAppearance,
    //     is_active: true,
    //     updated_at: new Date().toISOString(),
    //   })));

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 75));

    logInfo('Entities upserted successfully', {
      entitiesCount: entities.length
    });

  } catch (error) {
    logError(error as Error, { entitiesCount: entities.length });
    throw error;
  }
};

export const createEntityReference = async (
  reference: EntityReference,
  entityId: string
): Promise<void> => {
  try {
    logInfo('Creating entity reference', {
      referenceId: reference.id,
      entityId,
      imageUrl: reference.imageUrl
    });

    // In production, this would be:
    // const { error } = await supabase
    //   .from('entity_references')
    //   .insert({
    //     id: reference.id,
    //     entity_id: entityId,
    //     image_url: reference.imageUrl,
    //     added_at_chapter: reference.addedAtChapter,
    //     age_tag: reference.ageTag,
    //     style_preset: reference.stylePreset,
    //     description: reference.description,
    //     is_active: reference.isActive,
    //     priority: reference.priority,
    //     generation_method: reference.metadata.generationMethod,
    //     quality_score: reference.metadata.qualityScore,
    //   });

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 40));

    logInfo('Entity reference created successfully', {
      referenceId: reference.id,
      entityId
    });

  } catch (error) {
    logError(error as Error, { referenceId: reference.id, entityId });
    throw error;
  }
};

export const getRecentReferenceImages = async (
  entityIds: string[],
  options: {
    stylePreset?: string;
    limitPerEntity?: number;
  } = {}
): Promise<EntityReference[]> => {
  try {
    logInfo('Getting recent reference images', {
      entityIdsCount: entityIds.length,
      stylePreset: options.stylePreset,
      limitPerEntity: options.limitPerEntity
    });

    // In production, this would be:
    // const { data, error } = await supabase
    //   .from('entity_references')
    //   .select('*')
    //   .in('entity_id', entityIds)
    //   .eq('is_active', true)
    //   .order('priority', { ascending: false })
    //   .order('created_at', { ascending: false });

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 60));
    
    const references: EntityReference[] = entityIds.slice(0, 2).map(entityId => ({
      id: crypto.randomUUID(),
      imageUrl: `https://example.com/ref-${entityId}.jpg`,
      addedAtChapter: 1,
      ageTag: 'young',
      stylePreset: options.stylePreset || 'fantasy',
      description: `Reference image for entity ${entityId}`,
      isActive: true,
      priority: 8,
      metadata: {
        generatedAt: new Date().toISOString(),
        modelVersion: 'sdxl-1.0',
        qualityScore: 8.2,
        generationMethod: 'ai_generated',
      },
    }));

    logInfo('Reference images retrieved', {
      entityIdsCount: entityIds.length,
      referencesFound: references.length
    });

    return references;

  } catch (error) {
    logError(error as Error, { entityIdsCount: entityIds.length });
    throw error;
  }
};

// ============================================================================
// IMAGE OPERATIONS
// ============================================================================

export const upsertSceneImage = async (
  sceneId: string,
  image: GeneratedImage,
  promptId: string
): Promise<void> => {
  try {
    logInfo('Upserting scene image', {
      sceneId,
      imageUrl: image.imageUrl,
      promptId
    });

    // In production, this would be:
    // const { error } = await supabase
    //   .from('scene_images')
    //   .upsert({
    //     scene_id: sceneId,
    //     prompt_id: promptId,
    //     image_url: image.imageUrl,
    //     status: image.status,
    //     quality_score: image.metadata.qualityScore,
    //     generation_params: image.metadata,
    //     is_selected: true,
    //     version: 1,
    //   });

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 45));

    logInfo('Scene image upserted successfully', {
      sceneId,
      imageUrl: image.imageUrl
    });

  } catch (error) {
    logError(error as Error, { sceneId, imageUrl: image.imageUrl });
    throw error;
  }
};

// ============================================================================
// STATUS UPDATES
// ============================================================================

export const updateChapterStatus = async (
  chapterId: string,
  status: ProcessingStatus
): Promise<void> => {
  try {
    logInfo('Updating chapter status', { chapterId, status });

    // In production, this would be:
    // const { error } = await supabase
    //   .from('chapters')
    //   .update({
    //     processing_status: status,
    //     updated_at: new Date().toISOString(),
    //   })
    //   .eq('id', chapterId);

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 25));

    logInfo('Chapter status updated successfully', { chapterId, status });

  } catch (error) {
    logError(error as Error, { chapterId, status });
    throw error;
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const findExistingImageForScene = async (sceneId: string): Promise<string | null> => {
  try {
    logInfo('Finding existing image for scene', { sceneId });

    // In production, this would be:
    // const { data, error } = await supabase
    //   .from('scene_images')
    //   .select('id')
    //   .eq('scene_id', sceneId)
    //   .eq('is_selected', true)
    //   .order('version', { ascending: false })
    //   .limit(1)
    //   .single();

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 30));

    // Return null for testing (no existing image)
    logInfo('No existing image found for scene', { sceneId });
    return null;

  } catch (error) {
    logError(error as Error, { sceneId });
    return null;
  }
};

export const replaceExistingImage = async (
  oldImageId: string,
  newImageUrl: string
): Promise<void> => {
  try {
    logInfo('Replacing existing image', { oldImageId, newImageUrl });

    // In production, this would:
    // 1. Mark the old image as replaced
    // 2. Create new image record with incremented version
    // 3. Update the scene to use new image

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 40));

    logInfo('Image replaced successfully', { oldImageId, newImageUrl });

  } catch (error) {
    logError(error as Error, { oldImageId, newImageUrl });
    throw error;
  }
};