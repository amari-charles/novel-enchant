import { supabase } from "./supabase";
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface EnhanceChapterRequest {
  chapterId?: string;
  chapterText?: string;
  chapterTitle?: string;
  stylePreset?: string;
  capScenes?: number;
}

export interface EnhanceStatusResponse {
  status: 'queued' | 'analyzing' | 'generating' | 'uploading' | 'completed' | 'failed';
  scenes: Array<{
    sceneId: string;
    idx: number;
    title: string;
    currentImage?: {
      storagePath: string;
      url: string;
    };
  }>;
  startedAt: string;
  finishedAt?: string;
}

export class EnhanceApiService {
  static async startEnhancement(request: EnhanceChapterRequest): Promise<{ runId: string }> {
    const { data, error } = await supabase.functions.invoke('enhance-start', {
      body: request
    });

    if (error) {
      throw new Error(error.message || 'Failed to start enhancement');
    }

    if (!data?.runId) {
      throw new Error('No run ID returned from enhancement service');
    }

    return data;
  }

  static async getEnhancementStatus(runId: string): Promise<EnhanceStatusResponse> {
    const { data, error } = await supabase.functions.invoke('enhance-status', {
      body: { runId }
    });

    if (error) {
      throw new Error(error.message || 'Failed to get enhancement status');
    }

    return data;
  }

  static async retryEnhancement(chapterId: string, stylePreset?: string): Promise<{ runId: string }> {
    return this.startEnhancement({
      chapterId,
      stylePreset,
      capScenes: 5
    });
  }

  static async subscribeToEnhancementStatus(
    runId: string,
    onProgress?: (status: EnhanceStatusResponse) => void,
    onComplete?: (status: EnhanceStatusResponse) => void,
    onError?: (error: Error) => void
  ): Promise<RealtimeChannel> {
    // Get initial status
    try {
      const initialStatus = await this.getEnhancementStatus(runId);
      onProgress?.(initialStatus);

      // If already completed or failed, call appropriate callback
      if (initialStatus.status === 'completed') {
        onComplete?.(initialStatus);
      } else if (initialStatus.status === 'failed') {
        onError?.(new Error('Enhancement failed'));
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to get initial status'));
    }

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`enhancement:${runId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'enhancement_runs',
          filter: `id=eq.${runId}`
        },
        async () => {
          try {
            const status = await this.getEnhancementStatus(runId);
            onProgress?.(status);

            if (status.status === 'completed') {
              onComplete?.(status);
              channel.unsubscribe();
            } else if (status.status === 'failed') {
              onError?.(new Error('Enhancement failed'));
              channel.unsubscribe();
            }
          } catch (error) {
            onError?.(error instanceof Error ? error : new Error('Failed to get status update'));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scenes',
          filter: `enhancement_run_id=eq.${runId}`
        },
        async () => {
          // Scene updated - refresh status
          try {
            const status = await this.getEnhancementStatus(runId);
            onProgress?.(status);
          } catch (error) {
            // Ignore scene update errors, main run updates will catch completion
          }
        }
      )
      .subscribe();

    return channel;
  }
}