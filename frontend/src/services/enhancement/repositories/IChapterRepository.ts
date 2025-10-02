/**
 * Chapter Repository Interface
 * Data access layer for chapter operations
 */

import type { Database } from '../../../lib/supabase';

// Type aliases from database schema
export type Chapter = Database['public']['Tables']['chapters']['Row'];
export type ChapterInsert = Database['public']['Tables']['chapters']['Insert'];
export type ChapterUpdate = Database['public']['Tables']['chapters']['Update'];

export interface IChapterRepository {
  /**
   * Get a chapter by ID
   * @param chapter_id - The chapter ID
   * @returns The chapter if found, null otherwise
   */
  get(chapter_id: string): Promise<Chapter | null>;

  /**
   * Create a new chapter
   * @param chapter - The chapter data to create
   * @returns The created chapter
   */
  create(chapter: ChapterInsert): Promise<Chapter>;

  /**
   * Update an existing chapter
   * @param chapter_id - The chapter ID
   * @param updates - The fields to update
   * @returns The updated chapter
   */
  update(chapter_id: string, updates: ChapterUpdate): Promise<Chapter>;

  /**
   * Delete a chapter
   * @param chapter_id - The chapter ID
   */
  delete(chapter_id: string): Promise<void>;

  /**
   * Get all chapters for a story
   * @param story_id - The story ID
   * @returns Array of chapters ordered by order_index
   */
  getByStoryId(story_id: string): Promise<Chapter[]>;
}
