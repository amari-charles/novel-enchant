/**
 * Anchor Repository
 * Data access layer for anchor operations
 */

import { supabase } from '../../../lib/supabase';
import type { IAnchorRepository, Anchor, AnchorInsert, AnchorUpdate } from './IAnchorRepository';

export class AnchorRepository implements IAnchorRepository {
  async get(anchor_id: string): Promise<Anchor | null> {
    const { data, error } = await supabase
      .from('anchors')
      .select('*')
      .eq('id', anchor_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get anchor: ${error.message}`);
    }

    return data;
  }

  async create(anchor: AnchorInsert): Promise<Anchor> {
    const { data, error } = await supabase
      .from('anchors')
      .insert(anchor)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create anchor: ${error.message}`);
    }

    return data;
  }

  async update(anchor_id: string, updates: AnchorUpdate): Promise<Anchor> {
    const { data, error } = await supabase
      .from('anchors')
      .update(updates)
      .eq('id', anchor_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update anchor: ${error.message}`);
    }

    return data;
  }

  async delete(anchor_id: string): Promise<void> {
    const { error } = await supabase
      .from('anchors')
      .delete()
      .eq('id', anchor_id);

    if (error) {
      throw new Error(`Failed to delete anchor: ${error.message}`);
    }
  }

  async getByChapterId(chapter_id: string): Promise<Anchor[]> {
    const { data, error } = await supabase
      .from('anchors')
      .select('*')
      .eq('chapter_id', chapter_id)
      .order('after_paragraph_index', { ascending: true });

    if (error) {
      throw new Error(`Failed to get anchors by chapter: ${error.message}`);
    }

    return data;
  }

  async deleteByChapterId(chapter_id: string): Promise<void> {
    const { error } = await supabase
      .from('anchors')
      .delete()
      .eq('chapter_id', chapter_id);

    if (error) {
      throw new Error(`Failed to delete anchors by chapter: ${error.message}`);
    }
  }
}
