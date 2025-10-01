import { describe, test, expect, beforeEach, vi } from 'vitest';
import type {
  Chapter,
  CreateChapterRequest,
  UpdateChapterRequest,
  AutoSaveRequest,
  AutoSaveResponse
} from '../../../../src/features/my-works/types';
import { ChapterService } from '../../../../src/features/my-works/services/chapter-service';

// Mock the API client
vi.mock('../../../../src/features/my-works/services/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockApiClient = vi.mocked(await import('../../../../src/features/my-works/services/api-client')).apiClient;

describe('ChapterService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listChapters', () => {
    test('should fetch chapters for a work in order', async () => {
      const workId = 'work-1';
      const mockChapters: Chapter[] = [
        {
          id: 'chapter-1',
          work_id: workId,
          title: 'The Beginning',
          content: 'It was a dark and stormy night...',
          order_index: 0,
          word_count: 500,
          enhancement_count: 2,
          created_at: '2025-09-26T10:00:00Z',
          updated_at: '2025-09-26T15:30:00Z',
          enhancement_anchors: [
            {
              id: 'anchor-1',
              position: 100,
              type: 'auto',
              enhancement_id: 'enhancement-1',
            },
          ],
        },
        {
          id: 'chapter-2',
          work_id: workId,
          title: 'The Journey Begins',
          content: 'The next morning brought new adventures...',
          order_index: 1,
          word_count: 750,
          enhancement_count: 1,
          created_at: '2025-09-26T11:00:00Z',
          updated_at: '2025-09-26T16:00:00Z',
          enhancement_anchors: [],
        },
      ];

      const mockResponse = {
        chapters: mockChapters,
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await ChapterService.listChapters(workId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/works/${workId}/chapters`);
      expect(result.chapters).toHaveLength(2);
      expect(result.chapters[0].order_index).toBe(0);
      expect(result.chapters[1].order_index).toBe(1);
    });

    test('should handle empty chapters list', async () => {
      const workId = 'empty-work';
      const mockResponse = { chapters: [] };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await ChapterService.listChapters(workId);

      expect(result.chapters).toHaveLength(0);
    });
  });

  describe('getChapter', () => {
    test('should fetch single chapter with full content', async () => {
      const chapterId = 'chapter-1';
      const mockChapter: Chapter = {
        id: chapterId,
        work_id: 'work-1',
        title: 'Test Chapter',
        content: 'Full chapter content with detailed narrative...',
        order_index: 0,
        word_count: 1200,
        enhancement_count: 3,
        created_at: '2025-09-26T10:00:00Z',
        updated_at: '2025-09-26T15:30:00Z',
        enhancement_anchors: [
          {
            id: 'anchor-1',
            position: 250,
            type: 'auto',
            enhancement_id: 'enhancement-1',
          },
          {
            id: 'anchor-2',
            position: 800,
            type: 'manual',
            enhancement_id: 'enhancement-2',
          },
        ],
      };

      mockApiClient.get.mockResolvedValue(mockChapter);

      const result = await ChapterService.getChapter(chapterId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/chapters/${chapterId}`);
      expect(result).toEqual(mockChapter);
      expect(result.enhancement_anchors).toHaveLength(2);
    });

    test('should handle chapter not found', async () => {
      const chapterId = 'nonexistent-chapter';
      const mockError = { error: 'not_found', message: 'Chapter not found' };

      mockApiClient.get.mockRejectedValue(mockError);

      await expect(ChapterService.getChapter(chapterId)).rejects.toEqual(mockError);
    });
  });

  describe('createChapter', () => {
    test('should create new chapter with content', async () => {
      const workId = 'work-1';
      const createRequest: CreateChapterRequest = {
        title: 'New Chapter',
        content: 'The adventure continues...',
        order_index: 2,
      };

      const mockCreatedChapter: Chapter = {
        id: 'new-chapter-id',
        work_id: workId,
        title: createRequest.title,
        content: createRequest.content,
        order_index: createRequest.order_index,
        word_count: 4, // "The adventure continues..."
        enhancement_count: 0,
        created_at: '2025-09-26T16:00:00Z',
        updated_at: '2025-09-26T16:00:00Z',
        enhancement_anchors: [],
      };

      mockApiClient.post.mockResolvedValue(mockCreatedChapter);

      const result = await ChapterService.createChapter(workId, createRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(`/works/${workId}/chapters`, createRequest);
      expect(result).toEqual(mockCreatedChapter);
      expect(result.word_count).toBe(4);
    });

    test('should create chapter without title', async () => {
      const workId = 'work-1';
      const createRequest: CreateChapterRequest = {
        content: 'Chapter content without title...',
        order_index: 0,
      };

      const mockCreatedChapter: Chapter = {
        id: 'untitled-chapter',
        work_id: workId,
        content: createRequest.content,
        order_index: 0,
        word_count: 5,
        enhancement_count: 0,
        created_at: '2025-09-26T16:00:00Z',
        updated_at: '2025-09-26T16:00:00Z',
        enhancement_anchors: [],
      };

      mockApiClient.post.mockResolvedValue(mockCreatedChapter);

      const result = await ChapterService.createChapter(workId, createRequest);

      expect(result.title).toBeUndefined();
    });

    test('should handle order index conflicts', async () => {
      const workId = 'work-1';
      const createRequest: CreateChapterRequest = {
        content: 'Conflicting chapter',
        order_index: 0, // Already exists
      };

      const mockError = {
        error: 'conflict',
        message: 'Chapter order index already exists',
        details: {
          existing_order_index: 0,
          suggested_order_index: 2,
        },
      };

      mockApiClient.post.mockRejectedValue(mockError);

      await expect(ChapterService.createChapter(workId, createRequest)).rejects.toEqual(mockError);
    });
  });

  describe('updateChapter', () => {
    test('should update chapter content and title', async () => {
      const chapterId = 'chapter-1';
      const updateRequest: UpdateChapterRequest = {
        title: 'Updated Chapter Title',
        content: 'Updated chapter content with more details...',
      };

      const mockUpdatedChapter: Chapter = {
        id: chapterId,
        work_id: 'work-1',
        title: updateRequest.title,
        content: updateRequest.content,
        order_index: 0,
        word_count: 8, // Updated word count
        enhancement_count: 2,
        created_at: '2025-09-26T10:00:00Z',
        updated_at: '2025-09-26T16:30:00Z',
        enhancement_anchors: [],
      };

      mockApiClient.put.mockResolvedValue(mockUpdatedChapter);

      const result = await ChapterService.updateChapter(chapterId, updateRequest);

      expect(mockApiClient.put).toHaveBeenCalledWith(`/chapters/${chapterId}`, updateRequest);
      expect(result.title).toBe('Updated Chapter Title');
      expect(result.word_count).toBe(8);
      expect(result.updated_at).toBe('2025-09-26T16:30:00Z');
    });

    test('should update enhancement anchors', async () => {
      const chapterId = 'chapter-1';
      const updateRequest: UpdateChapterRequest = {
        enhancement_anchors: [
          {
            id: 'anchor-1',
            position: 150,
            type: 'manual',
            enhancement_id: 'enhancement-new',
          },
        ],
      };

      const mockUpdatedChapter: Chapter = {
        id: chapterId,
        work_id: 'work-1',
        content: 'Original content',
        order_index: 0,
        word_count: 500,
        enhancement_count: 1,
        created_at: '2025-09-26T10:00:00Z',
        updated_at: '2025-09-26T16:30:00Z',
        enhancement_anchors: updateRequest.enhancement_anchors!,
      };

      mockApiClient.put.mockResolvedValue(mockUpdatedChapter);

      const result = await ChapterService.updateChapter(chapterId, updateRequest);

      expect(result.enhancement_anchors).toHaveLength(1);
      expect(result.enhancement_anchors[0].position).toBe(150);
    });
  });

  describe('deleteChapter', () => {
    test('should delete chapter and reorder remaining', async () => {
      const chapterId = 'chapter-to-delete';

      mockApiClient.delete.mockResolvedValue(undefined);

      await ChapterService.deleteChapter(chapterId);

      expect(mockApiClient.delete).toHaveBeenCalledWith(`/chapters/${chapterId}`);
    });

    test('should handle deletion of non-existent chapter', async () => {
      const chapterId = 'nonexistent-chapter';
      const mockError = { error: 'not_found', message: 'Chapter not found' };

      mockApiClient.delete.mockRejectedValue(mockError);

      await expect(ChapterService.deleteChapter(chapterId)).rejects.toEqual(mockError);
    });
  });

  describe('reorderChapters', () => {
    test('should reorder chapters within work', async () => {
      const workId = 'work-1';
      const reorderRequest = {
        work_id: workId,
        chapter_orders: [
          { chapter_id: 'chapter-2', order_index: 0 },
          { chapter_id: 'chapter-1', order_index: 1 },
          { chapter_id: 'chapter-3', order_index: 2 },
        ],
      };

      const mockReorderedChapters: Chapter[] = [
        {
          id: 'chapter-2',
          work_id: workId,
          content: 'Second chapter now first',
          order_index: 0,
          word_count: 500,
          enhancement_count: 1,
          created_at: '2025-09-26T11:00:00Z',
          updated_at: '2025-09-26T16:35:00Z',
          enhancement_anchors: [],
        },
        {
          id: 'chapter-1',
          work_id: workId,
          content: 'First chapter now second',
          order_index: 1,
          word_count: 600,
          enhancement_count: 2,
          created_at: '2025-09-26T10:00:00Z',
          updated_at: '2025-09-26T16:35:00Z',
          enhancement_anchors: [],
        },
      ];

      mockApiClient.post.mockResolvedValue(mockReorderedChapters);

      const result = await ChapterService.reorderChapters(reorderRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith('/chapters/reorder', reorderRequest);
      expect(result).toEqual(mockReorderedChapters);
      expect(result[0].order_index).toBe(0);
      expect(result[1].order_index).toBe(1);
    });

    test('should handle invalid reorder sequence', async () => {
      const reorderRequest = {
        work_id: 'work-1',
        chapter_orders: [
          { chapter_id: 'chapter-1', order_index: 0 },
          { chapter_id: 'chapter-2', order_index: 0 }, // Duplicate index
        ],
      };

      const mockError = {
        error: 'invalid_order_sequence',
        message: 'Order indices must be unique and sequential',
        details: {
          duplicate_indices: [0],
          expected_sequence: [0, 1],
        },
      };

      mockApiClient.post.mockRejectedValue(mockError);

      await expect(ChapterService.reorderChapters(reorderRequest)).rejects.toEqual(mockError);
    });
  });

  describe('autoSave', () => {
    test('should save chapter content without conflicts', async () => {
      const chapterId = 'chapter-1';
      const autoSaveRequest: AutoSaveRequest = {
        content: 'Auto-saved content...',
        cursor_position: 150,
        last_save_time: '2025-09-26T16:00:00Z',
      };

      const mockSaveResponse: AutoSaveResponse = {
        saved_at: '2025-09-26T16:05:00Z',
        word_count: 3,
        conflict: false,
      };

      mockApiClient.put.mockResolvedValue(mockSaveResponse);

      const result = await ChapterService.autoSave(chapterId, autoSaveRequest);

      expect(mockApiClient.put).toHaveBeenCalledWith(`/chapters/${chapterId}/autosave`, autoSaveRequest);
      expect(result).toEqual(mockSaveResponse);
      expect(result.conflict).toBe(false);
      expect(result.word_count).toBe(3);
    });

    test('should detect and return conflict information', async () => {
      const chapterId = 'chapter-1';
      const autoSaveRequest: AutoSaveRequest = {
        content: 'My changes...',
        cursor_position: 100,
        last_save_time: '2025-09-26T16:00:00Z',
      };

      const mockConflictResponse: AutoSaveResponse = {
        saved_at: '2025-09-26T16:05:00Z',
        word_count: 5,
        conflict: true,
        server_version: {
          content: 'Server changes that conflict...',
          updated_at: '2025-09-26T16:03:00Z',
        },
      };

      mockApiClient.put.mockResolvedValue(mockConflictResponse);

      const result = await ChapterService.autoSave(chapterId, autoSaveRequest);

      expect(result.conflict).toBe(true);
      expect(result.server_version).toBeDefined();
      expect(result.server_version!.content).toBe('Server changes that conflict...');
    });

    test('should handle rate limiting for auto-save', async () => {
      const chapterId = 'chapter-1';
      const autoSaveRequest: AutoSaveRequest = {
        content: 'Too frequent saves...',
        cursor_position: 50,
        last_save_time: '2025-09-26T16:04:50Z',
      };

      const mockError = {
        error: 'rate_limit_exceeded',
        message: 'Auto-save too frequent',
        retry_after: 30,
      };

      mockApiClient.put.mockRejectedValue(mockError);

      await expect(ChapterService.autoSave(chapterId, autoSaveRequest)).rejects.toEqual(mockError);
    });
  });

  describe('getChapterAnalytics', () => {
    test('should fetch chapter reading analytics', async () => {
      const chapterId = 'chapter-1';
      const mockAnalytics = {
        chapter_id: chapterId,
        total_views: 150,
        unique_viewers: 89,
        average_read_time: 420, // 7 minutes
        completion_rate: 0.78,
        bounce_rate: 0.15,
        popular_sections: [
          { start_position: 0, end_position: 500, view_time: 180 },
          { start_position: 1200, end_position: 1800, view_time: 240 },
        ],
        drop_off_points: [
          { position: 800, percentage: 12.5 },
          { position: 2000, percentage: 8.3 },
        ],
      };

      mockApiClient.get.mockResolvedValue(mockAnalytics);

      const result = await ChapterService.getChapterAnalytics(chapterId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/chapters/${chapterId}/analytics`);
      expect(result).toEqual(mockAnalytics);
      expect(result.completion_rate).toBe(0.78);
      expect(result.drop_off_points).toHaveLength(2);
    });
  });
});