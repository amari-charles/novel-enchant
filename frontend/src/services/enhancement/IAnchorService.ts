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
  position: number;
  active_image_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface IAnchorService {
  /**
   * Create a new anchor at a specific position in a chapter
   * @param chapterId - The chapter ID
   * @param position - The position in the chapter text
   * @returns The created anchor
   */
  createAnchor(chapterId: string, position: number): Promise<Anchor>;

  /**
   * Get an anchor by ID
   * @param anchorId - The anchor ID
   * @returns The anchor if found, null otherwise
   */
  getAnchor(anchorId: string): Promise<Anchor | null>;

  /**
   * Update the active image for an anchor
   * @param anchorId - The anchor ID
   * @param imageId - The image ID to set as active
   */
  updateActiveImage(anchorId: string, imageId: string): Promise<void>;

  /**
   * Validate that a position is valid within a chapter
   * @param chapterId - The chapter ID
   * @param position - The position to validate
   * @returns True if position is valid, false otherwise
   */
  validatePosition(chapterId: string, position: number): Promise<boolean>;

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
