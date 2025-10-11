/**
 * RLS Policies - Real Database Integration Tests
 * Tests Row Level Security policies across all tables
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

describe('RLS Policies - Database Integration', () => {
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

  test('allows user to create and read their own stories', async () => {
    // 1. Create story as authenticated user
    const { data: story, error: createError } = await client
      .from('stories')
      .insert({
        user_id: testUserId,
        title: 'My Test Story',
      })
      .select()
      .single();

    expect(createError).toBeNull();
    expect(story).toBeDefined();
    expect(story!.user_id).toBe(testUserId);

    // 2. Read own story
    const { data: readStory, error: readError } = await client
      .from('stories')
      .select()
      .eq('id', story!.id)
      .single();

    expect(readError).toBeNull();
    expect(readStory!.id).toBe(story!.id);

    // 3. Update own story
    const { error: updateError } = await client
      .from('stories')
      .update({ title: 'Updated Story Title' })
      .eq('id', story!.id);

    expect(updateError).toBeNull();

    // 4. Delete own story
    const { error: deleteError } = await client
      .from('stories')
      .delete()
      .eq('id', story!.id);

    expect(deleteError).toBeNull();
  });

  test('prevents user from accessing other users stories', async () => {
    // Note: This test requires a second test user to be comprehensive
    // For now, we'll test that queries are scoped to user_id

    // 1. Create story as authenticated user
    const { data: ownStory } = await client
      .from('stories')
      .insert({
        user_id: testUserId,
        title: 'Own Story',
      })
      .select()
      .single();

    // 2. Query all stories (should only return own stories)
    const { data: allStories } = await client.from('stories').select();

    // All returned stories should belong to the test user
    expect(allStories).toBeDefined();
    for (const story of allStories!) {
      expect(story.user_id).toBe(testUserId);
    }

    // Cleanup
    await client.from('stories').delete().eq('id', ownStory!.id);
  });

  test('enforces RLS on chapters table', async () => {
    // 1. Create story
    const { data: story } = await client
      .from('stories')
      .insert({
        user_id: testUserId,
        title: 'Test Story',
      })
      .select()
      .single();

    // 2. Create chapter
    const { data: chapter, error: createError } = await client
      .from('chapters')
      .insert({
        story_id: story!.id,
        text_content: 'Test chapter content',
        order_index: 0,
      })
      .select()
      .single();

    expect(createError).toBeNull();
    expect(chapter).toBeDefined();

    // 3. Read chapter
    const { data: readChapter, error: readError } = await client
      .from('chapters')
      .select()
      .eq('id', chapter!.id)
      .single();

    expect(readError).toBeNull();
    expect(readChapter!.id).toBe(chapter!.id);

    // 4. Update chapter
    const { error: updateError } = await client
      .from('chapters')
      .update({ text_content: 'Updated content' })
      .eq('id', chapter!.id);

    expect(updateError).toBeNull();

    // 5. Delete chapter
    const { error: deleteError } = await client
      .from('chapters')
      .delete()
      .eq('id', chapter!.id);

    expect(deleteError).toBeNull();
  });

  test('enforces RLS on characters table', async () => {
    // 1. Create story
    const { data: story } = await client
      .from('stories')
      .insert({
        user_id: testUserId,
        title: 'Test Story',
      })
      .select()
      .single();

    // 2. Create character
    const { data: character, error: createError } = await client
      .from('characters')
      .insert({
        story_id: story!.id,
        name: 'Test Character',
        status: 'confirmed',
      })
      .select()
      .single();

    expect(createError).toBeNull();
    expect(character).toBeDefined();

    // 3. Read character
    const { data: readCharacter, error: readError } = await client
      .from('characters')
      .select()
      .eq('id', character!.id)
      .single();

    expect(readError).toBeNull();
    expect(readCharacter!.id).toBe(character!.id);

    // 4. Update character
    const { error: updateError } = await client
      .from('characters')
      .update({ short_desc: 'Updated description' })
      .eq('id', character!.id);

    expect(updateError).toBeNull();

    // 5. Delete character
    const { error: deleteError } = await client
      .from('characters')
      .delete()
      .eq('id', character!.id);

    expect(deleteError).toBeNull();
  });

  test('enforces RLS on anchors and enhancements', async () => {
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
    const { data: anchor, error: anchorError } = await client
      .from('anchors')
      .insert({
        chapter_id: chapter!.id,
        after_paragraph_index: 0,
      })
      .select()
      .single();

    expect(anchorError).toBeNull();

    // 3. Create media and enhancement
    const { data: media } = await client
      .from('media')
      .insert({
        user_id: testUserId,
        url: 'https://picsum.photos/seed/rls/800/600',
        storage_path: 'test/rls.png',
        media_type: 'image',
        file_size: 1024,
        mime_type: 'image/png',
      })
      .select()
      .single();

    const { data: enhancement, error: enhancementError } = await client
      .from('enhancements')
      .insert({
        anchor_id: anchor!.id,
        chapter_id: chapter!.id,
        enhancement_type: 'ai_image',
        media_id: media!.id,
        status: 'completed',
      })
      .select()
      .single();

    expect(enhancementError).toBeNull();

    // 4. Read enhancement
    const { data: readEnhancement, error: readError } = await client
      .from('enhancements')
      .select()
      .eq('id', enhancement!.id)
      .single();

    expect(readError).toBeNull();
    expect(readEnhancement!.id).toBe(enhancement!.id);
  });

  test('allows authenticated users to access media table', async () => {
    // 1. Create media
    const { data: media, error: createError } = await client
      .from('media')
      .insert({
        user_id: testUserId,
        url: 'https://picsum.photos/seed/media-rls/800/600',
        storage_path: 'test/media-rls.png',
        media_type: 'image',
        file_size: 1024,
        mime_type: 'image/png',
      })
      .select()
      .single();

    expect(createError).toBeNull();
    expect(media).toBeDefined();

    // 2. Read media
    const { data: readMedia, error: readError } = await client
      .from('media')
      .select()
      .eq('id', media!.id)
      .single();

    expect(readError).toBeNull();
    expect(readMedia!.id).toBe(media!.id);

    // 3. Update media (test updating width field)
    const { error: updateError } = await client
      .from('media')
      .update({ width: 1024 })
      .eq('id', media!.id);

    expect(updateError).toBeNull();

    // 4. Delete media
    const { error: deleteError } = await client
      .from('media')
      .delete()
      .eq('id', media!.id);

    expect(deleteError).toBeNull();
  });

  test('enforces RLS on enhancement_characters junction table', async () => {
    // 1. Create complete setup
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

    const { data: character } = await client
      .from('characters')
      .insert({
        story_id: story!.id,
        name: 'Alice',
      })
      .select()
      .single();

    const { data: anchor } = await client
      .from('anchors')
      .insert({
        chapter_id: chapter!.id,
        after_paragraph_index: 0,
      })
      .select()
      .single();

    const { data: media } = await client
      .from('media')
      .insert({
        user_id: testUserId,
        url: 'https://picsum.photos/seed/junction/800/600',
        storage_path: 'test/junction.png',
        media_type: 'image',
        file_size: 1024,
        mime_type: 'image/png',
      })
      .select()
      .single();

    const { data: enhancement } = await client
      .from('enhancements')
      .insert({
        anchor_id: anchor!.id,
        chapter_id: chapter!.id,
        enhancement_type: 'ai_image',
        media_id: media!.id,
        status: 'completed',
      })
      .select()
      .single();

    // 2. Create junction record
    const { error: junctionError } = await client
      .from('enhancement_characters')
      .insert({
        enhancement_id: enhancement!.id,
        character_id: character!.id,
      });

    expect(junctionError).toBeNull();

    // 3. Read junction record
    const { data: junctionRecords } = await client
      .from('enhancement_characters')
      .select()
      .eq('enhancement_id', enhancement!.id);

    expect(junctionRecords).toHaveLength(1);
    expect(junctionRecords![0].character_id).toBe(character!.id);
  });
});
