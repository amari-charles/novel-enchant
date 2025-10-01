/**
 * Character Service Contract
 * Defines interfaces for character registry and consistency management
 */

// Request/Response Types
export interface DetectCharactersRequest {
  text: string
  existingCharacters: Character[]
  workId: string
}

export interface DetectCharactersResponse {
  candidates: Character[]
  mentions: CharacterMention[]
}

export interface ResolveCharacterRequest {
  candidateId: string
  action: ResolveAction
  targetCharacterId?: string  // For merge action
  confirmedName?: string      // For confirm action
  confirmedDescription?: string
}

export interface ResolveCharacterResponse {
  character: Character
  mergedWith?: Character  // If action was merge
}

export interface UpdateCharacterRequest {
  characterId: string
  name?: string
  description?: string
  aliases?: string[]
}

export interface UpdateCharacterResponse {
  character: Character
}

// Supporting Types
export interface CharacterMention {
  text: string
  position: number
  confidence: number
  candidateId?: string
}

export type ResolveAction = 'confirm' | 'ignore' | 'merge'

export interface CharacterConsistencyCheck {
  characterId: string
  previousImages: string[]  // URLs of previous character images
  consistency: number       // 0-1 similarity score
  verdict: 'consistent' | 'inconsistent' | 'uncertain'
}

// Core Service Interface
export interface CharacterService {
  /**
   * Detect and extract character mentions from text
   * @param request Text content and existing characters
   * @returns Candidate characters and mention positions
   */
  detectCharacters(request: DetectCharactersRequest): Promise<DetectCharactersResponse>

  /**
   * Resolve candidate character (confirm, ignore, or merge)
   * @param request Resolution action and details
   * @returns Updated character state
   */
  resolveCharacter(request: ResolveCharacterRequest): Promise<ResolveCharacterResponse>

  /**
   * Update existing character information
   * @param request Character updates
   * @returns Updated character
   */
  updateCharacter(request: UpdateCharacterRequest): Promise<UpdateCharacterResponse>

  /**
   * Get all characters for a work
   * @param workId Work identifier
   * @returns List of confirmed characters
   */
  listCharacters(workId: string): Promise<Character[]>

  /**
   * Get character candidates awaiting resolution
   * @param workId Work identifier
   * @returns List of candidate characters
   */
  listCandidates(workId: string): Promise<Character[]>

  /**
   * Check consistency of character across images
   * @param characterId Character to check
   * @param imageUrls Images to compare
   * @returns Consistency analysis
   */
  checkConsistency(characterId: string, imageUrls: string[]): Promise<CharacterConsistencyCheck>

  /**
   * Get character aliases and alternative names
   * @param characterId Character identifier
   * @returns List of known aliases
   */
  getAliases(characterId: string): Promise<string[]>
}

// Error Types
export class CharacterError extends Error {
  constructor(
    public code: CharacterErrorCode,
    public userMessage: string,
    public details?: any
  ) {
    super(userMessage)
    this.name = 'CharacterError'
  }
}

export type CharacterErrorCode =
  | 'CHARACTER_NOT_FOUND'     // Referenced character doesn't exist
  | 'INVALID_RESOLUTION'      // Invalid resolve action or target
  | 'MERGE_CONFLICT'          // Cannot merge incompatible characters
  | 'NAME_TAKEN'              // Character name already exists in work
  | 'INVALID_STATUS'          // Character status transition not allowed

// Mock Implementation Specification
export interface MockCharacterService extends CharacterService {
  /**
   * Configure mock behavior for testing
   * @param config Mock service configuration
   */
  configure(config: MockCharacterConfig): void
}

export interface MockCharacterConfig {
  detectionDelay: number        // Simulated processing time
  defaultNames: string[]        // Pool of mock character names
  confidenceRange: [number, number]  // Min/max confidence scores
  consistencyThreshold: number  // Threshold for consistency checks
  autoResolveRate: number       // Rate of auto-resolved candidates
}