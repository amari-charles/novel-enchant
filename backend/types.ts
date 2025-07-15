/**
 * Novel Enchant - TypeScript Type Definitions
 * Complete type system for AI-powered story visualization platform
 */

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type UUID = string;
export type Timestamp = string; // ISO 8601 timestamp

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const SUBSCRIPTION_TIERS = ['free', 'pro', 'premium'] as const;
export type SubscriptionTier = typeof SUBSCRIPTION_TIERS[number];

export const STYLE_PRESETS = ['fantasy', 'scifi', 'romance', 'thriller', 'historical', 'contemporary'] as const;
export type StylePreset = typeof STYLE_PRESETS[number];

export const STORY_STATUS = ['active', 'archived', 'processing'] as const;
export type StoryStatus = typeof STORY_STATUS[number];

export const PROCESSING_STATUS = ['pending', 'processing', 'completed', 'failed'] as const;
export type ProcessingStatus = typeof PROCESSING_STATUS[number];

export const GENERATION_STATUS = ['pending', 'queued', 'processing', 'completed', 'failed'] as const;
export type GenerationStatus = typeof GENERATION_STATUS[number];

export const EMOTIONAL_TONES = ['happy', 'sad', 'tense', 'romantic', 'action', 'mysterious', 'peaceful'] as const;
export type EmotionalTone = typeof EMOTIONAL_TONES[number];

export const TIME_OF_DAY = ['dawn', 'morning', 'afternoon', 'evening', 'night', 'unknown'] as const;
export type TimeOfDay = typeof TIME_OF_DAY[number];

export const CHARACTER_ROLES = ['protagonist', 'antagonist', 'supporting', 'minor'] as const;
export type CharacterRole = typeof CHARACTER_ROLES[number];

export const LOCATION_TYPES = ['indoor', 'outdoor', 'city', 'building', 'natural', 'fantasy', 'vehicle'] as const;
export type LocationType = typeof LOCATION_TYPES[number];

export const IMAGE_SOURCE_TYPES = ['generated', 'uploaded', 'ai_generated'] as const;
export type ImageSourceType = typeof IMAGE_SOURCE_TYPES[number];

export const IMPORTANCE_LEVELS = ['main', 'secondary', 'background'] as const;
export type ImportanceLevel = typeof IMPORTANCE_LEVELS[number];

export const PROMINENCE_LEVELS = ['primary', 'secondary', 'background'] as const;
export type ProminenceLevel = typeof PROMINENCE_LEVELS[number];

export const JOB_TYPES = ['extract_scenes', 'extract_entities', 'generate_prompts', 'generate_images'] as const;
export type JobType = typeof JOB_TYPES[number];

export const ENTITY_TYPES = ['chapter', 'scene', 'character', 'location'] as const;
export type EntityType = typeof ENTITY_TYPES[number];

export const JOB_STATUS = ['pending', 'processing', 'completed', 'failed', 'cancelled'] as const;
export type JobStatus = typeof JOB_STATUS[number];

export const IMAGE_QUALITY_PREFERENCES = ['fast', 'balanced', 'high_quality'] as const;
export type ImageQualityPreference = typeof IMAGE_QUALITY_PREFERENCES[number];

export const STORAGE_PROVIDERS = ['supabase', 's3', 'cloudinary'] as const;
export type StorageProvider = typeof STORAGE_PROVIDERS[number];

// ============================================================================
// CORE DATABASE ENTITIES
// ============================================================================

