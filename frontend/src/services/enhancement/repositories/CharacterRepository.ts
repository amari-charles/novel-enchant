/**
 * Character Repository
 * Data access layer for character operations
 */

import { supabase } from '../../../lib/supabase';
import type { ICharacterRepository, Character, CharacterInsert, CharacterUpdate } from './ICharacterRepository';

export class CharacterRepository implements ICharacterRepository {
  async get(character_id: string): Promise<Character | null> {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('id', character_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get character: ${error.message}`);
    }

    return data;
  }

  async create(character: CharacterInsert): Promise<Character> {
    const { data, error } = await supabase
      .from('characters')
      .insert(character)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create character: ${error.message}`);
    }

    return data;
  }

  async update(character_id: string, updates: CharacterUpdate): Promise<Character> {
    const { data, error } = await supabase
      .from('characters')
      .update(updates)
      .eq('id', character_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update character: ${error.message}`);
    }

    return data;
  }

  async delete(character_id: string): Promise<void> {
    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', character_id);

    if (error) {
      throw new Error(`Failed to delete character: ${error.message}`);
    }
  }

  async getByStoryId(story_id: string): Promise<Character[]> {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('story_id', story_id)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get characters by story: ${error.message}`);
    }

    return data;
  }

  async getByStatus(story_id: string, status: 'candidate' | 'confirmed' | 'ignored' | 'merged'): Promise<Character[]> {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('story_id', story_id)
      .eq('status', status)
      .order('confidence', { ascending: false });

    if (error) {
      throw new Error(`Failed to get characters by status: ${error.message}`);
    }

    return data;
  }
}
