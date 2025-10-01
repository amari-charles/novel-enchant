import { supabase } from './supabase';
import { EnhanceApiService } from './enhance-api.service';

export interface ShelfEnhanceResult {
  success: boolean;
  updatedScenes?: Array<{
    image_url: string;
    status: string;
    accepted: boolean;
    quality_score: number;
    updated_at: string;
  }>;
  error?: string;
}

export class ShelfEnhanceService {
  static async enhanceChapterFromShelf(
    chapterText: string,
    chapterTitle: string,
    storyTitle: string,
    onProgress?: (sceneIndex: number, progress: { status: string; message: string; imageUrl?: string }) => void
  ): Promise<ShelfEnhanceResult> {
    try {
      // Start enhancement with text directly (no temp chapters needed)
      const { runId } = await EnhanceApiService.startEnhancement({
        chapterText,
        chapterTitle,
        stylePreset: 'cinematic',
        capScenes: 5
      });

      // Poll for completion
      return new Promise((resolve, reject) => {
        EnhanceApiService.pollEnhancementStatus(
          runId,
          (status) => {
            // Report progress for each scene
            status.scenes.forEach((scene, index) => {
              if (scene.currentImage) {
                onProgress?.(index, {
                  status: 'completed',
                  message: `Scene ${index + 1} image generated successfully`,
                  imageUrl: scene.currentImage.url
                });
              } else {
                onProgress?.(index, {
                  status: 'processing',
                  message: `Generating image for scene ${index + 1}...`
                });
              }
            });
          },
          async (finalStatus) => {
            try {
              // Convert new architecture results back to shelf format
              const updatedScenes = finalStatus.scenes.map((scene) => ({
                image_url: scene.currentImage?.url || '',
                status: scene.currentImage ? 'generated' : 'failed',
                accepted: true,
                quality_score: 0.85,
                updated_at: new Date().toISOString()
              }));

              resolve({
                success: true,
                updatedScenes
              });
            } catch (error) {
              reject(error);
            }
          },
          (error) => {
            reject(error);
          }
        );
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}