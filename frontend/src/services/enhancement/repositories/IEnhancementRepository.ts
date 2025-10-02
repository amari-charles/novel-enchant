/**
 * Enhancement Repository Interface
 * Data access layer for enhancement operations
 */

import type { Database } from '../../../lib/supabase';

// Type aliases from database schema
export type Enhancement = Database['public']['Tables']['enhancements']['Row'];
export type EnhancementInsert = Database['public']['Tables']['enhancements']['Insert'];
export type EnhancementUpdate = Database['public']['Tables']['enhancements']['Update'];

export interface IEnhancementRepository {
  /**
   * Get an enhancement by ID
   * @param enhancement_id - The enhancement ID
   * @returns The enhancement if found, null otherwise
   */
  get(enhancement_id: string): Promise<Enhancement | null>;

  /**
   * Create a new enhancement
   * @param enhancement - The enhancement data to create
   * @returns The created enhancement
   */
  create(enhancement: EnhancementInsert): Promise<Enhancement>;

  /**
   * Update an existing enhancement
   * @param enhancement_id - The enhancement ID
   * @param updates - The fields to update
   * @returns The updated enhancement
   */
  update(enhancement_id: string, updates: EnhancementUpdate): Promise<Enhancement>;

  /**
   * Delete an enhancement
   * @param enhancement_id - The enhancement ID
   */
  delete(enhancement_id: string): Promise<void>;

  /**
   * Get all enhancements for an anchor
   * @param anchor_id - The anchor ID
   * @returns Array of enhancements
   */
  getByAnchorId(anchor_id: string): Promise<Enhancement[]>;

  /**
   * Get all enhancements for a chapter
   * @param chapter_id - The chapter ID
   * @returns Array of enhancements
   */
  getByChapterId(chapter_id: string): Promise<Enhancement[]>;

  /**
   * Get enhancements by status
   * @param status - The status to filter by
   * @returns Array of enhancements
   */
  getByStatus(status: 'generating' | 'completed' | 'failed'): Promise<Enhancement[]>;
}
