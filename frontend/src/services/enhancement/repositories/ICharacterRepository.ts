/**
 * Character Repository Interface
 * Data access layer for character operations
 */

import type { Database } from '../../../lib/supabase';

// Type aliases from database schema
export type Character = Database['public']['Tables']['characters']['Row'];
export type CharacterInsert = Database['public']['Tables']['characters']['Insert'];
export type CharacterUpdate = Database['public']['Tables']['characters']['Update'];

export interface ICharacterRepository {
  /**
   * Get a character by ID
   * @param character_id - The character ID
   * @returns The character if found, null otherwise
   */
  get(character_id: string): Promise<Character | null>;

  /**
   * Create a new character
   * @param character - The character data to create
   * @returns The created character
   */
  create(character: CharacterInsert): Promise<Character>;

  /**
   * Update an existing character
   * @param character_id - The character ID
   * @param updates - The fields to update
   * @returns The updated character
   */
  update(character_id: string, updates: CharacterUpdate): Promise<Character>;

  /**
   * Delete a character
   * @param character_id - The character ID
   */
  delete(character_id: string): Promise<void>;

  /**
   * Get all characters for a story
   * @param story_id - The story ID
   * @returns Array of characters
   */
  getByStoryId(story_id: string): Promise<Character[]>;

  /**
   * Get characters by status
   * @param story_id - The story ID
   * @param status - The character status to filter by
   * @returns Array of characters
   */
  getByStatus(story_id: string, status: 'candidate' | 'confirmed' | 'ignored' | 'merged'): Promise<Character[]>;
}
