/**
 * EnhancedCopy Data Access Layer
 * Handles all database operations for enhanced copies
 */

import { supabase } from "../../lib/supabase";
import type {
  EnhancedCopy,
  EnhancedCopyListItem,
  Chapter,
  Scene,
} from '@/features/reader-enhance/types';

export class EnhancedCopyService {
  /**
   * Create a new enhanced copy from a completed job
   */
  static async createFromJob(
    userId: string,
    jobData: {
      title: string;
      source_type: 'paste' | 'file' | 'import';
      source_file_url?: string;
      chapters: Chapter[];
    }
  ): Promise<EnhancedCopy> {
    // Find first accepted image for cover
    let coverImageUrl: string | undefined;
    for (const chapter of jobData.chapters) {
      for (const scene of chapter.scenes) {
        if (scene.accepted && scene.image_url) {
          coverImageUrl = scene.image_url;
          break;
        }
      }
      if (coverImageUrl) break;
    }

    const newCopy: Partial<EnhancedCopy> = {
      user_id: userId,
      job_id: `job_${Date.now()}`,
      title: jobData.title,
      content: {
        chapters: jobData.chapters
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('chapters')
      .insert(newCopy)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create enhanced copy: ${error.message || 'Unknown error'}`);
    }

    return data as EnhancedCopy;
  }

  /**
   * Get user's enhanced copies for My Shelf
   */
  static async getUserCopies(userId: string): Promise<EnhancedCopyListItem[]> {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch enhanced copies: ${error.message || 'Unknown error'}`);
    }

    // Transform to list items with scene count
    return (data || []).map(copy => {
      const enhancedCopy = copy as EnhancedCopy;
      // Find first image for cover
      let coverImageUrl: string | undefined;
      if (enhancedCopy.content?.chapters) {
        for (const chapter of enhancedCopy.content.chapters) {
          for (const scene of chapter.scenes) {
            if (scene.image_url) {
              coverImageUrl = scene.image_url;
              break;
            }
          }
          if (coverImageUrl) break;
        }
      }

      return {
        id: enhancedCopy.id,
        title: enhancedCopy.title,
        cover_image_url: coverImageUrl,
        scene_count: this.countScenes(enhancedCopy.content?.chapters || []),
        created_at: enhancedCopy.created_at,
      };
    });
  }

  /**
   * Get a single enhanced copy by ID
   */
  static async getCopyById(copyId: string, userId: string): Promise<EnhancedCopy | null> {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', copyId)
      .eq('user_id', userId) // Ensure user owns the copy
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch enhanced copy: ${error.message}`);
    }

    return data as EnhancedCopy;
  }

  /**
   * Update an enhanced copy
   */
  static async updateCopy(
    copyId: string,
    userId: string,
    updates: Partial<Pick<EnhancedCopy, 'title' | 'chapters' | 'cover_image_url'>>
  ): Promise<EnhancedCopy> {
    const { data, error } = await supabase
      .from('chapters')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', copyId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update enhanced copy: ${error.message}`);
    }

    return data as EnhancedCopy;
  }

  /**
   * Delete an enhanced copy
   */
  static async deleteCopy(copyId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('chapters')
      .delete()
      .eq('id', copyId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete enhanced copy: ${error.message}`);
    }

    // Clean up associated images from storage
    await this.cleanupCopyImages(copyId, userId);
  }

  /**
   * Update a specific scene in an enhanced copy
   */
  static async updateScene(
    copyId: string,
    userId: string,
    chapterIndex: number,
    sceneIndex: number,
    sceneUpdates: Partial<Scene>
  ): Promise<EnhancedCopy> {
    // First, get the current copy
    const copy = await this.getCopyById(copyId, userId);
    if (!copy) {
      throw new Error('Enhanced copy not found');
    }

    // Update the scene
    const chapters = [...copy.chapters];
    if (chapters[chapterIndex] && chapters[chapterIndex].scenes[sceneIndex]) {
      chapters[chapterIndex].scenes[sceneIndex] = {
        ...chapters[chapterIndex].scenes[sceneIndex],
        ...sceneUpdates,
      };
    } else {
      throw new Error('Scene not found');
    }

    // Update cover image if this is the first accepted scene
    let coverImageUrl = copy.cover_image_url;
    if (!coverImageUrl && sceneUpdates.accepted && sceneUpdates.image_url) {
      coverImageUrl = sceneUpdates.image_url;
    }

    return await this.updateCopy(copyId, userId, { chapters, cover_image_url: coverImageUrl });
  }

  /**
   * Check if user has reached enhancement limit
   */
  static async checkUserLimits(userId: string): Promise<{
    canEnhance: boolean;
    copiesCount: number;
    limit: number;
  }> {
    const { count, error } = await supabase
      .from('chapters')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to check user limits: ${error.message}`);
    }

    const copiesCount = count || 0;
    const limit = 100; // Configurable limit

    return {
      canEnhance: copiesCount < limit,
      copiesCount,
      limit,
    };
  }

  /**
   * Search user's enhanced copies
   */
  static async searchCopies(
    userId: string,
    query: string
  ): Promise<EnhancedCopyListItem[]> {
    const { data, error } = await supabase
      .from('chapters')
      .select('id, title, cover_image_url, created_at, chapters')
      .eq('user_id', userId)
      .ilike('title', `%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to search enhanced copies: ${error.message}`);
    }

    return (data || []).map(copy => ({
      id: copy.id,
      title: copy.title,
      cover_image_url: copy.cover_image_url,
      scene_count: this.countScenes(copy.chapters as Chapter[]),
      created_at: copy.created_at,
    }));
  }

  // Private helper methods

  private static countScenes(chapters: Chapter[]): number {
    return chapters.reduce((total, chapter) => total + chapter.scenes.length, 0);
  }

  private static async cleanupCopyImages(copyId: string, userId: string): Promise<void> {
    try {
      // List all images for this copy
      const { data: files } = await supabase.storage
        .from('enhanced-copies')
        .list(`${userId}/${copyId}`);

      if (files && files.length > 0) {
        const filePaths = files.map(file => `${userId}/${copyId}/${file.name}`);
        await supabase.storage
          .from('enhanced-copies')
          .remove(filePaths);
      }
    } catch (error) {
      console.error('Failed to cleanup images:', error);
      // Don't throw - deletion should succeed even if cleanup fails
    }
  }

  /**
   * Validate enhanced copy data
   */
  static validateCopyData(data: Partial<EnhancedCopy>): string[] {
    const errors: string[] = [];

    if (data.title && data.title.length > 255) {
      errors.push('Title must be less than 255 characters');
    }

    if (data.chapters) {
      const sceneCount = this.countScenes(data.chapters);
      if (sceneCount > 30) {
        errors.push(`Too many scenes (${sceneCount}). Maximum is 30 per copy`);
      }

      // Validate scene excerpts
      for (const chapter of data.chapters) {
        for (const scene of chapter.scenes) {
          if (scene.excerpt.length < 100) {
            errors.push('Scene excerpts must be at least 100 characters');
          }
          if (scene.excerpt.length > 2000) {
            errors.push('Scene excerpts must be less than 2000 characters');
          }
        }
      }
    }

    return errors;
  }
}