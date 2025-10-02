/**
 * Story Repository Interface
 * Data access layer for story operations
 */

import type { Database } from '../../../lib/supabase';

// Type aliases from database schema
export type Story = Database['public']['Tables']['stories']['Row'];
export type StoryInsert = Database['public']['Tables']['stories']['Insert'];
export type StoryUpdate = Database['public']['Tables']['stories']['Update'];

export interface IStoryRepository {
  /**
   * Get a story by ID
   * @param story_id - The story ID
   * @returns The story if found, null otherwise
   */
  get(story_id: string): Promise<Story | null>;

  /**
   * Create a new story
   * @param story - The story data to create
   * @returns The created story
   */
  create(story: StoryInsert): Promise<Story>;

  /**
   * Update an existing story
   * @param story_id - The story ID
   * @param updates - The fields to update
   * @returns The updated story
   */
  update(story_id: string, updates: StoryUpdate): Promise<Story>;

  /**
   * Delete a story
   * @param story_id - The story ID
   */
  delete(story_id: string): Promise<void>;

  /**
   * Get all stories for a user
   * @param user_id - The user ID
   * @returns Array of stories
   */
  getByUserId(user_id: string): Promise<Story[]>;
}
