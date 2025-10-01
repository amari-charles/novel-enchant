import { describe, test, expect, beforeEach, vi } from 'vitest';
import type { Work, CreateWorkRequest, UpdateWorkRequest, WorksQueryParams } from '../../../../src/features/my-works/types';
import { WorkService } from '../../../../src/features/my-works/services/work-service';

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

describe('WorkService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listWorks', () => {
    test('should fetch works list with default parameters', async () => {
      const mockWorks: Work[] = [
        {
          id: 'work-1',
          user_id: 'user-1',
          title: 'Test Work',
          description: 'Test description',
          status: 'draft',
          created_at: '2025-09-26T10:00:00Z',
          updated_at: '2025-09-26T15:30:00Z',
          last_edited_at: '2025-09-26T15:30:00Z',
          auto_enhance_enabled: true,
          target_scenes_per_chapter: 4,
          chapter_count: 2,
          word_count: 1500,
          enhancement_count: 3,
          character_count: 2,
          cover_image_url: 'https://example.com/cover.jpg',
          publication_status: 'draft',
          read_count: 0,
        },
      ];

      const mockResponse = {
        works: mockWorks,
        total: 1,
        has_more: false,
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await WorkService.listWorks();

      expect(mockApiClient.get).toHaveBeenCalledWith('/works', {
        limit: 20,
        offset: 0,
      });
      expect(result).toEqual(mockResponse);
    });

    test('should fetch works list with custom parameters', async () => {
      const params: WorksQueryParams = {
        status: 'published',
        limit: 10,
        offset: 20,
        sort: 'title_asc',
      };

      const mockResponse = {
        works: [],
        total: 0,
        has_more: false,
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await WorkService.listWorks(params);

      expect(mockApiClient.get).toHaveBeenCalledWith('/works', params);
    });

    test('should handle API errors when fetching works', async () => {
      const mockError = new Error('Network error');
      mockApiClient.get.mockRejectedValue(mockError);

      await expect(WorkService.listWorks()).rejects.toThrow('Network error');
    });
  });

  describe('getWork', () => {
    test('should fetch single work with full details', async () => {
      const workId = 'work-1';
      const mockWork: Work = {
        id: workId,
        user_id: 'user-1',
        title: 'Test Work',
        description: 'Test description',
        status: 'draft',
        created_at: '2025-09-26T10:00:00Z',
        updated_at: '2025-09-26T15:30:00Z',
        last_edited_at: '2025-09-26T15:30:00Z',
        auto_enhance_enabled: true,
        target_scenes_per_chapter: 4,
        chapter_count: 2,
        word_count: 1500,
        enhancement_count: 3,
        character_count: 2,
        publication_status: 'draft',
        read_count: 0,
      };

      mockApiClient.get.mockResolvedValue(mockWork);

      const result = await WorkService.getWork(workId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/works/${workId}`);
      expect(result).toEqual(mockWork);
    });

    test('should handle work not found error', async () => {
      const workId = 'nonexistent-work';
      const mockError = { error: 'not_found', message: 'Work not found' };
      mockApiClient.get.mockRejectedValue(mockError);

      await expect(WorkService.getWork(workId)).rejects.toEqual(mockError);
    });
  });

  describe('createWork', () => {
    test('should create new work with required fields', async () => {
      const createRequest: CreateWorkRequest = {
        title: 'New Fantasy Novel',
        description: 'Epic adventure story',
        auto_enhance_enabled: true,
        target_scenes_per_chapter: 5,
      };

      const mockCreatedWork: Work = {
        id: 'new-work-id',
        user_id: 'user-1',
        title: createRequest.title,
        description: createRequest.description,
        status: 'draft',
        created_at: '2025-09-26T16:00:00Z',
        updated_at: '2025-09-26T16:00:00Z',
        last_edited_at: '2025-09-26T16:00:00Z',
        auto_enhance_enabled: true,
        target_scenes_per_chapter: 5,
        chapter_count: 0,
        word_count: 0,
        enhancement_count: 0,
        character_count: 0,
        publication_status: 'draft',
        read_count: 0,
      };

      mockApiClient.post.mockResolvedValue(mockCreatedWork);

      const result = await WorkService.createWork(createRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith('/works', createRequest);
      expect(result).toEqual(mockCreatedWork);
      expect(result.id).toBeDefined();
      expect(result.status).toBe('draft');
    });

    test('should create work with minimal required data', async () => {
      const createRequest: CreateWorkRequest = {
        title: 'Minimal Work',
      };

      const mockCreatedWork: Work = {
        id: 'minimal-work-id',
        user_id: 'user-1',
        title: 'Minimal Work',
        status: 'draft',
        created_at: '2025-09-26T16:00:00Z',
        updated_at: '2025-09-26T16:00:00Z',
        last_edited_at: '2025-09-26T16:00:00Z',
        auto_enhance_enabled: true,
        target_scenes_per_chapter: 4,
        chapter_count: 0,
        word_count: 0,
        enhancement_count: 0,
        character_count: 0,
        publication_status: 'draft',
        read_count: 0,
      };

      mockApiClient.post.mockResolvedValue(mockCreatedWork);

      const result = await WorkService.createWork(createRequest);

      expect(result.auto_enhance_enabled).toBe(true);
      expect(result.target_scenes_per_chapter).toBe(4);
    });

    test('should handle validation errors during work creation', async () => {
      const createRequest: CreateWorkRequest = {
        title: '', // Empty title should cause validation error
      };

      const mockError = {
        error: 'validation_error',
        message: 'Invalid input data',
        details: {
          title: 'Title must be between 1 and 255 characters',
        },
      };

      mockApiClient.post.mockRejectedValue(mockError);

      await expect(WorkService.createWork(createRequest)).rejects.toEqual(mockError);
    });
  });

  describe('updateWork', () => {
    test('should update work with partial data', async () => {
      const workId = 'work-1';
      const updateRequest: UpdateWorkRequest = {
        title: 'Updated Title',
        auto_enhance_enabled: false,
      };

      const mockUpdatedWork: Work = {
        id: workId,
        user_id: 'user-1',
        title: 'Updated Title',
        description: 'Original description',
        status: 'draft',
        created_at: '2025-09-26T10:00:00Z',
        updated_at: '2025-09-26T16:30:00Z',
        last_edited_at: '2025-09-26T16:30:00Z',
        auto_enhance_enabled: false,
        target_scenes_per_chapter: 4,
        chapter_count: 2,
        word_count: 1500,
        enhancement_count: 3,
        character_count: 2,
        publication_status: 'draft',
        read_count: 0,
      };

      mockApiClient.put.mockResolvedValue(mockUpdatedWork);

      const result = await WorkService.updateWork(workId, updateRequest);

      expect(mockApiClient.put).toHaveBeenCalledWith(`/works/${workId}`, updateRequest);
      expect(result.title).toBe('Updated Title');
      expect(result.auto_enhance_enabled).toBe(false);
      expect(result.updated_at).toBe('2025-09-26T16:30:00Z');
    });

    test('should handle authorization errors during update', async () => {
      const workId = 'other-users-work';
      const updateRequest: UpdateWorkRequest = {
        title: 'Unauthorized Update',
      };

      const mockError = {
        error: 'forbidden',
        message: 'Access denied to this resource',
      };

      mockApiClient.put.mockRejectedValue(mockError);

      await expect(WorkService.updateWork(workId, updateRequest)).rejects.toEqual(mockError);
    });
  });

  describe('deleteWork', () => {
    test('should delete work successfully', async () => {
      const workId = 'work-to-delete';

      mockApiClient.delete.mockResolvedValue(undefined);

      await WorkService.deleteWork(workId);

      expect(mockApiClient.delete).toHaveBeenCalledWith(`/works/${workId}`);
    });

    test('should handle work not found during deletion', async () => {
      const workId = 'nonexistent-work';

      const mockError = {
        error: 'not_found',
        message: 'Work not found',
      };

      mockApiClient.delete.mockRejectedValue(mockError);

      await expect(WorkService.deleteWork(workId)).rejects.toEqual(mockError);
    });

    test('should handle deletion of published work', async () => {
      const workId = 'published-work';

      const mockError = {
        error: 'conflict',
        message: 'Cannot delete published work',
        details: {
          publication_status: 'published',
          suggestion: 'Unpublish the work first',
        },
      };

      mockApiClient.delete.mockRejectedValue(mockError);

      await expect(WorkService.deleteWork(workId)).rejects.toEqual(mockError);
    });
  });

  describe('getWorkMetrics', () => {
    test('should fetch comprehensive work metrics', async () => {
      const workId = 'work-1';
      const mockMetrics = {
        work_id: workId,
        total_chapters: 5,
        total_words: 25000,
        total_enhancements: 12,
        total_characters: 3,
        average_chapter_length: 5000,
        enhancement_coverage: 0.85,
        last_activity: '2025-09-26T15:30:00Z',
        completion_status: {
          has_content: true,
          has_enhancements: true,
          has_characters: true,
          ready_for_publishing: true,
        },
      };

      mockApiClient.get.mockResolvedValue(mockMetrics);

      const result = await WorkService.getWorkMetrics(workId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/works/${workId}/metrics`);
      expect(result).toEqual(mockMetrics);
      expect(result.completion_status.ready_for_publishing).toBe(true);
    });
  });
});