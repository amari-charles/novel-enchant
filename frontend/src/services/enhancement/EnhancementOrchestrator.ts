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
    console.log('[EnhancementOrchestrator] Starting enhanceChapter for:', chapterId);

    // 1. Fetch chapter
    const chapter = await this.chapterRepository.get(chapterId);
    if (!chapter) {
      throw new Error(`Chapter not found: ${chapterId}`);
    }
    console.log('[EnhancementOrchestrator] Chapter loaded:', { id: chapter.id, textLength: chapter.text_content?.length });

    if (!chapter.text_content) {
      throw new Error(`Chapter has no content: ${chapterId}`);
    }

    // 2. Select scenes from chapter text
    console.log('[EnhancementOrchestrator] Selecting scenes from text...');
    const { scenes } = await this.sceneSelector.selectScenes(chapter.text_content);
    console.log('[EnhancementOrchestrator] Found scenes:', scenes.length);

    if (scenes.length === 0) {
      throw new Error('No scenes found in chapter. The text may be too short or not contain identifiable scenes. Try adding more descriptive content.');
    }

    // 3. Process each scene
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      console.log(`[EnhancementOrchestrator] Processing scene ${i + 1}/${scenes.length}:`, {
        afterParagraphIndex: scene.afterParagraphIndex,
        textPreview: scene.sceneText.substring(0, 50)
      });
      await this.processScene(
        scene.sceneText,
        chapterId,
        scene.afterParagraphIndex,
        undefined
      );
      console.log(`[EnhancementOrchestrator] Scene ${i + 1}/${scenes.length} completed`);
    }

    console.log('[EnhancementOrchestrator] All scenes processed successfully');
  }

  /**
   * Re-enhance a chapter by deleting existing enhancements and regenerating
   * @param chapterId - The ID of the chapter to re-enhance
   */
  async reEnhanceChapter(chapterId: string): Promise<void> {
    console.log('[EnhancementOrchestrator] Starting reEnhanceChapter for:', chapterId);

    // 1. Delete all existing anchors for this chapter (cascade deletes enhancements)
    console.log('[EnhancementOrchestrator] Deleting existing anchors and enhancements...');
    const anchorRepository = this.anchorService['anchorRepository'] as any;
    await anchorRepository.deleteByChapterId(chapterId);
    console.log('[EnhancementOrchestrator] Existing enhancements cleared');

    // 2. Call enhance chapter to regenerate
    await this.enhanceChapter(chapterId);
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
   * Insert an enhancement after a specific paragraph in a chapter
   * This creates an anchor at the paragraph and generates an image for it
   * @param chapterId - The ID of the chapter
   * @param afterParagraphIndex - The paragraph index after which enhancement should be inserted
   * @returns The created anchor ID
   */
  async insertEnhancement(chapterId: string, afterParagraphIndex: number): Promise<string> {
    // 1. Fetch chapter
    const chapter = await this.chapterRepository.get(chapterId);
    if (!chapter) {
      throw new Error(`Chapter not found: ${chapterId}`);
    }

    if (!chapter.text_content) {
      throw new Error(`Chapter has no content: ${chapterId}`);
    }

    // 2. Extract surrounding context (the paragraph and adjacent ones)
    const paragraphs = chapter.text_content.split('\n');
    const contextStart = Math.max(0, afterParagraphIndex - 1);
    const contextEnd = Math.min(paragraphs.length, afterParagraphIndex + 2);
    const contextText = paragraphs.slice(contextStart, contextEnd).join('\n');

    // 3. Process scene at this paragraph (validates index via AnchorService)
    const anchorId = await this.processScene(
      contextText,
      chapterId,
      afterParagraphIndex,
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
    const anchor = await this.anchorService.getAnchor(anchorId);
    if (!anchor) {
      throw new Error(`Anchor not found: ${anchorId}`);
    }

    // 2. Fetch chapter to get style preferences and story ID
    const chapter = await this.chapterRepository.get(anchor.chapter_id);
    if (!chapter) {
      throw new Error(`Chapter not found: ${anchor.chapter_id}`);
    }

    // 3. Generate image from selection
    const generatedImage = await this.promptBuilder.generateImageFromScene(
      selection,
      undefined,
      chapter.story_id
    );

    // 4. Download image blob from URL
    const response = await fetch(generatedImage.imageUrl);
    const imageBlob = await response.blob();

    // 5. Upload to storage and create media record
    const storagePath = `enhancements/${anchor.chapter_id}/${anchorId}_${Date.now()}.png`;
    const { mediaId } = await this.imageStorage.uploadImage(imageBlob, storagePath);

    // 6. Create enhancement record
    const enhancement = await this.enhancementRepository.create({
      anchor_id: anchorId,
      chapter_id: anchor.chapter_id,
      enhancement_type: 'ai_image',
      media_id: mediaId,
      status: 'completed',
      metadata: {
        prompt: generatedImage.prompt,
        generatedAt: generatedImage.metadata?.generatedAt as string | undefined,
        provider: generatedImage.metadata?.provider as string | undefined
      } as any
    });

    // 7. Update anchor's active enhancement
    await this.anchorService.updateActiveEnhancement(anchorId, enhancement.id);
  }

  /**
   * Core scene processing pipeline
   * Creates anchor, generates image, uploads to storage, and creates enhancement record
   * @param sceneText - The scene text to generate an image for
   * @param chapterId - The chapter ID
   * @param afterParagraphIndex - The paragraph index after which this scene occurs
   * @param style - Optional style preferences
   * @returns The created anchor ID
   */
  private async processScene(
    sceneText: string,
    chapterId: string,
    afterParagraphIndex: number,
    style?: ImageStyle
  ): Promise<string> {
    // 1. Get story ID from chapter for character consistency
    const chapter = await this.chapterRepository.get(chapterId);
    if (!chapter) {
      throw new Error(`Chapter not found: ${chapterId}`);
    }

    // 2. Create anchor at paragraph index (validates index automatically)
    const anchor = await this.anchorService.createAnchor(chapterId, afterParagraphIndex);

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
          generatedAt: generatedImage.metadata?.generatedAt as string | undefined,
          provider: generatedImage.metadata?.provider as string | undefined
        } as any
      });

      // 7. Update anchor with active enhancement
      await this.anchorService.updateActiveEnhancement(anchor.id, enhancement.id);

      return anchor.id;
    } catch (error) {
      // Clean up orphaned anchor on failure to maintain clean state
      await this.anchorService.deleteAnchor(anchor.id);
      throw error;
    }
  }
}
