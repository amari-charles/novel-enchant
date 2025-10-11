/**
 * Enhancement Repository
 * Data access layer for enhancement operations
 */

import { supabase } from '@/lib/supabase';
import type { IEnhancementRepository, Enhancement, EnhancementInsert, EnhancementUpdate } from './enhancement.repository.interface';

export class EnhancementRepository implements IEnhancementRepository {
  async get(enhancement_id: string): Promise<Enhancement | null> {
    const { data, error } = await supabase
      .from('enhancements')
      .select('*')
      .eq('id', enhancement_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get enhancement: ${error.message}`);
    }

    return data;
  }

  async create(enhancement: EnhancementInsert): Promise<Enhancement> {
    const { data, error } = await supabase
      .from('enhancements')
      .insert(enhancement)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create enhancement: ${error.message}`);
    }

    return data;
  }

  async update(enhancement_id: string, updates: EnhancementUpdate): Promise<Enhancement> {
    const { data, error } = await supabase
      .from('enhancements')
      .update(updates)
      .eq('id', enhancement_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update enhancement: ${error.message}`);
    }

    return data;
  }

  async delete(enhancement_id: string): Promise<void> {
    const { error } = await supabase
      .from('enhancements')
      .delete()
      .eq('id', enhancement_id);

    if (error) {
      throw new Error(`Failed to delete enhancement: ${error.message}`);
    }
  }

  async getByAnchorId(anchor_id: string): Promise<Enhancement[]> {
    const { data, error } = await supabase
      .from('enhancements')
      .select('*')
      .eq('anchor_id', anchor_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get enhancements by anchor: ${error.message}`);
    }

    return data;
  }

  async getByChapterId(chapter_id: string): Promise<Enhancement[]> {
    const { data, error } = await supabase
      .from('enhancements')
      .select('*')
      .eq('chapter_id', chapter_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get enhancements by chapter: ${error.message}`);
    }

    return data;
  }

  async getByStatus(status: 'generating' | 'completed' | 'failed'): Promise<Enhancement[]> {
    const { data, error } = await supabase
      .from('enhancements')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get enhancements by status: ${error.message}`);
    }

    return data;
  }
}
