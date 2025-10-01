/**
 * Enhancement Engine Types
 * Core types for AI-powered story illustration system
 */

// Core Entities
export interface Work {
  id: string
  userId: string
  title: string
  styleLock?: StylePreferences
  createdAt: string
  updatedAt: string
}

export interface Chapter {
  id: string
  workId: string
  text: string
  title?: string
  orderIndex: number
  createdAt: string
  updatedAt: string
}

export interface Anchor {
  id: string
  chapterId: string
  position: number
  activeImageId?: string
  imageUrl?: string // Direct image URL for reader-enhance flow
  createdAt: string
  updatedAt: string
}

export interface Image {
  id: string
  anchorId: string
  promptId: string
  url: string
  thumbnailUrl?: string
  status: 'generating' | 'completed' | 'failed'
  metadata: ImageMetadata
  createdAt: string
  updatedAt: string
}

export interface Prompt {
  id: string
  anchorId: string
  version: number
  body: string
  refIds: string[]      // Referenced character IDs
  seed?: string
  meta: PromptMetadata
  createdAt: string
  updatedAt: string
}

// Style and Quality Types
export interface StylePreferences {
  artStyle?: 'realistic' | 'anime' | 'watercolor' | 'sketch'
  colorPalette?: 'warm' | 'cool' | 'monochrome' | 'vibrant'
  mood?: 'dramatic' | 'peaceful' | 'mysterious' | 'cheerful'
}

export interface QualityScores {
  textAlign: number     // 0-1, how well image matches text
  refSim: number        // 0-1, character consistency score
  overall: number       // 0-1, combined quality
  verdict: 'ok' | 'retry' | 'manual_review'
}

export interface ImageMetadata {
  model?: string
  width?: number
  height?: number
  format?: 'jpg' | 'png' | 'webp'
  generationTime?: number
  seed?: string
  timestamp?: string
  prompt?: string
  revisedPrompt?: string
  size?: string
  quality?: string
  estimatedCost?: number
  [key: string]: unknown  // Allow additional metadata
}

export interface PromptMetadata {
  type: 'auto' | 'manual' | 'highlight' | 'retry'
  sourceText?: string   // Original text for highlight prompts
  characterNames?: string[]
  artStyle?: string
  mood?: string
  context?: Record<string, unknown>  // Allow additional context data
  [key: string]: unknown  // Allow additional metadata
}

// Service Request/Response Types
export interface AutoEnhanceRequest {
  chapterId: string
  text: string
  existingCharacters: Character[]
  stylePreferences?: StylePreferences
}

export interface AutoEnhanceResponse {
  anchors: Anchor[]
  candidateCharacters: Character[]
  jobId: string
  estimatedDuration: number
}

export interface ManualInsertRequest {
  chapterId: string
  position: number
  mode: InsertMode
  contextText?: string  // For highlight mode
  characterIds?: string[]  // For existing mode
  customPrompt?: string
  stylePreferences?: StylePreferences
}

export interface ManualInsertResponse {
  anchor: Anchor
  image: Image
  prompt: Prompt
  candidateCharacters?: Character[]  // For auto/new modes
}

export interface RetryEnhancementRequest {
  anchorId: string
  modifyPrompt?: boolean
  newPrompt?: string
  characterIds?: string[]
}

export interface RetryEnhancementResponse {
  image: Image
  prompt: Prompt
  anchor: Anchor
}

// Character Types (shared with character-registry)
export interface Character {
  id: string
  workId: string
  name?: string
  shortDesc?: string
  status: CharacterStatus
  aliases: string[]
  confidence: number
  createdAt: string
  updatedAt: string
}

export type CharacterStatus = 'candidate' | 'confirmed' | 'ignored' | 'merged'

export type InsertMode = 'existing' | 'new' | 'auto'

// Enhancement Service Interface
export interface EnhancementService {
  autoEnhance(request: AutoEnhanceRequest): Promise<AutoEnhanceResponse>
  manualInsert(request: ManualInsertRequest): Promise<ManualInsertResponse>
  retryEnhancement(request: RetryEnhancementRequest): Promise<RetryEnhancementResponse>
  acceptEnhancement(anchorId: string): Promise<Anchor>
}

// Error Types
export class EnhancementError extends Error {
  public code: EnhancementErrorCode
  public userMessage: string
  public details?: Record<string, unknown>

  constructor(
    code: EnhancementErrorCode,
    userMessage: string,
    details?: Record<string, unknown>
  ) {
    super(userMessage)
    this.name = 'EnhancementError'
    this.code = code
    this.userMessage = userMessage
    this.details = details
  }
}

export type EnhancementErrorCode =
  | 'OUT_OF_BOUNDS'           // Position outside chapter text
  | 'INVALID_INPUT'           // Malformed request data
  | 'GENERATION_FAILED'       // AI service failure
  | 'CHARACTER_NOT_FOUND'     // Referenced character doesn't exist
  | 'ANCHOR_NOT_FOUND'        // Referenced anchor doesn't exist
  | 'INSUFFICIENT_TEXT'       // Chapter too short for auto-enhancement
  | 'CONTENT_VIOLATION'       // Content violates moderation policies
  | 'AI_ERROR'                // AI service error
  | 'PARSE_ERROR'             // Failed to parse AI response

// UI State Types
export interface EnhancementState {
  status: 'idle' | 'generating' | 'completed' | 'error'
  enhancements: Enhancement[]
  characters: Character[]
  activeAnchor?: string
  error?: EnhancementError
}

export interface Enhancement {
  id: string
  anchor: Anchor
  image?: Image
  prompt: Prompt
  status: 'pending' | 'accepted' | 'retrying'
}

export type EnhancementAction =
  | { type: 'START_AUTO_ENHANCE'; payload: { chapterId: string; text: string } }
  | { type: 'START_MANUAL_INSERT'; payload: ManualInsertRequest }
  | { type: 'START_RETRY'; payload: { enhancementId: string } }
  | { type: 'ENHANCEMENT_SUCCESS'; payload: Enhancement }
  | { type: 'ENHANCEMENT_ERROR'; payload: EnhancementError }
  | { type: 'ACCEPT_ENHANCEMENT'; payload: { enhancementId: string } }
  | { type: 'RESET' }

// Constants
export const DEFAULT_QUALITY_SCORES: QualityScores = {
  textAlign: 0.8,
  refSim: 0.7,
  overall: 0.75,
  verdict: 'ok'
}

export const IMAGE_DIMENSIONS = {
  width: 1024,
  height: 768,
  thumbnail: {
    width: 200,
    height: 150
  }
}