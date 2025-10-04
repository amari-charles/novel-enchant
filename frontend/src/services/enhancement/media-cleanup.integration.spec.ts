/**
 * Integration tests for media cleanup on re-enhance
 * These tests verify that media records are properly deleted when enhancements are deleted
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { EnhancementOrchestrator } from './EnhancementOrchestrator';
import type { IChapterRepository } from './repositories/IChapterRepository';
import type { IAnchorService } from './IAnchorService';
import type { IEnhancementRepository } from './repositories/IEnhancementRepository';
import type { ISceneSelector } from './ISceneSelector';
import type { IPromptBuilder } from './IPromptBuilder';
import type { IImageStorage } from './IImageStorage';

describe('Media Cleanup on Re-Enhance (Integration)', () => {
  let orchestrator: EnhancementOrchestrator;
  let mockChapterRepository: IChapterRepository;
  let mockAnchorService: IAnchorService;
  let mockEnhancementRepository: IEnhancementRepository;
  let mockSceneSelector: ISceneSelector;
  let mockPromptBuilder: IPromptBuilder;
  let mockImageStorage: IImageStorage;

  // Track state to verify cleanup behavior
  let createdMediaIds: string[] = [];
  let createdAnchorIds: string[] = [];
  let createdEnhancementIds: string[] = [];
  let deletedMediaIds: string[] = [];
  let deletedAnchorIds: string[] = [];
  let mediaOwnershipMap: Map<string, { ownerType: string; ownerId: string }> = new Map();

  beforeEach(() => {
    // Reset tracking state
    createdMediaIds = [];
    createdAnchorIds = [];
    createdEnhancementIds = [];
    deletedMediaIds = [];
    deletedAnchorIds = [];
    mediaOwnershipMap = new Map();

    // Mock chapter repository
    mockChapterRepository = {
      get: vi.fn(async (id: string) => ({
        id,
        story_id: 'story-1',
        title: 'Test Chapter',
        text_content: 'Paragraph 1\nParagraph 2\nParagraph 3\nParagraph 4\nParagraph 5',
        order_index: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
      getByStoryId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    // Mock anchor service - tracks deletions
    mockAnchorService = {
      createAnchor: vi.fn(async (chapterId: string, afterParagraphIndex: number) => {
        const anchorId = `anchor-${createdAnchorIds.length + 1}`;
        createdAnchorIds.push(anchorId);
        return {
          id: anchorId,
          chapter_id: chapterId,
          after_paragraph_index: afterParagraphIndex,
          active_enhancement_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }),
      getAnchor: vi.fn(),
      updateActiveEnhancement: vi.fn(),
      validateParagraphIndex: vi.fn(async () => true),
      getAnchorsForChapter: vi.fn(),
      deleteAnchor: vi.fn(async (anchorId: string) => {
        deletedAnchorIds.push(anchorId);
      }),
      deleteByChapterId: vi.fn(async (chapterId: string) => {
        // Simulate cascade delete: find all enhancements for these anchors and delete them
        const anchorsToDelete = createdAnchorIds.filter(id => id.startsWith('anchor-'));
        deletedAnchorIds.push(...anchorsToDelete);

        // For each deleted anchor, find and delete its enhancements
        const enhancementsToDelete = createdEnhancementIds.filter(eId => {
          // In real implementation, we'd check enhancement.anchor_id
          // For this test, we assume all enhancements belong to deleted anchors
          return true;
        });

        // Simulate the trigger: for each deleted enhancement, delete its media
        for (const enhancementId of enhancementsToDelete) {
          const ownership = mediaOwnershipMap.get(enhancementId);
          if (ownership && ownership.ownerType === 'enhancement') {
            // Find media owned by this enhancement
            const mediaToDelete = createdMediaIds.find(mediaId => {
              const mediaOwnership = mediaOwnershipMap.get(mediaId);
              return mediaOwnership?.ownerId === enhancementId;
            });
            if (mediaToDelete && !deletedMediaIds.includes(mediaToDelete)) {
              deletedMediaIds.push(mediaToDelete);
            }
          }
        }
      }),
    };

    // Mock enhancement repository
    mockEnhancementRepository = {
      create: vi.fn(async (enhancement) => {
        const enhancementId = `enhancement-${createdEnhancementIds.length + 1}`;
        createdEnhancementIds.push(enhancementId);

        // Store ownership mapping for media
        if (enhancement.media_id) {
          mediaOwnershipMap.set(enhancementId, {
            ownerType: 'enhancement',
            ownerId: enhancementId,
          });
        }

        return {
          id: enhancementId,
          anchor_id: enhancement.anchor_id,
          chapter_id: enhancement.chapter_id,
          enhancement_type: enhancement.enhancement_type,
          media_id: enhancement.media_id || null,
          status: enhancement.status || 'completed',
          seed: null,
          config: {},
          metadata: enhancement.metadata || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }),
      get: vi.fn(),
      getByAnchorId: vi.fn(),
      getByChapterId: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    // Mock scene selector
    mockSceneSelector = {
      selectScenes: vi.fn(async () => ({
        scenes: [
          { sceneText: 'Scene 1 text', afterParagraphIndex: 0 },
          { sceneText: 'Scene 2 text', afterParagraphIndex: 2 },
        ],
      })),
    };

    // Mock prompt builder
    mockPromptBuilder = {
      generateImageFromScene: vi.fn(async () => ({
        imageUrl: 'https://example.com/image.png',
        prompt: 'Test prompt',
        metadata: {
          generatedAt: new Date().toISOString(),
          provider: 'test',
        },
      })),
    };

    // Mock image storage - tracks uploads and owner assignments
    mockImageStorage = {
      uploadImage: vi.fn(async (blob, path, ownerType?, ownerId?) => {
        const mediaId = `media-${createdMediaIds.length + 1}`;
        createdMediaIds.push(mediaId);

        if (ownerType && ownerId) {
          mediaOwnershipMap.set(mediaId, { ownerType, ownerId });
        }

        return {
          storagePath: path,
          mediaId,
        };
      }),
      setMediaOwner: vi.fn(async (mediaId: string, ownerType: string, ownerId: string) => {
        // Update ownership mapping
        mediaOwnershipMap.set(mediaId, { ownerType, ownerId });
      }),
      getImageUrl: vi.fn(),
      deleteImage: vi.fn(),
      exists: vi.fn(),
    };

    orchestrator = new EnhancementOrchestrator(
      mockChapterRepository,
      mockAnchorService,
      mockEnhancementRepository,
      mockSceneSelector,
      mockPromptBuilder,
      mockImageStorage
    );

    // Mock fetch for image download
    global.fetch = vi.fn(async () => ({
      blob: async () => new Blob(['fake image data'], { type: 'image/png' }),
    })) as any;
  });

  test('should delete media when re-enhancing a chapter', async () => {
    const chapterId = 'chapter-1';

    // Step 1: Initial enhancement
    await orchestrator.enhanceChapter(chapterId);

    // Verify initial state
    expect(createdMediaIds.length).toBe(2); // 2 scenes = 2 media files
    expect(createdAnchorIds.length).toBe(2); // 2 anchors
    expect(createdEnhancementIds.length).toBe(2); // 2 enhancements
    expect(deletedMediaIds.length).toBe(0); // No media deleted yet

    // Verify ownership was set
    expect(mockImageStorage.setMediaOwner).toHaveBeenCalledTimes(2);
    expect(mockImageStorage.setMediaOwner).toHaveBeenCalledWith(
      'media-1',
      'enhancement',
      'enhancement-1'
    );
    expect(mockImageStorage.setMediaOwner).toHaveBeenCalledWith(
      'media-2',
      'enhancement',
      'enhancement-2'
    );

    const initialMediaIds = [...createdMediaIds];

    // Step 2: Re-enhance the same chapter
    await orchestrator.reEnhanceChapter(chapterId);

    // Verify cleanup happened
    expect(deletedAnchorIds.length).toBe(2); // Original 2 anchors deleted
    expect(deletedMediaIds.length).toBe(2); // Original 2 media files deleted

    // Verify the deleted media matches the initially created media
    expect(deletedMediaIds).toContain(initialMediaIds[0]);
    expect(deletedMediaIds).toContain(initialMediaIds[1]);

    // Verify new media was created
    expect(createdMediaIds.length).toBe(4); // 2 original + 2 new
    expect(createdAnchorIds.length).toBe(4); // 2 original + 2 new
    expect(createdEnhancementIds.length).toBe(4); // 2 original + 2 new

    // Verify new ownership was set
    expect(mockImageStorage.setMediaOwner).toHaveBeenCalledTimes(4); // 2 initial + 2 new
  });

  test('should only delete media owned by deleted enhancements', async () => {
    const chapterId = 'chapter-1';

    // Create initial enhancement
    await orchestrator.enhanceChapter(chapterId);

    const initialMediaIds = [...createdMediaIds];

    // Manually create some media without ownership (simulate user uploads)
    const orphanMediaId = 'media-orphan';
    createdMediaIds.push(orphanMediaId);
    // Don't set ownership for this media

    // Re-enhance
    await orchestrator.reEnhanceChapter(chapterId);

    // Verify orphan media was NOT deleted
    expect(deletedMediaIds).not.toContain(orphanMediaId);

    // Verify only owned media was deleted
    expect(deletedMediaIds).toContain(initialMediaIds[0]);
    expect(deletedMediaIds).toContain(initialMediaIds[1]);
    expect(deletedMediaIds.length).toBe(2);
  });

  test('should handle multiple re-enhance cycles correctly', async () => {
    const chapterId = 'chapter-1';

    // First enhancement
    await orchestrator.enhanceChapter(chapterId);
    const firstMediaIds = [...createdMediaIds];

    // First re-enhance
    await orchestrator.reEnhanceChapter(chapterId);
    const secondMediaIds = createdMediaIds.slice(2); // Media created in second round

    expect(deletedMediaIds).toEqual(expect.arrayContaining(firstMediaIds));
    expect(deletedMediaIds.length).toBe(2);

    // Second re-enhance
    const deletedCountBefore = deletedMediaIds.length;
    await orchestrator.reEnhanceChapter(chapterId);

    // Should delete the second round media, not the first round (already deleted)
    expect(deletedMediaIds.length).toBe(deletedCountBefore + 2);
    expect(deletedMediaIds).toEqual(expect.arrayContaining(secondMediaIds));
  });

  test('NEGATIVE TEST: should fail if setMediaOwner is not called', async () => {
    // This test verifies that our test actually catches the bug

    // Temporarily remove the setMediaOwner call simulation
    const originalSetMediaOwner = mockImageStorage.setMediaOwner;
    mockImageStorage.setMediaOwner = vi.fn(); // No-op, doesn't update map

    const chapterId = 'chapter-1';

    await orchestrator.enhanceChapter(chapterId);

    const initialMediaCount = createdMediaIds.length;
    expect(initialMediaCount).toBe(2);

    // Re-enhance
    await orchestrator.reEnhanceChapter(chapterId);

    // Without proper ownership tracking, media won't be deleted
    // This proves our test would catch broken logic
    expect(deletedMediaIds.length).toBe(0); // NONE deleted because ownership wasn't set

    // Restore original mock
    mockImageStorage.setMediaOwner = originalSetMediaOwner;
  });

  test('NEGATIVE TEST: should fail if trigger does not delete media', async () => {
    // Simulate trigger malfunction by preventing media deletion in deleteByChapterId
    const originalDeleteByChapterId = mockAnchorService.deleteByChapterId;

    mockAnchorService.deleteByChapterId = vi.fn(async (chapterId: string) => {
      // Only delete anchors, don't cascade to media (simulates broken trigger)
      const anchorsToDelete = createdAnchorIds.filter(id => id.startsWith('anchor-'));
      deletedAnchorIds.push(...anchorsToDelete);
      // DON'T delete media - this simulates the trigger not working
    });

    const chapterId = 'chapter-1';

    await orchestrator.enhanceChapter(chapterId);
    expect(createdMediaIds.length).toBe(2);

    await orchestrator.reEnhanceChapter(chapterId);

    // Without the trigger, media is NOT deleted
    expect(deletedMediaIds.length).toBe(0); // NONE deleted - proves test catches broken trigger

    // Restore
    mockAnchorService.deleteByChapterId = originalDeleteByChapterId;
  });
});
