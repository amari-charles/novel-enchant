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
      // Create a temporary story and chapter for the new architecture
      const tempStoryId = await this.createTempStory(storyTitle);
      const tempChapterId = await this.createTempChapter(tempStoryId, chapterText, chapterTitle);

      // Start enhancement using new API
      const { runId } = await EnhanceApiService.startEnhancement({
        chapterId: tempChapterId,
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

              // Clean up temporary data
              await this.cleanupTempData(tempStoryId);

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

  private static async createTempStory(title: string): Promise<string> {
    const { data, error } = await supabase
      .from('stories')
      .insert({
        title: `[TEMP] ${title}`,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error('Failed to create temporary story');
    }

    return data.id;
  }

  private static async createTempChapter(storyId: string, text: string, title: string): Promise<string> {
    const { data, error } = await supabase
      .from('chapters')
      .insert({
        story_id: storyId,
        idx: 0,
        raw_text: text
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error('Failed to create temporary chapter');
    }

    return data.id;
  }

  private static async cleanupTempData(storyId: string): Promise<void> {
    // Delete the temporary story (chapters will be deleted by cascade)
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', storyId);

    if (error) {
      console.warn('Failed to cleanup temporary data:', error);
    }
  }
}