/**
 * User Repository Interface
 * Data access layer for user operations
 */

import type { Database } from '@/lib/supabase';

// Type aliases from database schema
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export interface IUserRepository {
  /**
   * Get a user by ID
   * @param user_id - The user ID
   * @returns The user if found, null otherwise
   */
  get(user_id: string): Promise<User | null>;

  /**
   * Create a new user
   * @param user - The user data to create
   * @returns The created user
   */
  create(user: UserInsert): Promise<User>;

  /**
   * Update an existing user
   * @param user_id - The user ID
   * @param updates - The fields to update
   * @returns The updated user
   */
  update(user_id: string, updates: UserUpdate): Promise<User>;

  /**
   * Delete a user
   * @param user_id - The user ID
   */
  delete(user_id: string): Promise<void>;

  /**
   * Check if a user exists
   * @param user_id - The user ID
   * @returns True if user exists, false otherwise
   */
  exists(user_id: string): Promise<boolean>;
}
