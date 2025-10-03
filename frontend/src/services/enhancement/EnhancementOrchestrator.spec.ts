/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { EnhancementOrchestrator } from './EnhancementOrchestrator';
import type { IChapterRepository } from './repositories/IChapterRepository';
import type { IStoryRepository } from './repositories/IStoryRepository';
import type { IAnchorService } from './IAnchorService';
import type { IEnhancementRepository } from './repositories/IEnhancementRepository';
import type { ISceneSelector } from './ISceneSelector';
import type { IPromptBuilder } from './IPromptBuilder';
import type { IImageStorage } from './IImageStorage';

describe('EnhancementOrchestrator', () => {
  let orchestrator: EnhancementOrchestrator;
  let mockChapterRepository: IChapterRepository;
  let mockStoryRepository: IStoryRepository;
  let mockAnchorService: IAnchorService;
  let mockEnhancementRepository: IEnhancementRepository;
  let mockSceneSelector: ISceneSelector;
  let mockPromptBuilder: IPromptBuilder;
  let mockImageStorage: IImageStorage;

  beforeEach(() => {
    // Create mock implementations
    mockChapterRepository = {
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getByStoryId: vi.fn(),
    } as any;

    mockStoryRepository = {
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getByUserId: vi.fn(),
    } as any;

    mockAnchorService = {
      createAnchor: vi.fn(),
      getAnchor: vi.fn(),
      updateActiveEnhancement: vi.fn(),
      deleteAnchor: vi.fn(),
      anchorRepository: {
        deleteByChapterId: vi.fn(),
      },
    } as any;

    mockEnhancementRepository = {
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getByAnchorId: vi.fn(),
      getByChapterId: vi.fn(),
      getByStatus: vi.fn(),
    } as any;

    mockSceneSelector = {
      selectScenes: vi.fn(),
    } as any;

    mockPromptBuilder = {
      generateImageFromScene: vi.fn(),
    } as any;

    mockImageStorage = {
      uploadImage: vi.fn(),
    } as any;

    orchestrator = new EnhancementOrchestrator(
      mockChapterRepository,
      mockStoryRepository,
      mockAnchorService,
      mockEnhancementRepository,
      mockSceneSelector,
      mockPromptBuilder,
      mockImageStorage
    );
  });

  describe('reEnhanceChapter', () => {
    test('should delete existing anchors and re-enhance chapter', async () => {
      const chapterId = 'chapter-123';
      const mockChapter = {
        id: chapterId,
        story_id: 'story-1',
        title: 'Test Chapter',
        text_content: 'It was a dark and stormy night. The hero embarked on a journey.',
        order_index: 0,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const mockScenes = [
        {
          sceneText: 'It was a dark and stormy night.',
          afterParagraphIndex: 0,
        },
        {
          sceneText: 'The hero embarked on a journey.',
          afterParagraphIndex: 1,
        },
      ];

      const mockAnchor = {
        id: 'anchor-1',
        chapter_id: chapterId,
        after_paragraph_index: 0,
        created_at: '2025-01-01T00:00:00Z',
      };

      const mockGeneratedImage = {
        imageUrl: 'https://example.com/image.png',
        prompt: 'Dark and stormy night scene',
        metadata: {
          generatedAt: '2025-01-01T00:00:00Z',
          provider: 'mock-provider',
        },
      };

      const mockMediaId = 'media-123';
      const mockEnhancement = {
        id: 'enhancement-1',
        anchor_id: mockAnchor.id,
        chapter_id: chapterId,
        enhancement_type: 'ai_image' as const,
        media_id: mockMediaId,
        status: 'completed' as const,
        created_at: '2025-01-01T00:00:00Z',
      };

      // Setup mocks
      vi.mocked(mockChapterRepository.get).mockResolvedValue(mockChapter);
      vi.mocked(mockSceneSelector.selectScenes).mockResolvedValue({ scenes: mockScenes });
      vi.mocked(mockAnchorService.createAnchor).mockResolvedValue(mockAnchor);
      vi.mocked(mockPromptBuilder.generateImageFromScene).mockResolvedValue(mockGeneratedImage);
      vi.mocked(mockImageStorage.uploadImage).mockResolvedValue({ mediaId: mockMediaId });
      vi.mocked(mockEnhancementRepository.create).mockResolvedValue(mockEnhancement);
      vi.mocked(mockAnchorService.updateActiveEnhancement).mockResolvedValue(undefined);

      // Mock fetch for downloading generated image
      global.fetch = vi.fn().mockResolvedValue({
        blob: () => Promise.resolve(new Blob(['mock-image-data'])),
      });

      // Execute
      await orchestrator.reEnhanceChapter(chapterId);

      // Verify deletion was called first
      expect(mockAnchorService['anchorRepository'].deleteByChapterId).toHaveBeenCalledWith(chapterId);

      // Verify chapter was re-enhanced
      expect(mockChapterRepository.get).toHaveBeenCalledWith(chapterId);
      expect(mockSceneSelector.selectScenes).toHaveBeenCalledWith(mockChapter.text_content);

      // Verify scenes were processed (2 scenes = 2 anchors, 2 images, 2 enhancements)
      expect(mockAnchorService.createAnchor).toHaveBeenCalledTimes(2);
      expect(mockPromptBuilder.generateImageFromScene).toHaveBeenCalledTimes(2);
      expect(mockEnhancementRepository.create).toHaveBeenCalledTimes(2);
    });

    test('should handle chapter not found error', async () => {
      const chapterId = 'nonexistent-chapter';

      vi.mocked(mockChapterRepository.get).mockResolvedValue(null);

      await expect(orchestrator.reEnhanceChapter(chapterId)).rejects.toThrow(
        'Chapter not found: nonexistent-chapter'
      );

      // Verify deletion was still attempted
      expect(mockAnchorService['anchorRepository'].deleteByChapterId).toHaveBeenCalledWith(chapterId);
    });

    test('should handle chapter with no content', async () => {
      const chapterId = 'chapter-no-content';
      const mockChapter = {
        id: chapterId,
        story_id: 'story-1',
        title: 'Empty Chapter',
        text_content: null,
        order_index: 0,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      vi.mocked(mockChapterRepository.get).mockResolvedValue(mockChapter);

      await expect(orchestrator.reEnhanceChapter(chapterId)).rejects.toThrow(
        'Chapter has no content: chapter-no-content'
      );

      expect(mockAnchorService['anchorRepository'].deleteByChapterId).toHaveBeenCalledWith(chapterId);
    });

    test('should handle no scenes found in chapter', async () => {
      const chapterId = 'chapter-no-scenes';
      const mockChapter = {
        id: chapterId,
        story_id: 'story-1',
        title: 'Short Chapter',
        text_content: 'Too short.',
        order_index: 0,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      vi.mocked(mockChapterRepository.get).mockResolvedValue(mockChapter);
      vi.mocked(mockSceneSelector.selectScenes).mockResolvedValue({ scenes: [] });

      await expect(orchestrator.reEnhanceChapter(chapterId)).rejects.toThrow(
        'No scenes found in chapter'
      );

      expect(mockAnchorService['anchorRepository'].deleteByChapterId).toHaveBeenCalledWith(chapterId);
      expect(mockSceneSelector.selectScenes).toHaveBeenCalledWith(mockChapter.text_content);
    });

    test('should cleanup anchor if enhancement fails', async () => {
      const chapterId = 'chapter-fail';
      const mockChapter = {
        id: chapterId,
        story_id: 'story-1',
        title: 'Test Chapter',
        text_content: 'It was a dark and stormy night.',
        order_index: 0,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const mockScenes = [
        {
          sceneText: 'It was a dark and stormy night.',
          afterParagraphIndex: 0,
        },
      ];

      const mockAnchor = {
        id: 'anchor-1',
        chapter_id: chapterId,
        after_paragraph_index: 0,
        created_at: '2025-01-01T00:00:00Z',
      };

      vi.mocked(mockChapterRepository.get).mockResolvedValue(mockChapter);
      vi.mocked(mockSceneSelector.selectScenes).mockResolvedValue({ scenes: mockScenes });
      vi.mocked(mockAnchorService.createAnchor).mockResolvedValue(mockAnchor);
      vi.mocked(mockPromptBuilder.generateImageFromScene).mockRejectedValue(
        new Error('Image generation failed')
      );

      await expect(orchestrator.reEnhanceChapter(chapterId)).rejects.toThrow(
        'Image generation failed'
      );

      // Verify orphaned anchor was cleaned up
      expect(mockAnchorService.deleteAnchor).toHaveBeenCalledWith(mockAnchor.id);
    });

    test('should call deleteByChapterId before enhanceChapter', async () => {
      const chapterId = 'chapter-order-test';
      const callOrder: string[] = [];

      // Track call order
      vi.mocked(mockAnchorService['anchorRepository'].deleteByChapterId).mockImplementation(
        async () => {
          callOrder.push('deleteByChapterId');
        }
      );

      vi.mocked(mockChapterRepository.get).mockImplementation(async () => {
        callOrder.push('get');
        return {
          id: chapterId,
          story_id: 'story-1',
          title: 'Test',
          text_content: 'Content here.',
          order_index: 0,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        };
      });

      vi.mocked(mockSceneSelector.selectScenes).mockResolvedValue({ scenes: [] });

      try {
        await orchestrator.reEnhanceChapter(chapterId);
      } catch {
        // Expected to fail due to no scenes
      }

      // Verify deletion happened before enhancement
      expect(callOrder[0]).toBe('deleteByChapterId');
      expect(callOrder[1]).toBe('get');
    });
  });
});
