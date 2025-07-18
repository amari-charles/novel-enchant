/**
 * Novel Enchant - Shared TypeScript Types
 * Updated types for the new functional approach
 */

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type UUID = string;
export type Timestamp = string; // ISO 8601 timestamp

// ============================================================================
// CORE FUNCTION INPUT/OUTPUT TYPES
// ============================================================================

// Function 1: parseUploadedText
export interface ParseUploadedTextInput {
  file: File;
}

export interface ParsedText {
  title: string;
  fullText: string;
  chapters?: ParsedChapter[];
  contentType: 'single_chapter' | 'multi_chapter' | 'full_book';
  detectionMetadata: {
    chapterPatterns: string[];
    wordCount: number;
    structuralIndicators: string[];
    confidence: number;
  };
}

export interface ParsedChapter {
  id: string;
  number: number;
  title: string;
  content: string;
  wordCount: number;
  startIndex: number;
  endIndex: number;
}

// Function 2: chunkTextIntoSections
export interface ChunkTextIntoSectionsInput {
  text: string;
  chunkStrategy?: 'paragraph' | 'semantic' | 'fixed';
  maxChunkSize?: number;
}

export interface Chunk {
  id: string;
  index: number;
  text: string;
  boundaries: 'natural' | 'forced';
}

// Function 3: extractVisualScenes
export interface ExtractVisualScenesInput {
  chunk: Chunk;
  context: StoryContext;
}

export interface Scene {
  id: string;
  text: string;
  summary: string;
  visualScore: number;
  impactScore: number;
  timeOfDay?: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night' | 'unknown';
  emotionalTone?: 'happy' | 'sad' | 'tense' | 'romantic' | 'action' | 'mysterious' | 'peaceful';
  actionLevel?: number;
}

export interface StoryContext {
  storyId: string;
  title: string;
  genre?: string;
  stylePreset: StylePreset;
  existingCharacters: string[];
  existingLocations: string[];
}

// Function 4: identifySceneMentions
export interface IdentifySceneMentionsInput {
  sceneText: string;
}

export interface RawMention {
  mentionText: string;
  sentence: string;
  startIndex: number;
  endIndex: number;
}

// Function 5: resolveMentionsToEntities
export interface ResolveMentionsToEntitiesInput {
  mentions: RawMention[];
  knownEntities: Entity[];
}

export interface EntityLink {
  mentionText: string;
  resolvedEntityId?: string;
  confidence: number;
  alternativeCandidates?: string[];
  disambiguationContext?: string;
}

// Function 6: extractNewEntitiesFromScene
export interface ExtractNewEntitiesFromSceneInput {
  sceneText: string;
  resolvedLinks: EntityLink[];
}

export interface Entity {
  id: string;
  name: string;
  type: 'character' | 'location';
  description: string;
  aliases?: string[];
  firstAppearance?: string;
  referenceImages: EntityReference[];
  storyId?: string;
}

export interface EntityReference {
  id: string;
  imageUrl: string;
  addedAtChapter: number;
  ageTag?: 'young' | 'adult' | 'mature' | 'elderly' | 'child';
  stylePreset: string;
  description: string;
  isActive: boolean;
  priority: number; // Higher priority references used first in generation
  metadata: {
    generatedAt: string;
    modelVersion: string;
    qualityScore?: number;
    generationMethod: 'ai_generated' | 'user_uploaded' | 'extracted';
    sourcePrompt?: string;
  };
}

// Function 7: mergeEntities
export interface MergeEntitiesInput {
  newEntities: Entity[];
  existingEntities: Entity[];
}

// Function 8: trackEntityEvolution
export interface TrackEntityEvolutionInput {
  entity: Entity;
  newDescription: string;
  chapterNumber?: number;
}

export interface EvolutionChange {
  updated: boolean;
  notes?: string;
  previousDescription?: string;
  changes: string[];
}

// Function 9: generateReferenceImage
export interface GenerateReferenceImageInput {
  entity: Entity;
  stylePreset?: StylePreset;
  chapterNumber?: number;
  ageTag?: 'young' | 'adult' | 'mature' | 'elderly' | 'child';
  priority?: number;
}

export interface ImageMetadata {
  imageUrl: string;
  modelVersion: string;
  generationParams?: Record<string, any>;
}

// Function 10: generateRefImageFromUpload
export interface GenerateRefImageFromUploadInput {
  image: File;
  entityId?: string;
}

// Function 11: constructImagePrompt
export interface ConstructImagePromptInput {
  scene: Scene;
  entityLinks: EntityLink[];
  style: StylePreset;
  customStylePrompt?: string;
  artisticDirection?: string;
  previousChapterContext?: ChapterContext;
  chapterNumber?: number;
}

export interface ChapterContext {
  chapterNumber: number;
  entityStates: Record<string, EntityReference[]>; // entityId -> latest references
  previousScenes: Scene[];
  styleEvolution: string[];
}

export interface Prompt {
  id: string;
  text: string;
  negativePrompt?: string;
  style: string;
  refImageUrls: string[];
  referenceImages: PromptReference[]; // Enhanced reference handling
  technicalParams: {
    width: number;
    height: number;
    steps: number;
    cfgScale: number;
    sampler?: string;
  };
  parentPromptId?: string;
  modificationHistory?: PromptModification[];
}

