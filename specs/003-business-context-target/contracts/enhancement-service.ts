/**
 * Enhancement Service Contract
 * Defines interfaces for AI-powered story illustration generation
 */

// Request/Response Types
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

// Enums and Supporting Types
export type InsertMode = 'existing' | 'new' | 'auto'

export interface StylePreferences {
  artStyle?: 'realistic' | 'anime' | 'watercolor' | 'sketch'
  colorPalette?: 'warm' | 'cool' | 'monochrome' | 'vibrant'
  mood?: 'dramatic' | 'peaceful' | 'mysterious' | 'cheerful'
}

// Core Service Interface
export interface EnhancementService {
  /**
   * Auto-generate 2-3 illustrations for a chapter
   * @param request Chapter content and preferences
   * @returns Generated anchors and character candidates
   */
  autoEnhance(request: AutoEnhanceRequest): Promise<AutoEnhanceResponse>

  /**
   * Manually insert image at specific position
   * @param request Position, mode, and context
   * @returns Generated image and anchor
   */
  manualInsert(request: ManualInsertRequest): Promise<ManualInsertResponse>

  /**
   * Retry image generation at existing anchor
   * @param request Anchor and optional modifications
   * @returns New image for same anchor
   */
  retryEnhancement(request: RetryEnhancementRequest): Promise<RetryEnhancementResponse>

  /**
   * Accept generated image and mark as final
   * @param anchorId Anchor to accept
   * @returns Updated anchor with confirmed image
   */
  acceptEnhancement(anchorId: string): Promise<Anchor>
}

// Error Types
export class EnhancementError extends Error {
  constructor(
    public code: EnhancementErrorCode,
    public userMessage: string,
    public details?: any
  ) {
    super(userMessage)
    this.name = 'EnhancementError'
  }
}

export type EnhancementErrorCode =
  | 'OUT_OF_BOUNDS'           // Position outside chapter text
  | 'INVALID_INPUT'           // Malformed request data
  | 'GENERATION_FAILED'       // AI service failure
  | 'CHARACTER_NOT_FOUND'     // Referenced character doesn't exist
  | 'ANCHOR_NOT_FOUND'        // Referenced anchor doesn't exist
  | 'INSUFFICIENT_TEXT'       // Chapter too short for auto-enhancement

// Mock Implementation Specification
export interface MockEnhancementService extends EnhancementService {
  /**
   * Configure mock behavior for testing
   * @param config Mock service configuration
   */
  configure(config: MockConfig): void
}

export interface MockConfig {
  autoEnhanceDelay: number      // Simulated processing time
  manualInsertDelay: number     // Simulated generation time
  failureRate: number           // 0-1, rate of simulated failures
  imageBaseUrl: string          // Base URL for placeholder images
  defaultCharacterNames: string[] // Character name pool
}