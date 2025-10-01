import type {
  Chapter,
  CreateChapterRequest,
  UpdateChapterRequest,
  AutoSaveRequest,
  AutoSaveResponse,
} from '../types';
import { apiClient } from './api-client';

export class ChapterService {
  /**
   * Fetch all chapters for a work, ordered by index
   */
  static async listChapters(workId: string): Promise<{
    chapters: Chapter[];
  }> {
    return apiClient.get(`/works/${workId}/chapters`);
  }

  /**
   * Fetch single chapter with full content and enhancement anchors
   */
  static async getChapter(chapterId: string): Promise<Chapter> {
    return apiClient.get(`/chapters/${chapterId}`);
  }

  /**
   * Create a new chapter in a work
   */
  static async createChapter(workId: string, data: CreateChapterRequest): Promise<Chapter> {
    return apiClient.post(`/works/${workId}/chapters`, data);
  }

  /**
   * Update chapter content, title, or enhancement anchors
   */
  static async updateChapter(chapterId: string, data: UpdateChapterRequest): Promise<Chapter> {
    return apiClient.put(`/chapters/${chapterId}`, data);
  }

  /**
   * Delete a chapter and reorder remaining chapters
   */
  static async deleteChapter(chapterId: string): Promise<void> {
    return apiClient.delete(`/chapters/${chapterId}`);
  }

  /**
   * Reorder chapters within a work
   */
  static async reorderChapters(data: {
    work_id: string;
    chapter_orders: Array<{
      chapter_id: string;
      order_index: number;
    }>;
  }): Promise<Chapter[]> {
    return apiClient.post('/chapters/reorder', data);
  }

  /**
   * Auto-save chapter content with conflict detection
   */
  static async autoSave(chapterId: string, data: AutoSaveRequest): Promise<AutoSaveResponse> {
    return apiClient.put(`/chapters/${chapterId}/autosave`, data);
  }

  /**
   * Get reading analytics for a chapter
   */
  static async getChapterAnalytics(chapterId: string): Promise<{
    chapter_id: string;
    total_views: number;
    unique_viewers: number;
    average_read_time: number;
    completion_rate: number;
    bounce_rate: number;
    popular_sections: Array<{
      start_position: number;
      end_position: number;
      view_time: number;
    }>;
    drop_off_points: Array<{
      position: number;
      percentage: number;
    }>;
  }> {
    return apiClient.get(`/chapters/${chapterId}/analytics`);
  }

  /**
   * Generate chapter summary/excerpt
   */
  static async generateSummary(chapterId: string, maxLength: number = 200): Promise<{
    summary: string;
    word_count: number;
  }> {
    return apiClient.post(`/chapters/${chapterId}/summary`, { max_length: maxLength });
  }

  /**
   * Search within chapter content
   */
  static async searchChapter(chapterId: string, query: string): Promise<{
    matches: Array<{
      position: number;
      context_before: string;
      matched_text: string;
      context_after: string;
    }>;
    total_matches: number;
  }> {
    return apiClient.get(`/chapters/${chapterId}/search`, { q: query });
  }

  /**
   * Get chapter revision history
   */
  static async getRevisionHistory(chapterId: string): Promise<{
    revisions: Array<{
      id: string;
      saved_at: string;
      word_count: number;
      changes_summary: string;
      auto_saved: boolean;
    }>;
  }> {
    return apiClient.get(`/chapters/${chapterId}/revisions`);
  }

  /**
   * Restore chapter to a previous revision
   */
  static async restoreRevision(chapterId: string, revisionId: string): Promise<Chapter> {
    return apiClient.post(`/chapters/${chapterId}/restore`, { revision_id: revisionId });
  }

  /**
   * Calculate reading time estimate for chapter
   */
  static calculateReadingTime(wordCount: number, wordsPerMinute: number = 200): number {
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Calculate word count from text content
   */
  static calculateWordCount(content: string | undefined | null): number {
    if (!content || !content.trim()) return 0;

    // Remove extra whitespace and split by word boundaries
    const words = content
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .filter(word => word.length > 0);

    return words.length;
  }

  /**
   * Extract character names mentioned in chapter content
   */
  static async extractCharacterMentions(chapterId: string): Promise<{
    mentioned_characters: Array<{
      name: string;
      positions: number[];
      confidence: number;
    }>;
    suggestions: Array<{
      name: string;
      description: string;
    }>;
  }> {
    return apiClient.post(`/chapters/${chapterId}/extract-characters`);
  }

  /**
   * Validate chapter for publishing requirements
   */
  static async validateChapter(chapterId: string): Promise<{
    valid: boolean;
    issues: Array<{
      type: 'error' | 'warning' | 'suggestion';
      message: string;
      position?: number;
    }>;
    word_count: number;
    enhancement_coverage: number;
  }> {
    return apiClient.get(`/chapters/${chapterId}/validate`);
  }
}