export interface PromptReference {
  entityId: string;
  entityName: string;
  entityType: 'character' | 'location';
  imageUrl: string;
  weight: number; // 0.0 to 1.0 for blending multiple references
  ageTag?: string;
  description: string;
}

export interface PromptModification {
  timestamp: string;
  modifications: Array<{
    type: string;
    description: string;
  }>;
  previousPromptId: string;
}

// Function 12: generateImageFromPrompt
export interface GenerateImageFromPromptInput {
  prompt: Prompt;
  priority?: number;
  sceneId?: string;
  replaceExisting?: boolean;
}

export interface GeneratedImage {
  imageUrl: string;
  status: 'success' | 'error' | 'processing';
  metadata: {
    seed?: number;
    modelVersion: string;
    generationTime?: number;
    cost?: number;
  };
  error?: string;
}

// Function 13: assessImageQuality
export interface AssessImageQualityInput {
  imageUrl: string;
  prompt: Prompt;
  sceneContext?: Scene;
}

export interface QualityReport {
  qualityScore: number;
  issues: string[];
  suggestions: string[];
  metrics: {
    promptAdherence: number;
    technicalQuality: number;
    aestheticScore: number;
  };
}

// Function 14: applyPromptModifications
export interface ApplyPromptModificationsInput {
  originalPrompt: Prompt;
  modifications: ModificationRequest[];
}

export interface ModificationRequest {
  type: 'add_element' | 'remove_element' | 'change_style' | 'adjust_lighting' | 
        'modify_character' | 'add_detail' | 'remove_detail' | 'change_mood' | 
        'adjust_composition' | 'custom';
  target?: string; // For remove operations
  value?: string; // For add/change operations
  description?: string; // Human readable description
}

// Function 15: editEntityDescription
export interface EditEntityDescriptionInput {
  entityId: string;
  newDescription: string;
  preserveHistory?: boolean;
}

export interface UpdatedEntity {
  id: string;
  updatedDescription: string;
  previousDescription?: string;
  changeTimestamp: Timestamp;
}

// ============================================================================
// SHARED TYPES
// ============================================================================

export const STYLE_PRESETS = [
  'fantasy',
  'scifi',
  'romance',
  'thriller',
  'historical',
  'contemporary',
  'anime',
  'realistic',
  'painterly',
  'cinematic'
] as const;

export type StylePreset = typeof STYLE_PRESETS[number];

export const PROCESSING_STATUS = ['pending', 'processing', 'completed', 'failed'] as const;
export type ProcessingStatus = typeof PROCESSING_STATUS[number];

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface FunctionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: Timestamp;
}

export interface ProcessingJob {
  id: string;
  type: string;
  status: ProcessingStatus;
  progress: number;
  startTime: Timestamp;
  endTime?: Timestamp;
  error?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// DATABASE TYPES (simplified)
// ============================================================================

export interface Story {
  id: string;
  userId: string;
  title: string;
  description?: string;
  genre?: string;
  stylePreset: StylePreset;
  customStylePrompt?: string;
  status: 'active' | 'processing' | 'completed' | 'failed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface StoryChapter {
  id: string;
  storyId: string;
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
  processingStatus: ProcessingStatus;
  createdAt: Timestamp;
}

export interface StoryScene {
  id: string;
  chapterId: string;
  sceneNumber: number;
  title: string;
  description: string;
  excerpt?: string;
  visualScore: number;
  impactScore: number;
  timeOfDay?: string;
  emotionalTone?: string;
  processingStatus: ProcessingStatus;
  createdAt: Timestamp;
}

export interface StoryEntity {
  id: string;
  storyId: string;
  name: string;
  type: 'character' | 'location';
  description: string;
  aliases: string[];
  firstAppearanceChapter?: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface EntityEvolution {
  id: string;
  entityId: string;
  chapterNumber: number;
  description: string;
  changes: string[];
  createdAt: Timestamp;
}

export interface SceneImage {
  id: string;
  sceneId: string;
  promptId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  qualityScore?: number;
  userRating?: number;
  isSelected: boolean;
  generationParams?: Record<string, any>;
  version: number; // For tracking regenerations
  replacedImageId?: string; // Reference to previous version
  createdAt: Timestamp;
}

// ============================================================================
// SEQUENTIAL PROCESSING TYPES
// ============================================================================

export interface ChapterProcessingJob {
  id: string;
  storyId: string;
  chapterNumber: number;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'waiting_for_previous';
  prerequisiteChapter?: number; // Must complete before this can start
  priority: number;
  createdAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  error?: string;
}

export interface ProcessingSequence {
  storyId: string;
  chapters: ChapterProcessingJob[];
  currentChapter?: number;
  totalChapters: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const isValidUUID = (value: string): value is UUID => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

export const isValidStylePreset = (value: string): value is StylePreset => {
  return STYLE_PRESETS.includes(value as StylePreset);
};

export const createFunctionResponse = <T>(
  success: boolean,
  data?: T,
  error?: { code: string; message: string; details?: Record<string, any> }
): FunctionResponse<T> => ({
  success,
  data,
  error,
  timestamp: new Date().toISOString()
});

export const generateUUID = (): UUID => {
  return crypto.randomUUID();
};