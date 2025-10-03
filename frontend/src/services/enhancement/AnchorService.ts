/**
 * Anchor Service
 * Manages position markers where images are inserted in chapters
 * Business logic layer over AnchorRepository
 */

import type { IAnchorService, Anchor } from './IAnchorService';
import type { IAnchorRepository } from './repositories/IAnchorRepository';
import type { IChapterRepository } from './repositories/IChapterRepository';

export class AnchorService implements IAnchorService {
  constructor(
    private anchorRepository: IAnchorRepository,
    private chapterRepository: IChapterRepository
  ) {}

  /**
   * Create a new anchor at a specific position in a chapter
   * @param chapterId - The chapter ID
   * @param position - The position in the chapter text
   * @returns The created anchor
   */
  async createAnchor(chapterId: string, position: number): Promise<Anchor> {
    // Validate position before creating anchor
    const isValid = await this.validatePosition(chapterId, position);
    if (!isValid) {
      throw new Error(`Invalid position ${position} for chapter ${chapterId}`);
    }

    const anchor = await this.anchorRepository.create({
      chapter_id: chapterId,
      position
    });

    return {
      id: anchor.id,
      chapter_id: anchor.chapter_id,
      position: anchor.position,
      active_image_id: anchor.active_enhancement_id,
      created_at: anchor.created_at,
      updated_at: anchor.updated_at
    };
  }

  /**
   * Get an anchor by ID
   * @param anchorId - The anchor ID
   * @returns The anchor if found, null otherwise
   */
  async getAnchor(anchorId: string): Promise<Anchor | null> {
    const anchor = await this.anchorRepository.get(anchorId);
    if (!anchor) {
      return null;
    }

    return {
      id: anchor.id,
      chapter_id: anchor.chapter_id,
      position: anchor.position,
      active_image_id: anchor.active_enhancement_id,
      created_at: anchor.created_at,
      updated_at: anchor.updated_at
    };
  }

  /**
   * Update the active image for an anchor
   * @param anchorId - The anchor ID
   * @param imageId - The image ID to set as active
   */
  async updateActiveImage(anchorId: string, imageId: string): Promise<void> {
    await this.anchorRepository.update(anchorId, {
      active_enhancement_id: imageId
    });
  }

  /**
   * Validate that a position is valid within a chapter
   * @param chapterId - The chapter ID
   * @param position - The position to validate
   * @returns True if position is valid, false otherwise
   */
  async validatePosition(chapterId: string, position: number): Promise<boolean> {
    const chapter = await this.chapterRepository.get(chapterId);
    if (!chapter) {
      return false;
    }

    const content = chapter.text_content || '';
    return position >= 0 && position <= content.length;
  }

  /**
   * Get all anchors for a chapter
   * @param chapterId - The chapter ID
   * @returns Array of anchors in the chapter
   */
  async getAnchorsForChapter(chapterId: string): Promise<Anchor[]> {
    const anchors = await this.anchorRepository.getByChapterId(chapterId);
    return anchors.map(anchor => ({
      id: anchor.id,
      chapter_id: anchor.chapter_id,
      position: anchor.position,
      active_image_id: anchor.active_enhancement_id,
      created_at: anchor.created_at,
      updated_at: anchor.updated_at
    }));
  }

  /**
   * Delete an anchor
   * @param anchorId - The anchor ID
   */
  async deleteAnchor(anchorId: string): Promise<void> {
    await this.anchorRepository.delete(anchorId);
  }
}
