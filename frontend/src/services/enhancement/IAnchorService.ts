/**
 * Anchor Service Interface
 * Manages position markers where images are inserted in chapters
 */

/**
 * Anchor entity - marks a stable position in a chapter for image insertion
 */
export interface Anchor {
  id: string;
  chapter_id: string;
  after_paragraph_index: number;
  active_enhancement_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface IAnchorService {
  /**
   * Create a new anchor after a specific paragraph in a chapter
   * @param chapterId - The chapter ID
   * @param afterParagraphIndex - The paragraph index after which the anchor is placed
   * @returns The created anchor
   */
  createAnchor(chapterId: string, afterParagraphIndex: number): Promise<Anchor>;

  /**
   * Get an anchor by ID
   * @param anchorId - The anchor ID
   * @returns The anchor if found, null otherwise
   */
  getAnchor(anchorId: string): Promise<Anchor | null>;

  /**
   * Update the active enhancement for an anchor
   * @param anchorId - The anchor ID
   * @param enhancementId - The enhancement ID to set as active
   */
  updateActiveEnhancement(anchorId: string, enhancementId: string): Promise<void>;

  /**
   * Validate that a paragraph index is valid within a chapter
   * @param chapterId - The chapter ID
   * @param afterParagraphIndex - The paragraph index to validate
   * @returns True if paragraph index is valid, false otherwise
   */
  validateParagraphIndex(chapterId: string, afterParagraphIndex: number): Promise<boolean>;

  /**
   * Get all anchors for a chapter
   * @param chapterId - The chapter ID
   * @returns Array of anchors in the chapter
   */
  getAnchorsForChapter(chapterId: string): Promise<Anchor[]>;

  /**
   * Delete an anchor
   * @param anchorId - The anchor ID
   */
  deleteAnchor(anchorId: string): Promise<void>;
}
