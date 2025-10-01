// Core entity types for My Works (Author) platform

export interface Work {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  last_edited_at: string;
  auto_enhance_enabled: boolean;
  target_scenes_per_chapter: number;
  chapter_count: number;
  word_count: number;
  enhancement_count: number;
  character_count: number;
  cover_image_url?: string;
  publication_status: 'draft' | 'published' | 'unpublished';
  read_count: number;
}

export interface Chapter {
  id: string;
  work_id: string;
  title?: string;
  content: string;
  order_index: number;
  word_count: number;
  enhancement_count: number;
  created_at: string;
  updated_at: string;
  enhancement_anchors: EnhancementAnchor[];
}

export interface EnhancementAnchor {
  id: string;
  position: number;
  type: 'auto' | 'manual' | 'highlight';
  enhancement_id?: string;
}

export interface Character {
  id: string;
  work_id: string;
  name: string;
  description: string;
  role?: string;
  appearance_count: number;
  linked_images_count: number;
  created_at: string;
  updated_at: string;
}

export interface Enhancement {
  id: string;
  chapter_id: string;
  anchor_id: string;
  position_start: number;
  position_end: number;
  prompt_text: string;
  prompt_type: 'auto' | 'manual' | 'highlight';
  generation_status: 'queued' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  active_version?: ImageVersion;
  versions: ImageVersion[];
  linked_characters: Character[];
}

export interface ImageVersion {
  id: string;
  enhancement_id: string;
  version_number: number;
  image_url: string;
  thumbnail_url: string;
  generation_params: Record<string, unknown>;
  quality_score: number;
  is_active: boolean;
  created_at: string;
}

export interface Publication {
  id: string;
  work_id: string;
  visibility: 'public' | 'unlisted';
  published_at: string;
  slug: string;
  seo_title: string;
  seo_description: string;
  public_url: string;
  preview_url: string;
  og_image_url?: string;
  estimated_indexing?: string;
}

export interface ViewEvent {
  id: string;
  publication_id: string;
  chapter_id?: string;
  session_id: string;
  read_duration_seconds?: number;
  scroll_percentage?: number;
  user_agent?: string;
  referrer?: string;
  created_at: string;
}

// API Request/Response types

export interface CreateWorkRequest {
  title: string;
  description?: string;
  auto_enhance_enabled?: boolean;
  target_scenes_per_chapter?: number;
}

export interface UpdateWorkRequest {
  title?: string;
  description?: string;
  auto_enhance_enabled?: boolean;
  target_scenes_per_chapter?: number;
}

export interface CreateChapterRequest {
  title?: string;
  content: string;
  order_index: number;
}

export interface UpdateChapterRequest {
  title?: string;
  content?: string;
  enhancement_anchors?: EnhancementAnchor[];
}

export interface AutoSaveRequest {
  content: string;
  cursor_position: number;
  last_save_time: string;
}

export interface AutoSaveResponse {
  saved_at: string;
  word_count: number;
  conflict: boolean;
  server_version?: {
    content: string;
    updated_at: string;
  };
}

export interface CreateCharacterRequest {
  name: string;
  description: string;
  role?: string;
}

export interface AutoEnhanceRequest {
  chapter_id: string;
  content: string;
  target_scenes?: number;
  character_context?: Array<{
    name: string;
    description: string;
  }>;
}

export interface AutoEnhanceResponse {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'partial' | 'failed';
  estimated_completion: string;
  anchor_positions: Array<{
    id: string;
    position: number;
    prompt_preview: string;
  }>;
}

export interface ManualEnhanceRequest {
  chapter_id: string;
  position: number;
  prompt: string;
  context_before?: string;
  context_after?: string;
  linked_characters?: string[];
}

export interface EnhancementStatusResponse {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'partial' | 'failed';
  progress: number;
  completed_at?: string;
  enhancements: Array<{
    enhancement_id: string;
    anchor_id: string;
    status: string;
    image_url?: string;
    thumbnail_url?: string;
  }>;
  failed_enhancements: Array<{
    anchor_id: string;
    error: string;
  }>;
  total_generated: number;
}

export interface PublishWorkRequest {
  work_id: string;
  visibility: 'public' | 'unlisted';
  seo_title?: string;
  seo_description?: string;
  custom_slug?: string;
}

export interface AnalyticsResponse {
  work: {
    id: string;
    title: string;
    publication_status: string;
    published_at?: string;
  };
  period: {
    start: string;
    end: string;
    duration_days: number;
  };
  summary: {
    total_views: number;
    unique_visitors: number;
    average_read_time: string;
    completion_rate: number;
    bounce_rate: number;
    top_referrer?: string;
  };
  daily_stats: Array<{
    date: string;
    views: number;
    unique_visitors: number;
    average_read_time: number;
  }>;
  chapters: Array<{
    chapter_id: string;
    title: string;
    views: number;
    unique_views: number;
    average_read_time: number;
    completion_rate: number;
    drop_off_points: Array<{
      position: number;
      percentage: number;
    }>;
  }>;
}

// UI State types

export interface WorksListState {
  works: Work[];
  loading: boolean;
  error?: string;
  hasMore: boolean;
  total: number;
}

export interface ChapterEditorState {
  chapter?: Chapter;
  content: string;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved?: string;
  wordCount: number;
  cursorPosition: number;
}

export interface EnhancementJobState {
  jobId?: string;
  status: 'idle' | 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  enhancements: Enhancement[];
  error?: string;
}

// API Error types

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ValidationError extends ApiError {
  details: Record<string, string>;
}

export interface RateLimitError extends ApiError {
  retry_after: number;
}

// Utility types

export type WorkStatus = Work['status'];
export type EnhancementStatus = Enhancement['generation_status'];
export type PublicationVisibility = Publication['visibility'];

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface SortParams {
  sort?: 'created_desc' | 'updated_desc' | 'title_asc';
}

export interface FilterParams {
  status?: WorkStatus;
}

export type WorksQueryParams = PaginationParams & SortParams & FilterParams;