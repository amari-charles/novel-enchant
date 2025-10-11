/**
 * User Repository
 * Handles user data access operations
 */

import type { IUserRepository, User, UserInsert, UserUpdate } from './user.repository.interface';
import type { SupabaseClient } from '@/lib/supabase';

export class UserRepository implements IUserRepository {
  constructor(private supabase: SupabaseClient) {}

  async get(user_id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw new Error(`Failed to get user: ${error.message}`);
    }

    return data;
  }

  async create(user: UserInsert): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .insert(user)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data;
  }

  async update(user_id: string, updates: UserUpdate): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', user_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return data;
  }

  async delete(user_id: string): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', user_id);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  async exists(user_id: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return false;
      }
      throw new Error(`Failed to check user existence: ${error.message}`);
    }

    return !!data;
  }
}
