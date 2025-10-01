import { describe, test, expect, beforeEach, vi } from 'vitest';
import type {
  Enhancement,
  AutoEnhanceRequest,
  AutoEnhanceResponse,
  ManualEnhanceRequest,
  EnhancementStatusResponse,
} from '../../../../src/features/my-works/types';
import { EnhancementService } from '../../../../src/features/my-works/services/enhancement-service';

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

describe('EnhancementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('autoEnhance', () => {
    test('should start auto-enhancement job with scene detection', async () => {
      const autoEnhanceRequest: AutoEnhanceRequest = {
        chapter_id: 'chapter-1',
        content: 'It was a dark and stormy night when Aria discovered her magical powers. The emerald pendant around her neck began to glow...',
        target_scenes: 4,
        character_context: [
          {
            name: 'Aria',
            description: 'Young sorceress with auburn hair and green eyes',
          },
        ],
      };

      const mockResponse: AutoEnhanceResponse = {
        job_id: 'enhancement-job-1',
        status: 'queued',
        estimated_completion: '2025-09-26T16:05:00Z',
        anchor_positions: [
          {
            id: 'anchor_1',
            position: 50,
            prompt_preview: 'Dark stormy night scene with mysterious atmosphere...',
          },
          {
            id: 'anchor_2',
            position: 120,
            prompt_preview: 'Young sorceress with glowing emerald pendant...',
          },
        ],
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await EnhancementService.autoEnhance(autoEnhanceRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith('/enhancement/auto-enhance', autoEnhanceRequest);
      expect(result).toEqual(mockResponse);
      expect(result.anchor_positions).toHaveLength(2);
      expect(result.status).toBe('queued');
    });

    test('should handle content too short for auto-enhancement', async () => {
      const autoEnhanceRequest: AutoEnhanceRequest = {
        chapter_id: 'chapter-1',
        content: 'Too short.',
        target_scenes: 4,
      };

      const mockError = {
        error: 'content_too_short',
        message: 'Content must be at least 100 characters for enhancement',
        details: {
          current_length: 11,
          minimum_length: 100,
        },
      };

      mockApiClient.post.mockRejectedValue(mockError);

      await expect(EnhancementService.autoEnhance(autoEnhanceRequest)).rejects.toEqual(mockError);
    });

    test('should handle rate limit for auto-enhancement', async () => {
      const autoEnhanceRequest: AutoEnhanceRequest = {
        chapter_id: 'chapter-1',
        content: 'Valid content for enhancement that exceeds minimum length requirements and should trigger scene detection...',
        target_scenes: 5,
      };

      const mockError = {
        error: 'enhancement_rate_limit',
        message: 'Enhancement generation rate limit exceeded',
        details: {
          limit: 10,
          window: '1 hour',
          reset_at: '2025-09-26T17:00:00Z',
        },
      };

      mockApiClient.post.mockRejectedValue(mockError);

      await expect(EnhancementService.autoEnhance(autoEnhanceRequest)).rejects.toEqual(mockError);
    });
  });

  describe('manualEnhance', () => {
    test('should create manual enhancement at specific position', async () => {
      const manualRequest: ManualEnhanceRequest = {
        chapter_id: 'chapter-1',
        position: 250,
        prompt: 'Ancient dragon soaring over mystical ruins at sunset',
        context_before: 'The ground trembled as shadows darkened the sky',
        context_after: 'Its wings disappeared into the golden clouds above',
        linked_characters: ['character-1'],
      };

      const mockResponse = {
        enhancement_id: 'enhancement-manual-1',
        anchor_id: 'anchor_manual_1',
        status: 'queued',
        estimated_completion: '2025-09-26T16:05:00Z',
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await EnhancementService.manualEnhance(manualRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith('/enhancement/manual-insert', manualRequest);
      expect(result).toEqual(mockResponse);
      expect(result.enhancement_id).toBeDefined();
    });

    test('should handle invalid position for manual enhancement', async () => {
      const manualRequest: ManualEnhanceRequest = {
        chapter_id: 'chapter-1',
        position: 5000, // Beyond content length
        prompt: 'Invalid position enhancement',
      };

      const mockError = {
        error: 'invalid_position',
        message: 'Position is outside chapter content range',
        details: {
          position: 5000,
          content_length: 4500,
        },
      };

      mockApiClient.post.mockRejectedValue(mockError);

      await expect(EnhancementService.manualEnhance(manualRequest)).rejects.toEqual(mockError);
    });
  });

  describe('getEnhancementStatus', () => {
    test('should fetch completed enhancement job status', async () => {
      const jobId = 'enhancement-job-1';
      const mockStatus: EnhancementStatusResponse = {
        job_id: jobId,
        status: 'completed',
        progress: 100,
        completed_at: '2025-09-26T16:04:30Z',
        enhancements: [
          {
            enhancement_id: 'enhancement-1',
            anchor_id: 'anchor_1',
            status: 'completed',
            image_url: 'https://example.com/generated-image-1.jpg',
            thumbnail_url: 'https://example.com/thumb-1.jpg',
          },
          {
            enhancement_id: 'enhancement-2',
            anchor_id: 'anchor_2',
            status: 'completed',
            image_url: 'https://example.com/generated-image-2.jpg',
            thumbnail_url: 'https://example.com/thumb-2.jpg',
          },
        ],
        failed_enhancements: [],
        total_generated: 2,
      };

      mockApiClient.get.mockResolvedValue(mockStatus);

      const result = await EnhancementService.getEnhancementStatus(jobId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/enhancement/status/${jobId}`);
      expect(result).toEqual(mockStatus);
      expect(result.status).toBe('completed');
      expect(result.enhancements).toHaveLength(2);
      expect(result.failed_enhancements).toHaveLength(0);
    });

    test('should fetch partial completion with failures', async () => {
      const jobId = 'enhancement-job-partial';
      const mockStatus: EnhancementStatusResponse = {
        job_id: jobId,
        status: 'partial',
        progress: 75,
        completed_at: '2025-09-26T16:04:30Z',
        enhancements: [
          {
            enhancement_id: 'enhancement-1',
            anchor_id: 'anchor_1',
            status: 'completed',
            image_url: 'https://example.com/generated-image-1.jpg',
            thumbnail_url: 'https://example.com/thumb-1.jpg',
          },
        ],
        failed_enhancements: [
          {
            anchor_id: 'anchor_2',
            error: 'Content filter violation: prompt contains prohibited terms',
          },
        ],
        total_generated: 1,
      };

      mockApiClient.get.mockResolvedValue(mockStatus);

      const result = await EnhancementService.getEnhancementStatus(jobId);

      expect(result.status).toBe('partial');
      expect(result.failed_enhancements).toHaveLength(1);
      expect(result.total_generated).toBe(1);
    });

    test('should fetch processing status with progress', async () => {
      const jobId = 'enhancement-job-processing';
      const mockStatus: EnhancementStatusResponse = {
        job_id: jobId,
        status: 'processing',
        progress: 50,
        enhancements: [],
        failed_enhancements: [],
        total_generated: 0,
      };

      mockApiClient.get.mockResolvedValue(mockStatus);

      const result = await EnhancementService.getEnhancementStatus(jobId);

      expect(result.status).toBe('processing');
      expect(result.progress).toBe(50);
    });
  });

  describe('getEnhancement', () => {
    test('should fetch enhancement with version history', async () => {
      const enhancementId = 'enhancement-1';
      const mockEnhancement: Enhancement = {
        id: enhancementId,
        chapter_id: 'chapter-1',
        anchor_id: 'anchor_1',
        position_start: 100,
        position_end: 150,
        prompt_text: 'Mystical forest scene with ethereal lighting',
        prompt_type: 'auto',
        generation_status: 'completed',
        created_at: '2025-09-26T16:00:00Z',
        updated_at: '2025-09-26T16:04:00Z',
        active_version: {
          id: 'version-2',
          enhancement_id: enhancementId,
          version_number: 2,
          image_url: 'https://example.com/image-v2.jpg',
          thumbnail_url: 'https://example.com/thumb-v2.jpg',
          generation_params: {
            model: 'sdxl-1.0',
            steps: 30,
            guidance: 7.5,
          },
          quality_score: 0.85,
          is_active: true,
          created_at: '2025-09-26T16:03:00Z',
        },
        versions: [
          {
            id: 'version-1',
            enhancement_id: enhancementId,
            version_number: 1,
            image_url: 'https://example.com/image-v1.jpg',
            thumbnail_url: 'https://example.com/thumb-v1.jpg',
            generation_params: {
              model: 'sdxl-1.0',
              steps: 25,
              guidance: 7.0,
            },
            quality_score: 0.72,
            is_active: false,
            created_at: '2025-09-26T16:01:00Z',
          },
          {
            id: 'version-2',
            enhancement_id: enhancementId,
            version_number: 2,
            image_url: 'https://example.com/image-v2.jpg',
            thumbnail_url: 'https://example.com/thumb-v2.jpg',
            generation_params: {
              model: 'sdxl-1.0',
              steps: 30,
              guidance: 7.5,
            },
            quality_score: 0.85,
            is_active: true,
            created_at: '2025-09-26T16:03:00Z',
          },
        ],
        linked_characters: [
          {
            id: 'character-1',
            work_id: 'work-1',
            name: 'Aria',
            description: 'Young sorceress with magical abilities',
            appearance_count: 5,
            linked_images_count: 3,
            created_at: '2025-09-26T10:00:00Z',
            updated_at: '2025-09-26T15:00:00Z',
          },
        ],
      };

      mockApiClient.get.mockResolvedValue(mockEnhancement);

      const result = await EnhancementService.getEnhancement(enhancementId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/enhancement/${enhancementId}`);
      expect(result).toEqual(mockEnhancement);
      expect(result.versions).toHaveLength(2);
      expect(result.active_version?.version_number).toBe(2);
      expect(result.linked_characters).toHaveLength(1);
    });
  });

  describe('retryEnhancement', () => {
    test('should retry enhancement with same prompt', async () => {
      const enhancementId = 'enhancement-1';
      const retryRequest = {
        modify_prompt: false,
      };

      const mockResponse = {
        version_id: 'version-3',
        version_number: 3,
        status: 'queued',
        estimated_completion: '2025-09-26T16:10:00Z',
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await EnhancementService.retryEnhancement(enhancementId, retryRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(`/enhancement/${enhancementId}/retry`, retryRequest);
      expect(result).toEqual(mockResponse);
      expect(result.version_number).toBe(3);
    });

    test('should retry enhancement with modified prompt', async () => {
      const enhancementId = 'enhancement-1';
      const retryRequest = {
        modify_prompt: true,
        new_prompt: 'Improved mystical forest with more dramatic lighting and ancient trees',
        generation_params: {
          style: 'photorealistic',
          aspect_ratio: '16:9',
        },
      };

      const mockResponse = {
        version_id: 'version-3',
        version_number: 3,
        status: 'queued',
        estimated_completion: '2025-09-26T16:10:00Z',
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await EnhancementService.retryEnhancement(enhancementId, retryRequest);

      expect(result.version_number).toBe(3);
    });

    test('should handle retry rate limit', async () => {
      const enhancementId = 'enhancement-1';
      const retryRequest = { modify_prompt: false };

      const mockError = {
        error: 'retry_rate_limit',
        message: 'Maximum retries exceeded for this enhancement',
        details: {
          limit: 5,
          window: '1 hour',
          reset_at: '2025-09-26T17:00:00Z',
        },
      };

      mockApiClient.post.mockRejectedValue(mockError);

      await expect(EnhancementService.retryEnhancement(enhancementId, retryRequest)).rejects.toEqual(mockError);
    });
  });

  describe('setActiveVersion', () => {
    test('should set active image version', async () => {
      const enhancementId = 'enhancement-1';
      const versionId = 'version-2';

      const mockResponse = {
        enhancement_id: enhancementId,
        active_version_id: versionId,
        version_number: 2,
        updated_at: '2025-09-26T16:05:00Z',
      };

      mockApiClient.put.mockResolvedValue(mockResponse);

      const result = await EnhancementService.setActiveVersion(enhancementId, versionId);

      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/enhancement/${enhancementId}/active-version`,
        { version_id: versionId }
      );
      expect(result).toEqual(mockResponse);
      expect(result.version_number).toBe(2);
    });
  });

  describe('deleteEnhancement', () => {
    test('should delete enhancement and all versions', async () => {
      const enhancementId = 'enhancement-to-delete';

      mockApiClient.delete.mockResolvedValue(undefined);

      await EnhancementService.deleteEnhancement(enhancementId);

      expect(mockApiClient.delete).toHaveBeenCalledWith(`/enhancement/${enhancementId}`);
    });

    test('should handle deletion of non-existent enhancement', async () => {
      const enhancementId = 'nonexistent-enhancement';
      const mockError = { error: 'not_found', message: 'Enhancement not found' };

      mockApiClient.delete.mockRejectedValue(mockError);

      await expect(EnhancementService.deleteEnhancement(enhancementId)).rejects.toEqual(mockError);
    });
  });

  describe('linkCharacters', () => {
    test('should link characters to enhancement', async () => {
      const enhancementId = 'enhancement-1';
      const characterIds = ['character-1', 'character-2'];

      const mockResponse = {
        enhancement_id: enhancementId,
        linked_characters: [
          {
            id: 'character-1',
            work_id: 'work-1',
            name: 'Aria',
            description: 'Young sorceress',
            appearance_count: 5,
            linked_images_count: 3,
            created_at: '2025-09-26T10:00:00Z',
            updated_at: '2025-09-26T15:00:00Z',
          },
          {
            id: 'character-2',
            work_id: 'work-1',
            name: 'Drakon',
            description: 'Ancient wise dragon',
            appearance_count: 2,
            linked_images_count: 1,
            created_at: '2025-09-26T12:00:00Z',
            updated_at: '2025-09-26T16:00:00Z',
          },
        ],
        updated_at: '2025-09-26T16:05:00Z',
      };

      mockApiClient.put.mockResolvedValue(mockResponse);

      const result = await EnhancementService.linkCharacters(enhancementId, characterIds, 'set');

      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/enhancement/${enhancementId}/characters`,
        { character_ids: characterIds, operation: 'set' }
      );
      expect(result.linked_characters).toHaveLength(2);
    });
  });

  describe('batchRetry', () => {
    test('should retry multiple enhancements', async () => {
      const enhancementIds = ['enhancement-1', 'enhancement-2', 'enhancement-3'];
      const batchRequest = {
        enhancement_ids: enhancementIds,
        generation_params: {
          style: 'artistic',
          quality: 'high',
        },
      };

      const mockResponse = {
        batch_id: 'batch-retry-1',
        total_enhancements: 3,
        queued_enhancements: 3,
        failed_enhancements: 0,
        estimated_completion: '2025-09-26T16:10:00Z',
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await EnhancementService.batchRetry(batchRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith('/enhancement/batch-retry', batchRequest);
      expect(result).toEqual(mockResponse);
      expect(result.total_enhancements).toBe(3);
    });
  });
});