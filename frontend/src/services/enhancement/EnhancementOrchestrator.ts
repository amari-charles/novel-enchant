/**
 * Enhancement Orchestrator
 * Oversees the entire enhancement flow for chapters and books
 */

import type { IEnhancementService } from './IEnhancementService';
import type { IChapterRepository } from './repositories/IChapterRepository';
import type { IStoryRepository } from './repositories/IStoryRepository';
import type { IAnchorService } from './IAnchorService';
import type { IEnhancementRepository } from './repositories/IEnhancementRepository';
import type { ISceneSelector } from './ISceneSelector';
import type { IPromptBuilder, ImageStyle } from './IPromptBuilder';
import type { IImageStorage } from './IImageStorage';

export class EnhancementOrchestrator implements IEnhancementService {
  constructor(
    private chapterRepository: IChapterRepository,
    private storyRepository: IStoryRepository,
    private anchorService: IAnchorService,
    private enhancementRepository: IEnhancementRepository,
    private sceneSelector: ISceneSelector,
    private promptBuilder: IPromptBuilder,
    private imageStorage: IImageStorage
  ) {}

  /**
   * Enhance all scenes in a chapter automatically
   * @param chapterId - The ID of the chapter to enhance
   */
  async enhanceChapter(chapterId: string): Promise<void> {
    // 1. Fetch chapter
    const chapter = await this.chapterRepository.get(chapterId);
    if (!chapter) {
      throw new Error(`Chapter not found: ${chapterId}`);
    }

    if (!chapter.content) {
      throw new Error(`Chapter has no content: ${chapterId}`);
    }

    // 2. Select scenes from chapter text
    const { scenes } = await this.sceneSelector.selectScenes(chapter.content);

    // 3. Process each scene
    for (const scene of scenes) {
      await this.processScene(
        scene.sceneText,
        chapterId,
        scene.startPosition,
        chapter.style_preferences as ImageStyle | undefined
      );
    }
  }

  /**
   * Enhance all chapters in a book/story automatically
   * @param storyId - The ID of the story to enhance
   */
  async enhanceBook(storyId: string): Promise<void> {
    // 1. Fetch all chapters for the story
    const chapters = await this.chapterRepository.getByStoryId(storyId);

    if (chapters.length === 0) {
      throw new Error(`No chapters found for story: ${storyId}`);
    }

    // 2. Enhance each chapter
    for (const chapter of chapters) {
      await this.enhanceChapter(chapter.id);
    }
  }

  /**
   * Insert an enhancement at a specific position in a chapter
   * This creates an anchor at the position and generates an image for it
   * @param chapterId - The ID of the chapter
   * @param position - The cursor position where enhancement should be inserted
   * @returns The created anchor ID
   */
  async insertEnhancement(chapterId: string, position: number): Promise<string> {
    // 1. Fetch chapter
    const chapter = await this.chapterRepository.get(chapterId);
    if (!chapter) {
      throw new Error(`Chapter not found: ${chapterId}`);
    }

    if (!chapter.content) {
      throw new Error(`Chapter has no content: ${chapterId}`);
    }

    // 2. Extract surrounding context (500 chars before and after)
    const contextStart = Math.max(0, position - 500);
    const contextEnd = Math.min(chapter.content.length, position + 500);
    const contextText = chapter.content.slice(contextStart, contextEnd);

    // 3. Process scene at this position (validates position via AnchorService)
    const anchorId = await this.processScene(
      contextText,
      chapterId,
      position,
      chapter.style_preferences as ImageStyle | undefined
    );

    return anchorId;
  }

  /**
   * Generate an enhancement from selected text
   * @param selection - The selected text to generate enhancement from
   * @param anchorId - The anchor ID where the enhancement will be placed
   */
  async enhanceFromSelection(selection: string, anchorId: string): Promise<void> {
    // 1. Fetch anchor to validate it exists
    const anchor = await this.anchorRepository.get(anchorId);
    if (!anchor) {
      throw new Error(`Anchor not found: ${anchorId}`);
    }

    // 2. Fetch chapter to get style preferences
    const chapter = await this.chapterRepository.get(anchor.chapter_id);
    if (!chapter) {
      throw new Error(`Chapter not found: ${anchor.chapter_id}`);
    }

    // 3. Generate image from selection
    const generatedImage = await this.promptBuilder.generateImageFromScene(
      selection,
      undefined,
      chapter.style_preferences as ImageStyle | undefined
    );

    // 4. Download image blob from URL
    const response = await fetch(generatedImage.imageUrl);
    const imageBlob = await response.blob();

    // 5. Upload to storage
    const storagePath = `enhancements/${anchor.chapter_id}/${anchorId}_${Date.now()}.png`;
    const uploadedPath = await this.imageStorage.uploadImage(imageBlob, storagePath);

    // 6. Get public URL
    const publicUrl = await this.imageStorage.getImageUrl(uploadedPath);

    // 7. Create enhancement record
    const enhancement = await this.enhancementRepository.create({
      anchor_id: anchorId,
      chapter_id: anchor.chapter_id,
      prompt: generatedImage.prompt,
      image_url: publicUrl,
      storage_path: uploadedPath,
      status: 'completed'
    });

    // 8. Update anchor's active enhancement
    await this.anchorRepository.update(anchorId, {
      active_enhancement_id: enhancement.id
    });
  }

  /**
   * Core scene processing pipeline
   * Creates anchor, generates image, uploads to storage, and creates enhancement record
   * @param sceneText - The scene text to generate an image for
   * @param chapterId - The chapter ID
   * @param position - The position in the chapter where this scene occurs
   * @param style - Optional style preferences
   * @returns The created anchor ID
   */
  private async processScene(
    sceneText: string,
    chapterId: string,
    position: number,
    style?: ImageStyle
  ): Promise<string> {
    // 1. Get story ID from chapter for character consistency
    const chapter = await this.chapterRepository.get(chapterId);
    if (!chapter) {
      throw new Error(`Chapter not found: ${chapterId}`);
    }

    // 2. Create anchor at position (validates position automatically)
    const anchor = await this.anchorService.createAnchor(chapterId, position);

    try {
      // 3. Generate image from scene with character consistency
      const generatedImage = await this.promptBuilder.generateImageFromScene(
        sceneText,
        style,
        chapter.story_id // Pass story ID for character tracking
      );

      // 4. Download image blob from URL
      const response = await fetch(generatedImage.imageUrl);
      const imageBlob = await response.blob();

      // 5. Upload to storage and create media record
      const storagePath = `enhancements/${chapterId}/${anchor.id}_${Date.now()}.png`;
      const { mediaId } = await this.imageStorage.uploadImage(imageBlob, storagePath);

      // 6. Create enhancement record
      const enhancement = await this.enhancementRepository.create({
        anchor_id: anchor.id,
        chapter_id: chapterId,
        enhancement_type: 'ai_image',
        media_id: mediaId,
        status: 'completed',
        metadata: {
          prompt: generatedImage.prompt,
          generatedAt: generatedImage.metadata?.generatedAt,
          provider: generatedImage.metadata?.provider
        }
      });

      // 7. Update anchor with active enhancement
      await this.anchorService.updateActiveImage(anchor.id, enhancement.id);

      return anchor.id;
    } catch (error) {
      // Clean up orphaned anchor on failure to maintain clean state
      await this.anchorService.deleteAnchor(anchor.id);
      throw error;
    }
  }
}
