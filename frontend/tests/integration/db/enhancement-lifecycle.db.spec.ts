/**
 * Enhancement Lifecycle - Real Database Integration Tests
 * Tests the complete enhancement workflow with stub image generation (no real AI calls)
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

describe('Enhancement Lifecycle - Database Integration', () => {
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

  test('creates enhancement with media ownership', async () => {
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
        text_content: 'Test content for enhancement',
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

    // 3. Create media (stub image URL)
    const { data: media } = await client
      .from('media')
      .insert({
        user_id: testUserId,
        url: 'https://picsum.photos/seed/test123/800/600',
        storage_path: 'test/test123.png',
        media_type: 'image',
        file_size: 1024,
        mime_type: 'image/png',
        owner_type: null,  // Will be set when enhancement is created
        owner_id: null,
      })
      .select()
      .single();

    // 4. Create enhancement
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
    expect(enhancement).toBeDefined();

    // 5. Set media ownership
    const { error: updateError } = await client
      .from('media')
      .update({
        owner_type: 'enhancement',
        owner_id: enhancement!.id,
      })
      .eq('id', media!.id);

    expect(updateError).toBeNull();

    // 6. Verify media ownership was set
    const { data: ownedMedia } = await client
      .from('media')
      .select()
      .eq('id', media!.id)
      .single();

    expect(ownedMedia!.owner_type).toBe('enhancement');
    expect(ownedMedia!.owner_id).toBe(enhancement!.id);
  });

  test('updates enhancement status', async () => {
    // 1. Create story, chapter, anchor
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
        url: 'https://picsum.photos/seed/test/800/600',
        storage_path: 'test/test.png',
        media_type: 'image',
        file_size: 1024,
        mime_type: 'image/png',
      })
      .select()
      .single();

    // 2. Create enhancement with 'generating' status
    const { data: enhancement } = await client
      .from('enhancements')
      .insert({
        anchor_id: anchor!.id,
        chapter_id: chapter!.id,
        enhancement_type: 'ai_image',
        media_id: media!.id,
        status: 'generating',
      })
      .select()
      .single();

    expect(enhancement!.status).toBe('generating');

    // 3. Update to 'completed' status
    const { error: updateError } = await client
      .from('enhancements')
      .update({ status: 'completed' })
      .eq('id', enhancement!.id);

    expect(updateError).toBeNull();

    // 4. Verify status was updated
    const { data: updatedEnhancement } = await client
      .from('enhancements')
      .select()
      .eq('id', enhancement!.id)
      .single();

    expect(updatedEnhancement!.status).toBe('completed');
  });

  test('retry enhancement by deleting and creating new one', async () => {
    // 1. Create story, chapter, anchor
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

    const { data: anchor } = await client
      .from('anchors')
      .insert({
        chapter_id: chapter!.id,
        after_paragraph_index: 0,
      })
      .select()
      .single();

    // 2. Create first enhancement with media
    const { data: media1 } = await client
      .from('media')
      .insert({
        user_id: testUserId,
        url: 'https://picsum.photos/seed/original/800/600',
        storage_path: 'test/original.png',
        media_type: 'image',
        file_size: 1024,
        mime_type: 'image/png',
      })
      .select()
      .single();

    const { data: enhancement1 } = await client
      .from('enhancements')
      .insert({
        anchor_id: anchor!.id,
        chapter_id: chapter!.id,
        enhancement_type: 'ai_image',
        media_id: media1!.id,
        status: 'completed',
      })
      .select()
      .single();

    // Set media ownership
    await client
      .from('media')
      .update({
        owner_type: 'enhancement',
        owner_id: enhancement1!.id,
      })
      .eq('id', media1!.id);

    // 3. Delete first enhancement (simulating retry)
    await client
      .from('enhancements')
      .delete()
      .eq('id', enhancement1!.id);

    // 4. Verify media was deleted by trigger
    const { data: deletedMedia } = await client
      .from('media')
      .select()
      .eq('id', media1!.id);

    expect(deletedMedia).toHaveLength(0);

    // 5. Create new enhancement (retry)
    const { data: media2 } = await client
      .from('media')
      .insert({
        user_id: testUserId,
        url: 'https://picsum.photos/seed/retry/800/600',
        storage_path: 'test/retry.png',
        media_type: 'image',
        file_size: 1024,
        mime_type: 'image/png',
      })
      .select()
      .single();

    const { data: enhancement2 } = await client
      .from('enhancements')
      .insert({
        anchor_id: anchor!.id,
        chapter_id: chapter!.id,
        enhancement_type: 'ai_image',
        media_id: media2!.id,
        status: 'completed',
      })
      .select()
      .single();

    expect(enhancement2).toBeDefined();

    // 6. Verify only new enhancement exists for this anchor
    const { data: anchorEnhancements } = await client
      .from('enhancements')
      .select()
      .eq('anchor_id', anchor!.id);

    expect(anchorEnhancements).toHaveLength(1);
    expect(anchorEnhancements![0].id).toBe(enhancement2!.id);
  });

  test('cascade deletes enhancement when anchor is deleted', async () => {
    // 1. Create story, chapter, anchor
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

    const { data: anchor } = await client
      .from('anchors')
      .insert({
        chapter_id: chapter!.id,
        after_paragraph_index: 0,
      })
      .select()
      .single();

    // 2. Create enhancement
    const { data: media } = await client
      .from('media')
      .insert({
        user_id: testUserId,
        url: 'https://picsum.photos/seed/test/800/600',
        storage_path: 'test/test.png',
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

    // 3. Delete anchor
    await client
      .from('anchors')
      .delete()
      .eq('id', anchor!.id);

    // 4. Verify enhancement was cascade deleted
    const { data: deletedEnhancement } = await client
      .from('enhancements')
      .select()
      .eq('id', enhancement!.id);

    expect(deletedEnhancement).toHaveLength(0);
  });

  test('allows multiple enhancements per anchor', async () => {
    // 1. Create story, chapter, anchor
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

    const { data: anchor } = await client
      .from('anchors')
      .insert({
        chapter_id: chapter!.id,
        after_paragraph_index: 0,
      })
      .select()
      .single();

    // 2. Create multiple enhancements for the same anchor
    const { data: media1 } = await client
      .from('media')
      .insert({
        user_id: testUserId,
        url: 'https://picsum.photos/seed/v1/800/600',
        storage_path: 'test/v1.png',
        media_type: 'image',
        file_size: 1024,
        mime_type: 'image/png',
      })
      .select()
      .single();

    const { data: media2 } = await client
      .from('media')
      .insert({
        user_id: testUserId,
        url: 'https://picsum.photos/seed/v2/800/600',
        storage_path: 'test/v2.png',
        media_type: 'image',
        file_size: 1024,
        mime_type: 'image/png',
      })
      .select()
      .single();

    await client.from('enhancements').insert([
      {
        anchor_id: anchor!.id,
        chapter_id: chapter!.id,
        enhancement_type: 'ai_image',
        media_id: media1!.id,
        status: 'completed',
      },
      {
        anchor_id: anchor!.id,
        chapter_id: chapter!.id,
        enhancement_type: 'ai_image',
        media_id: media2!.id,
        status: 'completed',
      },
    ]);

    // 3. Verify both enhancements exist
    const { data: enhancements } = await client
      .from('enhancements')
      .select()
      .eq('anchor_id', anchor!.id);

    expect(enhancements).toHaveLength(2);
  });
});
