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
   * Create a new anchor after a specific paragraph in a chapter
   * @param chapterId - The chapter ID
   * @param afterParagraphIndex - The paragraph index after which the anchor is placed
   * @returns The created anchor
   */
  async createAnchor(chapterId: string, afterParagraphIndex: number): Promise<Anchor> {
    // Validate paragraph index before creating anchor
    const isValid = await this.validateParagraphIndex(chapterId, afterParagraphIndex);
    if (!isValid) {
      throw new Error(`Invalid paragraph index ${afterParagraphIndex} for chapter ${chapterId}`);
    }

    const anchor = await this.anchorRepository.create({
      chapter_id: chapterId,
      after_paragraph_index: afterParagraphIndex
    });

    return {
      id: anchor.id,
      chapter_id: anchor.chapter_id,
      after_paragraph_index: anchor.after_paragraph_index,
      active_enhancement_id: anchor.active_enhancement_id,
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
      after_paragraph_index: anchor.after_paragraph_index,
      active_enhancement_id: anchor.active_enhancement_id,
      created_at: anchor.created_at,
      updated_at: anchor.updated_at
    };
  }

  /**
   * Update the active enhancement for an anchor
   * @param anchorId - The anchor ID
   * @param enhancementId - The enhancement ID to set as active
   */
  async updateActiveEnhancement(anchorId: string, enhancementId: string): Promise<void> {
    await this.anchorRepository.update(anchorId, {
      active_enhancement_id: enhancementId
    });
  }

  /**
   * Validate that a paragraph index is valid within a chapter
   * @param chapterId - The chapter ID
   * @param afterParagraphIndex - The paragraph index to validate
   * @returns True if paragraph index is valid, false otherwise
   */
  async validateParagraphIndex(chapterId: string, afterParagraphIndex: number): Promise<boolean> {
    const chapter = await this.chapterRepository.get(chapterId);
    if (!chapter) {
      return false;
    }

    const content = chapter.text_content || '';
    const paragraphs = content.split('\n');
    return afterParagraphIndex >= 0 && afterParagraphIndex < paragraphs.length;
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
      after_paragraph_index: anchor.after_paragraph_index,
      active_enhancement_id: anchor.active_enhancement_id,
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

  /**
   * Delete all anchors for a chapter
   * @param chapterId - The chapter ID
   */
  async deleteByChapterId(chapterId: string): Promise<void> {
    await this.anchorRepository.deleteByChapterId(chapterId);
  }
}
