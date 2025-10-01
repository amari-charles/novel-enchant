import type {
  Work,
  CreateWorkRequest,
  UpdateWorkRequest,
  WorksQueryParams,
} from '../types';
import { apiClient } from './api-client';
import { SupabaseWorkService } from './supabase-work-service';

// Use Supabase in development, mock API otherwise
const isDevelopment = import.meta.env.VITE_APP_ENV === 'development';

export class WorkService {
  /**
   * Fetch paginated list of works for the current user
   */
  static async listWorks(params: WorksQueryParams = {}): Promise<{
    works: Work[];
    total: number;
    has_more: boolean;
  }> {
    if (isDevelopment) {
      return SupabaseWorkService.listWorks(params);
    }

    const queryParams = {
      limit: 20,
      offset: 0,
      ...params,
    };

    return apiClient.get('/works', queryParams);
  }

  /**
   * Fetch single work with full details including chapters and characters
   */
  static async getWork(workId: string): Promise<Work> {
    return apiClient.get(`/works/${workId}`);
  }

  /**
   * Create a new work
   */
  static async createWork(data: CreateWorkRequest): Promise<Work> {
    return apiClient.post('/works', data);
  }

  /**
   * Update existing work metadata
   */
  static async updateWork(workId: string, data: UpdateWorkRequest): Promise<Work> {
    return apiClient.put(`/works/${workId}`, data);
  }

  /**
   * Delete a work and all associated data
   */
  static async deleteWork(workId: string): Promise<void> {
    return apiClient.delete(`/works/${workId}`);
  }

  /**
   * Get comprehensive metrics for a work
   */
  static async getWorkMetrics(workId: string): Promise<{
    work_id: string;
    total_chapters: number;
    total_words: number;
    total_enhancements: number;
    total_characters: number;
    average_chapter_length: number;
    enhancement_coverage: number;
    last_activity: string;
    completion_status: {
      has_content: boolean;
      has_enhancements: boolean;
      has_characters: boolean;
      ready_for_publishing: boolean;
    };
  }> {
    return apiClient.get(`/works/${workId}/metrics`);
  }

  /**
   * Archive a work (soft delete)
   */
  static async archiveWork(workId: string): Promise<Work> {
    return apiClient.put(`/works/${workId}`, { status: 'archived' });
  }

  /**
   * Restore an archived work
   */
  static async restoreWork(workId: string): Promise<Work> {
    return apiClient.put(`/works/${workId}`, { status: 'draft' });
  }

  /**
   * Get work publishing status and requirements
   */
  static async getPublishingReadiness(workId: string): Promise<{
    ready: boolean;
    requirements: Array<{
      requirement: string;
      met: boolean;
      description: string;
    }>;
    recommendations: string[];
  }> {
    return apiClient.get(`/works/${workId}/publishing-readiness`);
  }

  /**
   * Duplicate a work with all its content
   */
  static async duplicateWork(workId: string, title: string): Promise<Work> {
    return apiClient.post(`/works/${workId}/duplicate`, { title });
  }

  /**
   * Export work data in various formats
   */
  static async exportWork(workId: string, format: 'json' | 'markdown' | 'html'): Promise<{
    download_url: string;
    expires_at: string;
  }> {
    return apiClient.post(`/works/${workId}/export`, { format });
  }
}