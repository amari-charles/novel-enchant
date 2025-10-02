/**
 * Media Repository
 * Data access layer for media file operations
 */

import { supabase } from '../../../lib/supabase';
import type { IMediaRepository, Media, MediaInsert, MediaUpdate } from './IMediaRepository';

export class MediaRepository implements IMediaRepository {
  async get(media_id: string): Promise<Media | null> {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('id', media_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get media: ${error.message}`);
    }

    return data;
  }

  async create(media: MediaInsert): Promise<Media> {
    const { data, error } = await supabase
      .from('media')
      .insert(media)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create media: ${error.message}`);
    }

    return data;
  }

  async update(media_id: string, updates: MediaUpdate): Promise<Media> {
    const { data, error } = await supabase
      .from('media')
      .update(updates)
      .eq('id', media_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update media: ${error.message}`);
    }

    return data;
  }

  async delete(media_id: string): Promise<void> {
    const { error } = await supabase
      .from('media')
      .delete()
      .eq('id', media_id);

    if (error) {
      throw new Error(`Failed to delete media: ${error.message}`);
    }
  }

  async getByUserId(user_id: string): Promise<Media[]> {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get media by user: ${error.message}`);
    }

    return data;
  }

  async getByType(user_id: string, media_type: 'image' | 'audio' | 'video'): Promise<Media[]> {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('user_id', user_id)
      .eq('media_type', media_type)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get media by type: ${error.message}`);
    }

    return data;
  }
}
