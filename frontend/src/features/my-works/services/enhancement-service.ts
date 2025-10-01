import type {
  Enhancement,
  AutoEnhanceRequest,
  AutoEnhanceResponse,
  ManualEnhanceRequest,
  EnhancementStatusResponse,
} from '../types';
import { apiClient } from './api-client';

export class EnhancementService {
  /**
   * Start auto-enhancement job for a chapter
   */
  static async autoEnhance(data: AutoEnhanceRequest): Promise<AutoEnhanceResponse> {
    return apiClient.post('/enhancement/auto-enhance', data);
  }

  /**
   * Create manual enhancement at specific position
   */
  static async manualEnhance(data: ManualEnhanceRequest): Promise<{
    enhancement_id: string;
    anchor_id: string;
    status: string;
    estimated_completion: string;
  }> {
    return apiClient.post('/enhancement/manual-insert', data);
  }

  /**
   * Create enhancement from highlighted text
   */
  static async highlightEnhance(data: {
    chapter_id: string;
    position_start: number;
    position_end: number;
    highlighted_text: string;
    enhance_prompt?: boolean;
    additional_context?: string;
    linked_characters?: string[];
  }): Promise<{
    enhancement_id: string;
    anchor_id: string;
    final_prompt: string;
    status: string;
  }> {
    return apiClient.post('/enhancement/highlight-insert', data);
  }

  /**
   * Check status of enhancement generation job
   */
  static async getEnhancementStatus(jobId: string): Promise<EnhancementStatusResponse> {
    return apiClient.get(`/enhancement/status/${jobId}`);
  }

  /**
   * Get full enhancement details with version history
   */
  static async getEnhancement(enhancementId: string): Promise<Enhancement> {
    return apiClient.get(`/enhancement/${enhancementId}`);
  }

  /**
   * Retry enhancement generation with optional prompt modification
   */
  static async retryEnhancement(enhancementId: string, data: {
    modify_prompt?: boolean;
    new_prompt?: string;
    generation_params?: Record<string, unknown>;
  }): Promise<{
    version_id: string;
    version_number: number;
    status: string;
    estimated_completion: string;
  }> {
    return apiClient.post(`/enhancement/${enhancementId}/retry`, data);
  }

  /**
   * Set which image version is active for display
   */
  static async setActiveVersion(enhancementId: string, versionId: string): Promise<{
    enhancement_id: string;
    active_version_id: string;
    version_number: number;
    updated_at: string;
  }> {
    return apiClient.put(`/enhancement/${enhancementId}/active-version`, {
      version_id: versionId,
    });
  }

  /**
   * Delete enhancement and all its versions
   */
  static async deleteEnhancement(enhancementId: string): Promise<void> {
    return apiClient.delete(`/enhancement/${enhancementId}`);
  }

  /**
   * Link or unlink characters from enhancement
   */
  static async linkCharacters(
    enhancementId: string,
    characterIds: string[],
    operation: 'set' | 'add' | 'remove'
  ): Promise<{
    enhancement_id: string;
    linked_characters: Array<{
      id: string;
      work_id: string;
      name: string;
      description: string;
      appearance_count: number;
      linked_images_count: number;
      created_at: string;
      updated_at: string;
    }>;
    updated_at: string;
  }> {
    return apiClient.put(`/enhancement/${enhancementId}/characters`, {
      character_ids: characterIds,
      operation,
    });
  }

  /**
   * Retry multiple enhancements in batch
   */
  static async batchRetry(data: {
    enhancement_ids: string[];
    generation_params?: Record<string, unknown>;
  }): Promise<{
    batch_id: string;
    total_enhancements: number;
    queued_enhancements: number;
    failed_enhancements: number;
    estimated_completion: string;
  }> {
    return apiClient.post('/enhancement/batch-retry', data);
  }

  /**
   * Check status of batch operation
   */
  static async getBatchStatus(batchId: string): Promise<{
    batch_id: string;
    status: string;
    progress: number;
    completed_count: number;
    failed_count: number;
    total_count: number;
    enhancements: Array<{
      enhancement_id: string;
      status: string;
      version_number?: number;
    }>;
  }> {
    return apiClient.get(`/enhancement/batch-status/${batchId}`);
  }

  /**
   * Get enhancement generation queue status
   */
  static async getQueueStatus(): Promise<{
    queue_length: number;
    estimated_wait_time: number;
    user_jobs_in_queue: number;
    processing_capacity: number;
  }> {
    return apiClient.get('/enhancement/queue-status');
  }

  /**
   * Cancel pending enhancement job
   */
  static async cancelEnhancement(jobId: string): Promise<{
    job_id: string;
    cancelled_at: string;
    refund_amount?: number;
  }> {
    return apiClient.post(`/enhancement/cancel/${jobId}`);
  }

  /**
   * Get enhancement analytics for a work
   */
  static async getEnhancementAnalytics(workId: string): Promise<{
    total_enhancements: number;
    auto_generated: number;
    manual_created: number;
    average_quality_score: number;
    most_popular_prompts: Array<{
      prompt: string;
      usage_count: number;
      average_score: number;
    }>;
    generation_success_rate: number;
  }> {
    return apiClient.get(`/enhancement/analytics/${workId}`);
  }

  /**
   * Optimize enhancement prompts using AI
   */
  static async optimizePrompt(currentPrompt: string, context?: {
    scene_description?: string;
    character_context?: string[];
    style_preferences?: string[];
  }): Promise<{
    optimized_prompt: string;
    improvements: string[];
    confidence: number;
  }> {
    return apiClient.post('/enhancement/optimize-prompt', {
      current_prompt: currentPrompt,
      context,
    });
  }

  /**
   * Get suggested enhancement positions for chapter content
   */
  static async suggestEnhancementPositions(chapterId: string, targetCount?: number): Promise<{
    suggestions: Array<{
      position: number;
      confidence: number;
      scene_description: string;
      suggested_prompt: string;
      reasoning: string;
    }>;
    chapter_analysis: {
      scene_count: number;
      narrative_density: number;
      enhancement_coverage: number;
    };
  }> {
    return apiClient.post(`/enhancement/suggest-positions/${chapterId}`, {
      target_count: targetCount,
    });
  }

  /**
   * Apply style transfer to existing enhancement
   */
  static async applyStyleTransfer(enhancementId: string, styleReference: {
    style_name?: string;
    reference_image_url?: string;
    style_description?: string;
  }): Promise<{
    version_id: string;
    version_number: number;
    status: string;
    estimated_completion: string;
  }> {
    return apiClient.post(`/enhancement/${enhancementId}/style-transfer`, styleReference);
  }

  /**
   * Get enhancement quality metrics
   */
  static async getQualityMetrics(enhancementId: string): Promise<{
    quality_score: number;
    technical_quality: {
      resolution: number;
      sharpness: number;
      composition: number;
    };
    prompt_adherence: number;
    artistic_quality: number;
    user_feedback: {
      likes: number;
      dislikes: number;
      average_rating: number;
    };
  }> {
    return apiClient.get(`/enhancement/${enhancementId}/quality`);
  }
}