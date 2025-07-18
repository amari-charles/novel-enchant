/**
 * Database Helpers - Supabase client and common database operations
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DatabaseError, validateRequired, validateUUID } from '../../../shared/errors.ts';
import { SUPABASE_CONFIG, ENV_VARS } from '../../../shared/constants.ts';
import { UUID, Story, StoryChapter, StoryScene, StoryEntity, SceneImage } from '../../../shared/types.ts';

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

export const createSupabaseClient = () => {
  const supabaseUrl = Deno.env.get(ENV_VARS.SUPABASE_URL);
  const supabaseKey = Deno.env.get(ENV_VARS.SUPABASE_SERVICE_ROLE_KEY);
  
  if (!supabaseUrl || !supabaseKey) {
    throw new DatabaseError('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

// ============================================================================
// STORY OPERATIONS
// ============================================================================

export const createStory = async (
  userId: UUID,
  title: string,
  description?: string,
  genre?: string,
  stylePreset?: string
): Promise<Story> => {
  validateRequired(userId, 'userId');
  validateRequired(title, 'title');
  validateUUID(userId, 'userId');
  
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from(SUPABASE_CONFIG.TABLE_NAMES.STORIES)
    .insert({
      user_id: userId,
      title,
      description,
      genre,
      style_preset: stylePreset || 'fantasy',
      status: 'processing',
    })
    .select()
    .single();
  
  if (error) {
    throw new DatabaseError(`Failed to create story: ${error.message}`, { error });
  }
  
  return data;
};

export const getStory = async (storyId: UUID): Promise<Story | null> => {
  validateRequired(storyId, 'storyId');
  validateUUID(storyId, 'storyId');
  
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from(SUPABASE_CONFIG.TABLE_NAMES.STORIES)
    .select('*')
    .eq('id', storyId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new DatabaseError(`Failed to get story: ${error.message}`, { error });
  }
  
  return data;
};

export const updateStoryStatus = async (
  storyId: UUID,
  status: 'active' | 'processing' | 'completed' | 'failed'
): Promise<Story> => {
  validateRequired(storyId, 'storyId');
  validateRequired(status, 'status');
  validateUUID(storyId, 'storyId');
  
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from(SUPABASE_CONFIG.TABLE_NAMES.STORIES)
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', storyId)
    .select()
    .single();
  
  if (error) {
    throw new DatabaseError(`Failed to update story status: ${error.message}`, { error });
  }
  
  return data;
};

// ============================================================================
// CHAPTER OPERATIONS
// ============================================================================

export const createChapter = async (
  storyId: UUID,
  chapterNumber: number,
  title: string,
  content: string
): Promise<StoryChapter> => {
  validateRequired(storyId, 'storyId');
  validateRequired(chapterNumber, 'chapterNumber');
  validateRequired(title, 'title');
  validateRequired(content, 'content');
  validateUUID(storyId, 'storyId');
  
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from(SUPABASE_CONFIG.TABLE_NAMES.CHAPTERS)
    .insert({
      story_id: storyId,
      chapter_number: chapterNumber,
      title,
      content,
      word_count: content.split(/\s+/).length,
      processing_status: 'pending',
    })
    .select()
    .single();
  
  if (error) {
    throw new DatabaseError(`Failed to create chapter: ${error.message}`, { error });
  }
  
  return data;
};

export const getChapter = async (chapterId: UUID): Promise<StoryChapter | null> => {
  validateRequired(chapterId, 'chapterId');
  validateUUID(chapterId, 'chapterId');
  
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from(SUPABASE_CONFIG.TABLE_NAMES.CHAPTERS)
    .select('*')
    .eq('id', chapterId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new DatabaseError(`Failed to get chapter: ${error.message}`, { error });
  }
  
  return data;
};

export const updateChapterStatus = async (
  chapterId: UUID,
  status: 'pending' | 'processing' | 'completed' | 'failed'
): Promise<StoryChapter> => {
  validateRequired(chapterId, 'chapterId');
  validateRequired(status, 'status');
  validateUUID(chapterId, 'chapterId');
  
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from(SUPABASE_CONFIG.TABLE_NAMES.CHAPTERS)
    .update({
      processing_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', chapterId)
    .select()
    .single();
  
  if (error) {
    throw new DatabaseError(`Failed to update chapter status: ${error.message}`, { error });
  }
  
  return data;
};

// ============================================================================
// SCENE OPERATIONS
// ============================================================================

export const createScene = async (
  chapterId: UUID,
  sceneNumber: number,
  title: string,
  description: string,
  visualScore: number,
  impactScore: number,
  excerpt?: string,
  timeOfDay?: string,
  emotionalTone?: string
): Promise<StoryScene> => {
  validateRequired(chapterId, 'chapterId');
  validateRequired(sceneNumber, 'sceneNumber');
  validateRequired(title, 'title');
  validateRequired(description, 'description');
  validateUUID(chapterId, 'chapterId');
  
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from(SUPABASE_CONFIG.TABLE_NAMES.SCENES)
    .insert({
      chapter_id: chapterId,
      scene_number: sceneNumber,
      title,
      description,
      excerpt,
      visual_score: visualScore,
      impact_score: impactScore,
      time_of_day: timeOfDay,
      emotional_tone: emotionalTone,
      processing_status: 'pending',
    })
    .select()
    .single();
  
  if (error) {
    throw new DatabaseError(`Failed to create scene: ${error.message}`, { error });
  }
  
  return data;
};

export const getScene = async (sceneId: UUID): Promise<StoryScene | null> => {
  validateRequired(sceneId, 'sceneId');
  validateUUID(sceneId, 'sceneId');
  
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from(SUPABASE_CONFIG.TABLE_NAMES.SCENES)
    .select('*')
    .eq('id', sceneId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new DatabaseError(`Failed to get scene: ${error.message}`, { error });
  }
  
  return data;
};

export const getScenesByChapter = async (chapterId: UUID): Promise<StoryScene[]> => {
  validateRequired(chapterId, 'chapterId');
  validateUUID(chapterId, 'chapterId');
  
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from(SUPABASE_CONFIG.TABLE_NAMES.SCENES)
    .select('*')
    .eq('chapter_id', chapterId)
    .order('scene_number', { ascending: true });
  
  if (error) {
    throw new DatabaseError(`Failed to get scenes: ${error.message}`, { error });
  }
  
  return data || [];
};

// ============================================================================
// ENTITY OPERATIONS
// ============================================================================

export const createEntity = async (
  storyId: UUID,
  name: string,
  type: 'character' | 'location',
  description: string,
  aliases: string[] = [],
  firstAppearanceChapter?: number
): Promise<StoryEntity> => {
  validateRequired(storyId, 'storyId');
  validateRequired(name, 'name');
  validateRequired(type, 'type');
  validateRequired(description, 'description');
  validateUUID(storyId, 'storyId');
  
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from(SUPABASE_CONFIG.TABLE_NAMES.ENTITIES)
    .insert({
      story_id: storyId,
      name,
      type,
      description,
      aliases,
      first_appearance_chapter: firstAppearanceChapter,
      is_active: true,
    })
    .select()
    .single();
  
  if (error) {
    throw new DatabaseError(`Failed to create entity: ${error.message}`, { error });
  }
  
  return data;
};

export const getEntitiesByStory = async (
  storyId: UUID,
  type?: 'character' | 'location'
): Promise<StoryEntity[]> => {
  validateRequired(storyId, 'storyId');
  validateUUID(storyId, 'storyId');
  
  const supabase = createSupabaseClient();
  
  let query = supabase
    .from(SUPABASE_CONFIG.TABLE_NAMES.ENTITIES)
    .select('*')
    .eq('story_id', storyId)
    .eq('is_active', true);
  
  if (type) {
    query = query.eq('type', type);
  }
  
  const { data, error } = await query.order('name', { ascending: true });
  
  if (error) {
    throw new DatabaseError(`Failed to get entities: ${error.message}`, { error });
  }
  
  return data || [];
};

export const updateEntityDescription = async (
  entityId: UUID,
  description: string
): Promise<StoryEntity> => {
  validateRequired(entityId, 'entityId');
  validateRequired(description, 'description');
  validateUUID(entityId, 'entityId');
  
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from(SUPABASE_CONFIG.TABLE_NAMES.ENTITIES)
    .update({
      description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', entityId)
    .select()
    .single();
  
  if (error) {
    throw new DatabaseError(`Failed to update entity: ${error.message}`, { error });
  }
  
  return data;
};

// ============================================================================
// IMAGE OPERATIONS
// ============================================================================

export const createSceneImage = async (
  sceneId: UUID,
  promptId: UUID,
  imageUrl: string,
  qualityScore?: number,
  generationParams?: Record<string, any>
): Promise<SceneImage> => {
  validateRequired(sceneId, 'sceneId');
  validateRequired(promptId, 'promptId');
  validateRequired(imageUrl, 'imageUrl');
  validateUUID(sceneId, 'sceneId');
  validateUUID(promptId, 'promptId');
  
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from(SUPABASE_CONFIG.TABLE_NAMES.SCENE_IMAGES)
    .insert({
      scene_id: sceneId,
      prompt_id: promptId,
      image_url: imageUrl,
      quality_score: qualityScore,
      generation_params: generationParams,
      is_selected: false,
    })
    .select()
    .single();
  
  if (error) {
    throw new DatabaseError(`Failed to create scene image: ${error.message}`, { error });
  }
  
  return data;
};

export const getImagesByScene = async (sceneId: UUID): Promise<SceneImage[]> => {
  validateRequired(sceneId, 'sceneId');
  validateUUID(sceneId, 'sceneId');
  
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from(SUPABASE_CONFIG.TABLE_NAMES.SCENE_IMAGES)
    .select('*')
    .eq('scene_id', sceneId)
    .order('created_at', { ascending: false });
  
  if (error) {
    throw new DatabaseError(`Failed to get scene images: ${error.message}`, { error });
  }
  
  return data || [];
};

// ============================================================================
// PROCESSING JOBS
// ============================================================================

export const createProcessingJob = async (
  type: string,
  userId: UUID,
  entityId: UUID,
  metadata?: Record<string, any>
): Promise<any> => {
  validateRequired(type, 'type');
  validateRequired(userId, 'userId');
  validateRequired(entityId, 'entityId');
  validateUUID(userId, 'userId');
  validateUUID(entityId, 'entityId');
  
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from(SUPABASE_CONFIG.TABLE_NAMES.PROCESSING_JOBS)
    .insert({
      job_type: type,
      user_id: userId,
      entity_id: entityId,
      status: 'pending',
      progress: 0,
      metadata,
    })
    .select()
    .single();
  
  if (error) {
    throw new DatabaseError(`Failed to create processing job: ${error.message}`, { error });
  }
  
  return data;
};

export const updateProcessingJobStatus = async (
  jobId: UUID,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  progress?: number,
  errorMessage?: string
): Promise<any> => {
  validateRequired(jobId, 'jobId');
  validateRequired(status, 'status');
  validateUUID(jobId, 'jobId');
  
  const supabase = createSupabaseClient();
  
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };
  
  if (progress !== undefined) {
    updateData.progress = progress;
  }
  
  if (errorMessage) {
    updateData.error_message = errorMessage;
  }
  
  if (status === 'completed' || status === 'failed') {
    updateData.completed_at = new Date().toISOString();
  }
  
  const { data, error } = await supabase
    .from(SUPABASE_CONFIG.TABLE_NAMES.PROCESSING_JOBS)
    .update(updateData)
    .eq('id', jobId)
    .select()
    .single();
  
  if (error) {
    throw new DatabaseError(`Failed to update processing job: ${error.message}`, { error });
  }
  
  return data;
};