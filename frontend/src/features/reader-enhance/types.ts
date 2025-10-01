/**
 * TypeScript types for Reader Enhance feature
 * Feature: Reader Enhance Flow (Spec 001)
 * Generated from data-model.md
 */

// Source types for how content is provided
export type SourceType = 'paste' | 'file' | 'import';

// Enhancement job status
export type EnhancementStatus = 'queued' | 'running' | 'failed' | 'completed';

// Scene processing status
export type SceneStatus = 'pending' | 'generating' | 'generated' | 'accepted' | 'failed';

// Image metadata
export interface ImageData {
  url: string;
  alt_text: string;
  width: number;
  height: number;
  format: string;
}

// Image take for retry functionality
export interface ImageTake {
  id: string;
  url: string;
  accepted: boolean;
  generatedAt: string;
}

// Scene within a chapter
export interface Scene {
  id: string;
  chapter_id: string;
  excerpt: string;
  image_url?: string;
  image_prompt?: string;
  accepted: boolean;
  order_index: number;
  generated_at?: string;
  status?: SceneStatus;
  takes?: ImageTake[];
}

// Chapter containing scenes
export interface Chapter {
  id: string;
  title?: string;
  order_index: number;
  scenes: ScenePreview[];
  content?: string;  // Full chapter text content
  enhanced?: boolean; // Whether chapter has been enhanced with AI images
}

// Main enhanced copy entity (matches database schema)
export interface EnhancedCopy {
  id: string;
  user_id: string;
  job_id: string;
  title: string;
  content: {
    chapters: Chapter[];
  };
  created_at: string;
  updated_at: string;
}

// Enhancement job tracking
export interface EnhanceJob {
  id: string;
  user_id: string;
  source_type: SourceType;
  title?: string;
  text_content?: string;
  file_url?: string;
  status: EnhancementStatus;
  progress: number; // 0-100
  scenes?: ScenePreview[];
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// Scene preview for job status
export interface ScenePreview {
  id: string;
  chapter_id?: string;
  excerpt: string;
  image_url?: string;
  status: SceneStatus;
  accepted?: boolean;
  order_index?: number;
  takes?: ImageTake[];
}

// API request/response types

export interface CreateEnhancementRequest {
  source: SourceType;
  title?: string;
  text?: string;
  fileId?: string;
}

export interface CreateEnhancementResponse {
  jobId: string;
}

export interface GetJobStatusResponse {
  status: EnhancementStatus;
  progress: number;
  scenes?: ScenePreview[];
  error?: string;
}

export interface AcceptImageRequest {
  jobId: string;
  sceneId: string;
  takeId: string;
}

export interface AcceptImageResponse {
  success: boolean;
  message: string;
}

export interface RetryImageRequest {
  jobId: string;
  sceneId: string;
}

export interface RetryImageResponse {
  success: boolean;
  message: string;
  newTakeId: string;
}

export interface SaveToShelfRequest {
  jobId: string;
  title?: string;
}

export interface SaveToShelfResponse {
  copyId: string;
  redirectUrl: string;
}

// Enhanced copy list item for My Shelf
export interface EnhancedCopyListItem {
  id: string;
  title: string;
  cover_image_url?: string;
  scene_count: number;
  created_at: string;
}

// File upload types
export interface FileUpload {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

// Enhancement progress state
export interface EnhancementProgress {
  jobId?: string;
  status: EnhancementStatus;
  progress: number;
  currentStep?: string;
  scenes: ScenePreview[];
  error?: string;
}

// Validation constraints (from spec)
export const VALIDATION_LIMITS = {
  MAX_FILE_SIZE_MB: 2,
  MAX_WORD_COUNT: 50000,
  MAX_SCENES_PER_COPY: 30,
  MIN_SCENE_EXCERPT_LENGTH: 100,
  MAX_SCENE_EXCERPT_LENGTH: 2000,
  MAX_TITLE_LENGTH: 255,
  TARGET_SCENES_PER_1K_WORDS: 4, // 3-5 range, using middle value
} as const;

// Error types for better error handling
export interface EnhanceError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Hook state types
export interface UseEnhanceProgressState {
  job: EnhanceJob | null;
  isLoading: boolean;
  error: EnhanceError | null;
}

export interface UseFileUploadState {
  upload: FileUpload | null;
  isUploading: boolean;
  error: string | null;
}

// Component prop types
export interface ImageReviewProps {
  scene: ScenePreview;
  onAccept: (sceneId: string, takeId: string) => void;
  onRetry: (sceneId: string) => void;
  isProcessing: boolean;
}

export interface EnhanceUploadProps {
  onTextSubmit: (text: string, title?: string) => void;
  onFileSubmit: (file: File, title?: string) => void;
  isProcessing: boolean;
  maxFileSizeMB: number;
  supportedFormats: string[];
}

// Utility types for form handling
export interface PasteFormData {
  text: string;
  title?: string;
}

export interface FileFormData {
  file: File;
  title?: string;
}

// Route parameters
export interface ReadingViewParams {
  copyId: string;
}

// Storage path utilities
export const getStoragePaths = (userId: string, copyId: string) => ({
  scenes: `enhanced-copies/${userId}/${copyId}/scenes`,
  sourceFile: `enhanced-copies/${userId}/${copyId}/source`,
}) as const;