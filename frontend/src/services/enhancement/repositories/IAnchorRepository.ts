/**
 * Anchor Repository Interface
 * Data access layer for anchor operations
 */

import type { Database } from '../../../lib/supabase';

// Type aliases from database schema
export type Anchor = Database['public']['Tables']['anchors']['Row'];
export type AnchorInsert = Database['public']['Tables']['anchors']['Insert'];
export type AnchorUpdate = Database['public']['Tables']['anchors']['Update'];

export interface IAnchorRepository {
  /**
   * Get an anchor by ID
   * @param anchor_id - The anchor ID
   * @returns The anchor if found, null otherwise
   */
  get(anchor_id: string): Promise<Anchor | null>;

  /**
   * Create a new anchor
   * @param anchor - The anchor data to create
   * @returns The created anchor
   */
  create(anchor: AnchorInsert): Promise<Anchor>;

  /**
   * Update an existing anchor
   * @param anchor_id - The anchor ID
   * @param updates - The fields to update
   * @returns The updated anchor
   */
  update(anchor_id: string, updates: AnchorUpdate): Promise<Anchor>;

  /**
   * Delete an anchor
   * @param anchor_id - The anchor ID
   */
  delete(anchor_id: string): Promise<void>;

  /**
   * Get all anchors for a chapter
   * @param chapter_id - The chapter ID
   * @returns Array of anchors ordered by paragraph index
   */
  getByChapterId(chapter_id: string): Promise<Anchor[]>;

  /**
   * Delete all anchors for a chapter
   * @param chapter_id - The chapter ID
   */
  deleteByChapterId(chapter_id: string): Promise<void>;
}
