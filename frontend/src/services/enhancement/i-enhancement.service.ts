/**
 * Enhancement Service Interface
 * Defines the contract for all enhancement operations
 */

export interface IEnhancementService {
  /**
   * Enhance all scenes in a chapter automatically
   * @param chapterId - The ID of the chapter to enhance
   */
  enhanceChapter(chapterId: string): Promise<void>;

  /**
   * Re-enhance a chapter by deleting existing enhancements and regenerating
   * @param chapterId - The ID of the chapter to re-enhance
   */
  reEnhanceChapter(chapterId: string): Promise<void>;

  /**
   * Enhance all chapters in a book/story automatically
   * @param storyId - The ID of the story to enhance
   */
  enhanceBook(storyId: string): Promise<void>;

  /**
   * Insert an enhancement at a specific position in a chapter
   * This creates an anchor at the position and generates an image for it
   * @param chapterId - The ID of the chapter
   * @param position - The cursor position where enhancement should be inserted
   * @returns The created anchor ID
   */
  insertEnhancement(chapterId: string, position: number): Promise<string>;

  /**
   * Generate an enhancement from selected text
   * @param selection - The selected text to generate enhancement from
   * @param anchorId - The anchor ID where the enhancement will be placed
   */
  enhanceFromSelection(selection: string, anchorId: string): Promise<void>;
}
