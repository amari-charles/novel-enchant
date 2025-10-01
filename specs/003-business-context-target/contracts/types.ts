/**
 * Shared Type Definitions
 * Common types used across all enhancement services
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

export interface Anchor {
  id: string
  chapterId: string
  position: number
  activeImageId?: string
  createdAt: string
  updatedAt: string
}

export interface Image {
  id: string
  promptId: string
  url: string
  thumbnailUrl?: string
  scores: QualityScores
  metadata: ImageMetadata
  createdAt: string
}

export interface Prompt {
  id: string
  body: string
  refIds: string[]      // Referenced character IDs
  seed?: string
  meta: PromptMetadata
  createdAt: string
}

// Enums and Union Types
export type CharacterStatus = 'candidate' | 'confirmed' | 'ignored' | 'merged'

export type InsertMode = 'existing' | 'new' | 'auto'

export type PromptType = 'auto' | 'manual' | 'highlight'

export type ArtStyle = 'realistic' | 'anime' | 'watercolor' | 'sketch'

export type ColorPalette = 'warm' | 'cool' | 'monochrome' | 'vibrant'

export type Mood = 'dramatic' | 'peaceful' | 'mysterious' | 'cheerful'

export type ImageFormat = 'jpg' | 'png' | 'webp'

export type QualityVerdict = 'ok' | 'retry' | 'manual_review'

// Supporting Interfaces
export interface StylePreferences {
  artStyle?: ArtStyle
  colorPalette?: ColorPalette
  mood?: Mood
}

export interface QualityScores {
  textAlign: number     // 0-1, how well image matches text
  refSim: number        // 0-1, character consistency score
  overall: number       // 0-1, combined quality
  verdict: QualityVerdict
}

export interface ImageMetadata {
  width: number
  height: number
  format: ImageFormat
  generationTime: number
  seed?: string
}

export interface PromptMetadata {
  type: PromptType
  sourceText?: string   // Original text for highlight prompts
  characterNames: string[]
  artStyle?: string
  mood?: string
}

// Service Response Base Types
export interface ServiceResponse<T = any> {
  success: boolean
  data?: T
  error?: ServiceError
  timestamp: string
}

export interface ServiceError {
  code: string
  message: string
  details?: any
  userMessage: string
}

// Validation Schemas (for runtime validation)
export interface ValidationRule {
  field: string
  type: 'required' | 'length' | 'range' | 'format' | 'custom'
  params?: any
  message: string
}

export interface EntityValidation {
  entity: string
  rules: ValidationRule[]
}

// Mock Service Configuration
export interface MockServiceConfig {
  baseDelay: number
  varianceMs: number
  failureRate: number
  imageBaseUrl: string
  characterNamePool: string[]
  qualityScoreRanges: {
    textAlign: [number, number]
    refSim: [number, number]
  }
}

// Utility Types
export type PartialUpdate<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>

export type CreateRequest<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>

export type EntityId = string

export type Timestamp = string

// Frontend-Specific Types
export interface UIState<T = any> {
  data: T | null
  loading: boolean
  error: ServiceError | null
  lastUpdated?: Timestamp
}

export interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Event Types (for service communication)
export interface ServiceEvent {
  type: string
  payload: any
  timestamp: Timestamp
  source: string
}

export type EventHandler<T = any> = (event: ServiceEvent & { payload: T }) => void

// Configuration Types
export interface ServiceConfig {
  apiUrl?: string
  timeout: number
  retryAttempts: number
  cacheEnabled: boolean
  mockMode: boolean
}

// Constants
export const DEFAULT_QUALITY_SCORES: QualityScores = {
  textAlign: 0.8,
  refSim: 0.7,
  overall: 0.75,
  verdict: 'ok'
}

export const DEFAULT_CHARACTER_NAMES = [
  'Character A',
  'Character B',
  'Character C',
  'Character D',
  'Character E'
]

export const IMAGE_DIMENSIONS = {
  width: 1024,
  height: 768,
  thumbnail: {
    width: 200,
    height: 150
  }
}

export const VALIDATION_LIMITS = {
  chapterMinLength: 100,
  chapterMaxLength: 50000,
  titleMaxLength: 200,
  nameMaxLength: 100,
  descriptionMaxLength: 500,
  promptMaxLength: 500,
  aliasMaxCount: 10
}