import { supabase } from "./supabase";

export interface EnhanceChapterRequest {
  chapterId: string;
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

  static async pollEnhancementStatus(
    runId: string,
    onProgress?: (status: EnhanceStatusResponse) => void,
    onComplete?: (status: EnhanceStatusResponse) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    const pollInterval = 2000; // 2 seconds
    const maxPolls = 150; // 5 minutes max
    let polls = 0;

    const poll = async () => {
      try {
        polls++;
        const status = await this.getEnhancementStatus(runId);

        onProgress?.(status);

        if (status.status === 'completed') {
          onComplete?.(status);
          return;
        }

        if (status.status === 'failed') {
          onError?.(new Error('Enhancement failed'));
          return;
        }

        if (polls >= maxPolls) {
          onError?.(new Error('Enhancement timed out'));
          return;
        }

        // Continue polling
        setTimeout(poll, pollInterval);
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error('Unknown error'));
      }
    };

    poll();
  }
}