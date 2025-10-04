/**
 * Integration Test Setup
 * Provides utilities for running tests against a real Supabase database
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/lib/supabase';

/**
 * Get Supabase client for integration tests
 * Uses local Supabase instance by default
 */
export function getTestSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseKey) {
    throw new Error(
      'Missing Supabase anon key for integration tests. ' +
      'Set VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY environment variable.'
    );
  }

  return createClient<Database>(supabaseUrl, supabaseKey);
}

/**
 * Get Supabase client with service role for admin operations
 * Used for test setup/teardown
 */
export function getTestSupabaseAdminClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      'Missing Supabase service role key for integration tests. ' +
      'Set SUPABASE_SERVICE_ROLE_KEY environment variable.'
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Create a test user for integration tests
 * Returns user ID and auth session
 */
export async function createTestUser(
  email?: string,
  password: string = 'test-password-123'
): Promise<{ userId: string; session: any }> {
  const client = getTestSupabaseClient();
  const testEmail = email || `test-${Date.now()}@example.com`;

  const { data, error } = await client.auth.signUp({
    email: testEmail,
    password,
  });

  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`);
  }

  if (!data.user) {
    throw new Error('Failed to create test user: No user returned');
  }

  return {
    userId: data.user.id,
    session: data.session,
  };
}

/**
 * Clean up test data for a specific user
 * Cascading deletes will remove all related data
 */
export async function cleanupTestUser(userId: string): Promise<void> {
  const adminClient = getTestSupabaseAdminClient();

  // Delete user (cascades to stories, chapters, anchors, enhancements, media)
  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) {
    console.error(`Failed to cleanup test user ${userId}:`, error);
  }
}

/**
 * Clean up all test users (emails starting with 'test-')
 * Use with caution! Only for integration test cleanup
 */
export async function cleanupAllTestUsers(): Promise<void> {
  const adminClient = getTestSupabaseAdminClient();

  // Get all users
  const { data: users, error: listError } = await adminClient.auth.admin.listUsers();

  if (listError) {
    console.error('Failed to list users for cleanup:', listError);
    return;
  }

  // Delete test users
  for (const user of users.users) {
    if (user.email?.startsWith('test-')) {
      await cleanupTestUser(user.id);
    }
  }
}

/**
 * Wait for a condition to be true (useful for async operations)
 * @param condition - Function that returns true when condition is met
 * @param timeout - Max time to wait in milliseconds
 * @param interval - Check interval in milliseconds
 */
export async function waitFor(
  condition: () => Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Helper to run a test within a transaction that rolls back
 * Note: Supabase doesn't support transactions via REST API,
 * so this creates and cleans up data instead
 */
export async function withTestTransaction<T>(
  fn: (userId: string, client: SupabaseClient<Database>) => Promise<T>
): Promise<T> {
  const { userId } = await createTestUser();
  const client = getTestSupabaseClient();

  try {
    return await fn(userId, client);
  } finally {
    await cleanupTestUser(userId);
  }
}