export interface User {
  id: UUID;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  subscription_tier: SubscriptionTier;
  generation_credits: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Story {
  id: UUID;
  user_id: UUID;
  title: string;
  description: string | null;
  genre: string | null;
  style_preset: StylePreset;
  custom_style_prompt: string | null;
  cover_image_url: string | null;
  is_public: boolean;
  status: StoryStatus;
  total_chapters: number;
  total_scenes: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Chapter {
  id: UUID;
  story_id: UUID;
  chapter_number: number;
  title: string;
  content: string;
  word_count: number;
  processing_status: ProcessingStatus;
  scenes_extracted: boolean;
  raw_content_deleted: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Scene {
  id: UUID;
  chapter_id: UUID;
  scene_number: number;
  title: string;
  description: string;
  excerpt: string | null;
  emotional_tone: EmotionalTone | null;
  time_of_day: TimeOfDay | null;
  weather: string | null;
  processing_status: ProcessingStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Character {
  id: UUID;
  story_id: UUID;
  name: string;
  aliases: string[];
  base_description: string;
  personality_traits: string[];
  role: CharacterRole | null;
  first_appearance_chapter: number | null;
  primary_reference_image_id: UUID | null;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CharacterReferenceImage {
  id: UUID;
  character_id: UUID;
  image_url: string;
  source_type: ImageSourceType;
  is_primary: boolean;
  description: string | null;
  generation_prompt: string | null;
  created_at: Timestamp;
}

export interface CharacterState {
  id: UUID;
  character_id: UUID;
  chapter_number: number;
  appearance_description: string;
  clothing_description: string | null;
  emotional_state: string | null;
  injuries_or_changes: string | null;
  notes: string | null;
  created_at: Timestamp;
}

export interface Location {
  id: UUID;
  story_id: UUID;
  name: string;
  type: LocationType | null;
  base_description: string;
  atmosphere: string | null;
  first_appearance_chapter: number | null;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface LocationState {
  id: UUID;
  location_id: UUID;
  chapter_number: number;
  visual_description: string;
  lighting_conditions: string | null;
  weather: string | null;
  time_of_day: string | null;
  seasonal_changes: string | null;
  damage_or_changes: string | null;
  notes: string | null;
  created_at: Timestamp;
}

export interface SceneCharacter {
  id: UUID;
  scene_id: UUID;
  character_id: UUID;
  importance: ImportanceLevel;
  emotional_state: string | null;
  specific_appearance_notes: string | null;
  created_at: Timestamp;
}

export interface SceneLocation {
  id: UUID;
  scene_id: UUID;
  location_id: UUID;
  prominence: ProminenceLevel;
  specific_details: string | null;
  created_at: Timestamp;
}

export interface Prompt {
  id: UUID;
  scene_id: UUID;
  version: number;
  prompt_text: string;
  negative_prompt: string | null;
  style_modifiers: string[];
  character_references: UUID[];
  location_references: UUID[];
  technical_parameters: Record<string, any> | null;
  generation_status: GenerationStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface PromptRetry {
  id: UUID;
  original_prompt_id: UUID;
  retry_reason: string | null;
  modified_prompt_text: string;
  modifications_made: string | null;
  created_at: Timestamp;
}

export interface Image {
  id: UUID;
  prompt_id: UUID;
  scene_id: UUID;
  image_url: string;
  thumbnail_url: string | null;
  generation_seed: number | null;
  generation_parameters: Record<string, any> | null;
  quality_score: number | null;
  user_rating: number | null;
  is_selected: boolean;
  storage_provider: StorageProvider;
  file_size: number | null;
  dimensions: { width: number; height: number } | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ProcessingJob {
  id: UUID;
  job_type: JobType;
  entity_type: EntityType;
  entity_id: UUID;
  user_id: UUID;
  status: JobStatus;
  priority: number;
  attempts: number;
  max_attempts: number;
  error_message: string | null;
  metadata: Record<string, any> | null;
  started_at: Timestamp | null;
  completed_at: Timestamp | null;
  created_at: Timestamp;
}

export interface UserPreferences {
  id: UUID;
  user_id: UUID;
  default_style_preset: StylePreset;
  auto_delete_raw_text: boolean;
  image_quality_preference: ImageQualityPreference;
  notification_preferences: {
    email: boolean;
    in_app: boolean;
  };
  privacy_settings: {
    public_profile: boolean;
    share_analytics: boolean;
  };
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// COMPUTED/ENRICHED TYPES
// ============================================================================

export interface StoryWithChapters extends Story {
  chapters: Chapter[];
}

export interface ChapterWithScenes extends Chapter {
  scenes: SceneWithDetails[];
}

export interface SceneWithDetails extends Scene {
  characters: (SceneCharacter & { character: Character })[];
  locations: (SceneLocation & { location: Location })[];
  images: Image[];
  primary_image?: Image;
}

export interface CharacterWithReferences extends Character {
  reference_images: CharacterReferenceImage[];
  latest_state?: CharacterState;
}

export interface LocationWithState extends Location {
  latest_state?: LocationState;
}

export interface PromptWithRelations extends Prompt {
  scene: Scene;
  characters: Character[];
  locations: Location[];
  images: Image[];
  retries: PromptRetry[];
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateStoryRequest {
  title: string;
  description?: string;
  genre?: string;
  style_preset?: StylePreset;
  custom_style_prompt?: string;
}

export interface CreateStoryResponse {
  story: Story;
  success: boolean;
  error?: string;
}

export interface UploadChapterRequest {
  story_id: UUID;
  chapter_number: number;
  title: string;
  content: string;
}

export interface UploadChapterResponse {
  chapter: Chapter;
  processing_job: ProcessingJob;
  success: boolean;
  error?: string;
}

export interface ExtractScenesRequest {
  chapter_id: UUID;
  max_scenes?: number; // Default: 5
  focus_on?: 'action' | 'dialogue' | 'description' | 'emotion';
}

export interface ExtractScenesResponse {
  scenes: Scene[];
  processing_job: ProcessingJob;
  success: boolean;
  error?: string;
}

export interface ExtractEntitiesRequest {
  scene_id: UUID;
  existing_characters?: Character[];
  existing_locations?: Location[];
}

export interface ExtractEntitiesResponse {
  characters: Character[];
  locations: Location[];
  scene_characters: SceneCharacter[];
  scene_locations: SceneLocation[];
  success: boolean;
  error?: string;
}

export interface GeneratePromptsRequest {
  scene_id: UUID;
  style_override?: string;
  character_focus?: UUID[]; // Specific characters to emphasize
  artistic_style?: string;
}

export interface GeneratePromptsResponse {
  prompt: Prompt;
  character_states: CharacterState[];
  location_states: LocationState[];
  success: boolean;
  error?: string;
}

export interface QueueImageGenerationRequest {
  prompt_id: UUID;
  priority?: number; // 1-10, default 5
  parameters?: {
    width?: number;
    height?: number;
    steps?: number;
    cfg_scale?: number;
    sampler?: string;
  };
}

export interface QueueImageGenerationResponse {
  processing_job: ProcessingJob;
  estimated_completion: Timestamp;
  queue_position: number;
  success: boolean;
  error?: string;
}

export interface GetReadingViewRequest {
  chapter_id: UUID;
  include_raw_text?: boolean;
}

export interface GetReadingViewResponse {
  chapter: ChapterWithScenes;
  story: Story;
  navigation: {
    previous_chapter?: { id: UUID; title: string; chapter_number: number };
    next_chapter?: { id: UUID; title: string; chapter_number: number };
  };
  success: boolean;
  error?: string;
}

export interface RegenerateImageRequest {
  scene_id: UUID;
  original_prompt_id: UUID;
  modifications: {
    prompt_changes?: string;
    style_changes?: string;
    character_adjustments?: Record<UUID, string>;
    location_adjustments?: Record<UUID, string>;
  };
  retry_reason: string;
}

export interface RegenerateImageResponse {
  new_prompt: Prompt;
  retry_record: PromptRetry;
  processing_job: ProcessingJob;
  success: boolean;
  error?: string;
}

// ============================================================================
// AI/GPT INTEGRATION TYPES
// ============================================================================

export interface GPTSceneExtractionPrompt {
  chapter_text: string;
  story_context: {
    title: string;
    genre?: string;
    style_preset: StylePreset;
    existing_characters: string[];
    existing_locations: string[];
  };
  extraction_parameters: {
    max_scenes: number;
    focus_areas: string[];
    emotional_range: EmotionalTone[];
  };
}

export interface GPTSceneExtractionResponse {
  scenes: {
    title: string;
    description: string;
    excerpt: string;
    emotional_tone: EmotionalTone;
    time_of_day: TimeOfDay;
    weather?: string;
    characters_present: string[];
    location: string;
    visual_elements: string[];
    narrative_importance: 'high' | 'medium' | 'low';
  }[];
  confidence_score: number;
  processing_notes: string[];
}

export interface GPTEntityExtractionResponse {
  characters: {
    name: string;
    aliases: string[];
    description: string;
    role: CharacterRole;
    personality_traits: string[];
    physical_description: string;
    current_emotional_state?: string;
  }[];
  locations: {
    name: string;
    type: LocationType;
    description: string;
    atmosphere: string;
    visual_details: string[];
  }[];
  relationships: {
    character_interactions: Record<string, string[]>;
    location_usage: Record<string, ProminenceLevel>;
  };
}

export interface PromptConstructionContext {
  scene: Scene;
  characters: CharacterWithReferences[];
  character_states: CharacterState[];
  locations: LocationWithState[];
  location_states: LocationState[];
  story_style: {
    preset: StylePreset;
    custom_prompt?: string;
    artistic_modifiers: string[];
  };
}

export interface ConstructedPrompt {
  main_prompt: string;
  negative_prompt: string;
  style_modifiers: string[];
  technical_parameters: {
    width: number;
    height: number;
    steps: number;
    cfg_scale: number;
    sampler: string;
  };
  character_ip_adapter_images: string[];
  metadata: {
    character_references: UUID[];
    location_references: UUID[];
    construction_notes: string[];
  };
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Timestamp;
}

export interface ValidationError extends APIError {
  field_errors: Record<string, string[]>;
}

// ============================================================================
// PAGINATION & FILTERING
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface StoryFilters {
  status?: StoryStatus[];
  genre?: string[];
  style_preset?: StylePreset[];
  is_public?: boolean;
  search?: string;
  created_after?: Timestamp;
  created_before?: Timestamp;
}

export interface SceneFilters {
  emotional_tone?: EmotionalTone[];
  time_of_day?: TimeOfDay[];
  has_images?: boolean;
  processing_status?: ProcessingStatus[];
  character_ids?: UUID[];
  location_ids?: UUID[];
}

// ============================================================================
// WEBHOOK & EVENT TYPES
// ============================================================================

export interface WebhookEvent {
  id: UUID;
  type: string;
  data: Record<string, any>;
  timestamp: Timestamp;
  user_id?: UUID;
}

export interface ImageGenerationCompleteEvent extends WebhookEvent {
  type: 'image.generation.complete';
  data: {
    image: Image;
    prompt: Prompt;
    scene_id: UUID;
    processing_time_ms: number;
    queue_time_ms: number;
  };
}

export interface SceneExtractionCompleteEvent extends WebhookEvent {
  type: 'scene.extraction.complete';
  data: {
    chapter_id: UUID;
    scenes: Scene[];
    processing_time_ms: number;
  };
}

export interface ProcessingJobFailedEvent extends WebhookEvent {
  type: 'job.failed';
  data: {
    job: ProcessingJob;
    error_message: string;
    retry_available: boolean;
  };
}

// ============================================================================
// ANALYTICS & METRICS
// ============================================================================

export interface UserUsageMetrics {
  user_id: UUID;
  period: {
    start: Timestamp;
    end: Timestamp;
  };
  stories_created: number;
  chapters_uploaded: number;
  scenes_generated: number;
  images_generated: number;
  credits_used: number;
  avg_processing_time_ms: number;
  most_used_style: StylePreset;
}

export interface SystemMetrics {
  period: {
    start: Timestamp;
    end: Timestamp;
  };
  total_users: number;
  active_users: number;
  total_stories: number;
  total_images_generated: number;
  avg_queue_time_ms: number;
  error_rate: number;
  popular_styles: Record<StylePreset, number>;
}

export default {
  // Export commonly used type guards
  isValidUUID: (value: string): value is UUID => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },
  
  isValidSubscriptionTier: (value: string): value is SubscriptionTier => {
    return SUBSCRIPTION_TIERS.includes(value as SubscriptionTier);
  },
  
  isValidStylePreset: (value: string): value is StylePreset => {
    return STYLE_PRESETS.includes(value as StylePreset);
  },
  
  isValidProcessingStatus: (value: string): value is ProcessingStatus => {
    return PROCESSING_STATUS.includes(value as ProcessingStatus);
  }
};