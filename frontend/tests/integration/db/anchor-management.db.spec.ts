/**
 * Anchor Management - Real Database Integration Tests
 * Tests the paragraph-based anchor system with actual database operations
 *
 * IMPORTANT: These tests require a running Supabase instance with migrations applied
 * Run: supabase start && supabase db reset (or connect to remote with proper env vars)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { afterAll,beforeAll, describe, expect, test } from 'vitest';

import type { Database } from '../../src/lib/supabase';
import {
  cleanupStaleTestData,
  cleanupTestUser,
  createTestUser,
  getTestSupabaseClient,
} from './setup';

describe('Anchor Management - Database Integration', () => {
  let client: SupabaseClient<Database>;
  let testUserId: string;

  beforeAll(async () => {
    client = getTestSupabaseClient();

    // Sign in as test user for all tests (authenticate this client instance)
    const { userId } = await createTestUser(client);
    testUserId = userId;

    // Clean up any stale test data from previous runs
    await cleanupStaleTestData();
  });

  afterAll(async () => {
    // Cleanup test data (but keep user account for reuse)
    await cleanupTestUser(testUserId);
  });

  test('creates anchor at specific text position', async () => {
    // 1. Create a story
    const { data: story, error: storyError } = await client
      .from('stories')
      .insert({
        user_id: testUserId,
        title: 'Test Story for Anchors',
      })
      .select()
      .single();

    expect(storyError).toBeNull();
    expect(story).toBeDefined();

    // 2. Create a chapter
    const { data: chapter, error: chapterError } = await client
      .from('chapters')
      .insert({
        story_id: story!.id,
        title: 'Chapter 1',
        text_content: 'The quick brown fox jumps over the lazy dog.',
        order_index: 0,
      })
      .select()
      .single();

    expect(chapterError).toBeNull();
    expect(chapter).toBeDefined();

    // 3. Create an anchor at position 10 (after "The quick ")
    const { data: anchor, error: anchorError } = await client
      .from('anchors')
      .insert({
        chapter_id: chapter!.id,
        after_paragraph_index: 0,
      })
      .select()
      .single();

    expect(anchorError).toBeNull();
    expect(anchor).toBeDefined();
    expect(anchor!.after_paragraph_index).toBe(0);
  });

  test('validates anchor position is non-negative', async () => {
    // 1. Create story and chapter
    const { data: story } = await client
      .from('stories')
      .insert({
        user_id: testUserId,
        title: 'Test Story',
      })
      .select()
      .single();

    const { data: chapter } = await client
      .from('chapters')
      .insert({
        story_id: story!.id,
        text_content: 'Test content',
        order_index: 0,
      })
      .select()
      .single();

    // 2. Try to create anchor with negative position (should fail)
    const { error } = await client
      .from('anchors')
      .insert({
        chapter_id: chapter!.id,
        after_paragraph_index: -1,
      });

    expect(error).not.toBeNull();
    expect(error!.message).toContain('violates check constraint');
  });

  test('maintains anchor ordering within chapter', async () => {
    // 1. Create story and chapter
    const { data: story } = await client
      .from('stories')
      .insert({
        user_id: testUserId,
        title: 'Test Story',
      })
      .select()
      .single();

    const { data: chapter } = await client
      .from('chapters')
      .insert({
        story_id: story!.id,
        text_content: 'Paragraph 1.\n\nParagraph 2.\n\nParagraph 3.',
        order_index: 0,
      })
      .select()
      .single();

    // 2. Create anchors in different paragraphs
    await client.from('anchors').insert([
      { chapter_id: chapter!.id, after_paragraph_index: 2 },
      { chapter_id: chapter!.id, after_paragraph_index: 0 },
      { chapter_id: chapter!.id, after_paragraph_index: 1 },
    ]);

    // 3. Retrieve anchors ordered by paragraph
    const { data: anchors } = await client
      .from('anchors')
      .select()
      .eq('chapter_id', chapter!.id)
      .order('after_paragraph_index', { ascending: true });

    expect(anchors).toHaveLength(3);
    expect(anchors![0].after_paragraph_index).toBe(0);
    expect(anchors![1].after_paragraph_index).toBe(1);
    expect(anchors![2].after_paragraph_index).toBe(2);
  });

  test('cascade deletes anchors when chapter is deleted', async () => {
    // 1. Create story and chapter
    const { data: story } = await client
      .from('stories')
      .insert({
        user_id: testUserId,
        title: 'Test Story',
      })
      .select()
      .single();

    const { data: chapter } = await client
      .from('chapters')
      .insert({
        story_id: story!.id,
        text_content: 'Test content',
        order_index: 0,
      })
      .select()
      .single();

    // 2. Create anchor
    const { data: anchor } = await client
      .from('anchors')
      .insert({
        chapter_id: chapter!.id,
        after_paragraph_index: 0,
      })
      .select()
      .single();

    // 3. Delete the chapter
    await client
      .from('chapters')
      .delete()
      .eq('id', chapter!.id);

    // 4. Verify anchor was cascade deleted
    const { data: deletedAnchor } = await client
      .from('anchors')
      .select()
      .eq('id', anchor!.id);

    expect(deletedAnchor).toHaveLength(0);
  });

  test('allows multiple anchors at same position', async () => {
    // 1. Create story and chapter
    const { data: story } = await client
      .from('stories')
      .insert({
        user_id: testUserId,
        title: 'Test Story',
      })
      .select()
      .single();

    const { data: chapter } = await client
      .from('chapters')
      .insert({
        story_id: story!.id,
        text_content: 'Test content',
        order_index: 0,
      })
      .select()
      .single();

    // 2. Create two anchors at the same position
    const { data: anchors, error } = await client
      .from('anchors')
      .insert([
        { chapter_id: chapter!.id, after_paragraph_index: 0 },
        { chapter_id: chapter!.id, after_paragraph_index: 0 },
      ])
      .select();

    expect(error).toBeNull();
    expect(anchors).toHaveLength(2);
    expect(anchors![0].after_paragraph_index).toBe(0);
    expect(anchors![1].after_paragraph_index).toBe(0);
  });

  test('anchor persists through chapter text updates', async () => {
    // 1. Create story and chapter
    const { data: story } = await client
      .from('stories')
      .insert({
        user_id: testUserId,
        title: 'Test Story',
      })
      .select()
      .single();

    const { data: chapter } = await client
      .from('chapters')
      .insert({
        story_id: story!.id,
        text_content: 'Original text',
        order_index: 0,
      })
      .select()
      .single();

    // 2. Create anchor
    const { data: anchor } = await client
      .from('anchors')
      .insert({
        chapter_id: chapter!.id,
        after_paragraph_index: 0,
      })
      .select()
      .single();

    // 3. Update chapter text
    await client
      .from('chapters')
      .update({ text_content: 'Modified text content' })
      .eq('id', chapter!.id);

    // 4. Verify anchor still exists with same position
    const { data: persistedAnchor } = await client
      .from('anchors')
      .select()
      .eq('id', anchor!.id)
      .single();

    expect(persistedAnchor).toBeDefined();
    expect(persistedAnchor!.after_paragraph_index).toBe(0);
    // Note: In production, you'd want anchor position adjustment logic
  });
});
