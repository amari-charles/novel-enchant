/**
 * Story Repository
 * Data access layer for story operations
 */

import { supabase } from '@/lib/supabase';
import type { IStoryRepository, Story, StoryInsert, StoryUpdate } from './story.repository.interface';

export class StoryRepository implements IStoryRepository {
  async get(story_id: string): Promise<Story | null> {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('id', story_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to get story: ${error.message}`);
    }

    return data;
  }

  async create(story: StoryInsert): Promise<Story> {
    const { data, error } = await supabase
      .from('stories')
      .insert(story)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create story: ${error.message}`);
    }

    return data;
  }

  async update(story_id: string, updates: StoryUpdate): Promise<Story> {
    const { data, error } = await supabase
      .from('stories')
      .update(updates)
      .eq('id', story_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update story: ${error.message}`);
    }

    return data;
  }

  async delete(story_id: string): Promise<void> {
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', story_id);

    if (error) {
      throw new Error(`Failed to delete story: ${error.message}`);
    }
  }

  async getByUserId(user_id: string): Promise<Story[]> {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get stories by user: ${error.message}`);
    }

    return data;
  }
}
