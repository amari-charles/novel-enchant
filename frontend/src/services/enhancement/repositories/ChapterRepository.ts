/**
 * Chapter Repository
 * Data access layer for chapter operations
 */

import { supabase } from '../../../lib/supabase';
import type { IChapterRepository, Chapter, ChapterInsert, ChapterUpdate } from './IChapterRepository';

export class ChapterRepository implements IChapterRepository {
  async get(chapter_id: string): Promise<Chapter | null> {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', chapter_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get chapter: ${error.message}`);
    }

    return data;
  }

  async create(chapter: ChapterInsert): Promise<Chapter> {
    const { data, error } = await supabase
      .from('chapters')
      .insert(chapter)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create chapter: ${error.message}`);
    }

    return data;
  }

  async update(chapter_id: string, updates: ChapterUpdate): Promise<Chapter> {
    const { data, error } = await supabase
      .from('chapters')
      .update(updates)
      .eq('id', chapter_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update chapter: ${error.message}`);
    }

    return data;
  }

  async delete(chapter_id: string): Promise<void> {
    const { error } = await supabase
      .from('chapters')
      .delete()
      .eq('id', chapter_id);

    if (error) {
      throw new Error(`Failed to delete chapter: ${error.message}`);
    }
  }

  async getByStoryId(story_id: string): Promise<Chapter[]> {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('story_id', story_id)
      .order('order_index', { ascending: true });

    if (error) {
      throw new Error(`Failed to get chapters by story: ${error.message}`);
    }

    return data;
  }
}
