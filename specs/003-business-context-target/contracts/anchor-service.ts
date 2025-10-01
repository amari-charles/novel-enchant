/**
 * Anchor Service Contract
 * Defines interfaces for position tracking and image placement
 */

// Request/Response Types
export interface CreateAnchorRequest {
  chapterId: string
  position: number
  imageId?: string
}

export interface CreateAnchorResponse {
  anchor: Anchor
  isNew: boolean  // False if anchor already existed at position
}

export interface UpdateAnchorRequest {
  anchorId: string
  imageId?: string  // Update active image
  position?: number // Update position (rare)
}

export interface UpdateAnchorResponse {
  anchor: Anchor
  positionChanged: boolean
}

export interface GetAnchorsRequest {
  chapterId: string
  includeEmpty?: boolean  // Include anchors without images
}

export interface GetAnchorsResponse {
  anchors: Anchor[]
  totalCount: number
}

export interface ValidatePositionRequest {
  chapterId: string
  position: number
  textLength: number
}

export interface ValidatePositionResponse {
  isValid: boolean
  adjustedPosition?: number  // Suggested valid position if invalid
  reason?: string           // Why position is invalid
}

// Core Service Interface
export interface AnchorService {
  /**
   * Create or retrieve anchor at specific position
   * Ensures idempotency - same position always returns same anchor
   * @param request Chapter and position details
   * @returns Anchor (new or existing)
   */
  createAnchor(request: CreateAnchorRequest): Promise<CreateAnchorResponse>

  /**
   * Update anchor with new image or position
   * @param request Anchor updates
   * @returns Updated anchor
   */
  updateAnchor(request: UpdateAnchorRequest): Promise<UpdateAnchorResponse>

  /**
   * Get all anchors for a chapter
   * @param request Chapter identifier and filters
   * @returns List of anchors
   */
  getAnchors(request: GetAnchorsRequest): Promise<GetAnchorsResponse>

  /**
   * Get specific anchor by ID
   * @param anchorId Anchor identifier
   * @returns Anchor details
   */
  getAnchor(anchorId: string): Promise<Anchor>

  /**
   * Validate if position is valid for chapter
   * @param request Position validation details
   * @returns Validation result
   */
  validatePosition(request: ValidatePositionRequest): Promise<ValidatePositionResponse>

  /**
   * Delete anchor and associated image
   * @param anchorId Anchor to delete
   * @returns Success confirmation
   */
  deleteAnchor(anchorId: string): Promise<void>

  /**
   * Get optimal positions for auto-enhancement
   * @param chapterId Chapter to analyze
   * @param targetCount Desired number of positions
   * @returns Suggested positions for anchors
   */
  suggestPositions(chapterId: string, targetCount: number): Promise<number[]>

  /**
   * Reorder anchors after text edits
   * @param chapterId Chapter that was edited
   * @param edits List of text edits made
   * @returns Updated anchor positions
   */
  reorderAnchors(chapterId: string, edits: TextEdit[]): Promise<Anchor[]>
}

// Supporting Types
export interface TextEdit {
  position: number
  deletedLength: number
  insertedText: string
}

export interface AnchorPositionSuggestion {
  position: number
  confidence: number
  reason: 'paragraph_break' | 'scene_transition' | 'dialogue_end' | 'description_start'
}

// Error Types
export class AnchorError extends Error {
  constructor(
    public code: AnchorErrorCode,
    public userMessage: string,
    public details?: any
  ) {
    super(userMessage)
    this.name = 'AnchorError'
  }
}

export type AnchorErrorCode =
  | 'ANCHOR_NOT_FOUND'        // Referenced anchor doesn't exist
  | 'POSITION_OUT_OF_BOUNDS'  // Position beyond chapter text length
  | 'POSITION_INVALID'        // Position not suitable for anchor
  | 'CHAPTER_NOT_FOUND'       // Referenced chapter doesn't exist
  | 'ANCHOR_HAS_IMAGE'        // Cannot delete anchor with active image
  | 'DUPLICATE_POSITION'      // Anchor already exists at position

// Mock Implementation Specification
export interface MockAnchorService extends AnchorService {
  /**
   * Configure mock behavior for testing
   * @param config Mock service configuration
   */
  configure(config: MockAnchorConfig): void
}

export interface MockAnchorConfig {
  positionValidationDelay: number  // Simulated validation time
  suggestionAlgorithm: 'random' | 'paragraph' | 'fixed'
  maxAnchorsPerChapter: number
  defaultSuggestionCount: number
  positionTolerance: number        // Characters around position considered "same"
}