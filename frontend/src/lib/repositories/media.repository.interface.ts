/**
 * Media Repository Interface
 * Data access layer for media file operations
 */

import type { Database } from '@/lib/supabase';

// Type aliases from database schema
export type Media = Database['public']['Tables']['media']['Row'];
export type MediaInsert = Database['public']['Tables']['media']['Insert'];
export type MediaUpdate = Database['public']['Tables']['media']['Update'];

export interface IMediaRepository {
  /**
   * Get a media file by ID
   * @param media_id - The media ID
   * @returns The media if found, null otherwise
   */
  get(media_id: string): Promise<Media | null>;

  /**
   * Create a new media record
   * @param media - The media data to create
   * @returns The created media
   */
  create(media: MediaInsert): Promise<Media>;

  /**
   * Update an existing media record
   * @param media_id - The media ID
   * @param updates - The fields to update
   * @returns The updated media
   */
  update(media_id: string, updates: MediaUpdate): Promise<Media>;

  /**
   * Delete a media record
   * @param media_id - The media ID
   */
  delete(media_id: string): Promise<void>;

  /**
   * Get all media files for a user
   * @param user_id - The user ID
   * @returns Array of media files
   */
  getByUserId(user_id: string): Promise<Media[]>;

  /**
   * Get media files by type
   * @param user_id - The user ID
   * @param media_type - The media type to filter by
   * @returns Array of media files
   */
  getByType(user_id: string, media_type: 'image' | 'audio' | 'video'): Promise<Media[]>;
}
