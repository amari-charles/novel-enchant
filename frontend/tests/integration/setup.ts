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
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.ANON_KEY;

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
 * Get or create a test user for integration tests
 * Uses existing test user from environment variables
 * Returns user ID and auth session
 *
 * @param client - Optional Supabase client to authenticate (recommended for tests)
 * @param email - Optional email override
 * @param password - Optional password override
 */
export async function createTestUser(
  client?: SupabaseClient<Database>,
  email?: string,
  password?: string
): Promise<{ userId: string; session: unknown }> {
  const authClient = client || getTestSupabaseClient();
  const testEmail = email || process.env.TEST_USER_EMAIL;
  const testPassword = password || process.env.TEST_USER_PASSWORD;

  if (!testEmail || !testPassword) {
    throw new Error(
      'Missing test user credentials. Set TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables.'
    );
  }

  // Try to sign in with existing user
  const { data, error } = await authClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (error) {
    throw new Error(`Failed to sign in test user: ${error.message}`);
  }

  if (!data.user) {
    throw new Error('Failed to sign in test user: No user returned');
  }

  return {
    userId: data.user.id,
    session: data.session,
  };
}

/**
 * Clean up test data for a specific user
 * Deletes all stories and related data, but keeps the user account
 * Also cleans up old test data (created more than 1 hour ago)
 */
export async function cleanupTestUser(userId: string): Promise<void> {
  const client = getTestSupabaseClient();

  // Delete all stories for this user (cascades to chapters, anchors, enhancements, media)
  const { error } = await client
    .from('stories')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error(`Failed to cleanup test data for user ${userId}:`, error);
  }
}

/**
 * Clean up stale test data (older than 1 hour)
 * Should be run periodically to prevent test data accumulation
 */
export async function cleanupStaleTestData(): Promise<void> {
  const client = getTestSupabaseClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // Get current test user
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    console.warn('No authenticated user, skipping stale data cleanup');
    return;
  }

  // Delete old stories from test user (cascades to all related data)
  const { error } = await client
    .from('stories')
    .delete()
    .eq('user_id', user.id)
    .lt('created_at', oneHourAgo);

  if (error) {
    console.error('Failed to cleanup stale test data:', error);
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
