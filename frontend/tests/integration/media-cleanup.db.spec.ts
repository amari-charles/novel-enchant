/**
 * Media Cleanup - Real Database Integration Tests
 * Tests the actual database trigger for media cleanup when enhancements are deleted
 *
 * IMPORTANT: These tests require a running local Supabase instance with migrations applied
 * Run: supabase start && supabase db reset
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/lib/supabase';
import {
  getTestSupabaseClient,
  createTestUser,
  cleanupTestUser,
  withTestTransaction,
} from './setup';

describe('Media Cleanup - Database Integration', () => {
  let client: SupabaseClient<Database>;
  let testUserId: string;

  beforeAll(async () => {
    client = getTestSupabaseClient();

    // Create a test user for all tests
    const { userId } = await createTestUser();
    testUserId = userId;
  });

  afterAll(async () => {
    // Cleanup test user and all related data
    await cleanupTestUser(testUserId);
  });

  test('database trigger deletes media when enhancement is deleted', async () => {
    // 1. Create a story
    const { data: story, error: storyError } = await client
      .from('stories')
      .insert({
        user_id: testUserId,
        title: 'Test Story for Media Cleanup',
        description: 'Testing database trigger'
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
        title: 'Test Chapter',
        text_content: 'Test content for chapter',
        order_index: 0
      })
      .select()
      .single();

    expect(chapterError).toBeNull();
    expect(chapter).toBeDefined();

    // 3. Create an anchor
    const { data: anchor, error: anchorError } = await client
      .from('anchors')
      .insert({
        chapter_id: chapter!.id,
        after_paragraph_index: 0
      })
      .select()
      .single();

    expect(anchorError).toBeNull();
    expect(anchor).toBeDefined();

    // 4. Create a media file
    const { data: media, error: mediaError } = await client
      .from('media')
      .insert({
        user_id: testUserId,
        url: 'https://example.com/test-image.png',
        storage_path: 'test/image.png',
        media_type: 'image',
        file_size: 1024,
        mime_type: 'image/png'
      })
      .select()
      .single();

    expect(mediaError).toBeNull();
    expect(media).toBeDefined();

    // 5. Create an enhancement linked to the media
    const { data: enhancement, error: enhancementError } = await client
      .from('enhancements')
      .insert({
        anchor_id: anchor!.id,
        chapter_id: chapter!.id,
        enhancement_type: 'ai_image',
        media_id: media!.id,
        status: 'completed'
      })
      .select()
      .single();

    expect(enhancementError).toBeNull();
    expect(enhancement).toBeDefined();

    // 6. Set media ownership (this is what the application does)
    const { error: updateError } = await client
      .from('media')
      .update({
        owner_type: 'enhancement',
        owner_id: enhancement!.id
      })
      .eq('id', media!.id);

    expect(updateError).toBeNull();

    // 7. Verify media exists before deletion
    const { data: mediaBeforeDelete, error: mediaBeforeError } = await client
      .from('media')
      .select()
      .eq('id', media!.id);

    expect(mediaBeforeError).toBeNull();
    expect(mediaBeforeDelete).toHaveLength(1);

    // 8. Delete the enhancement
    const { error: deleteEnhancementError } = await client
      .from('enhancements')
      .delete()
      .eq('id', enhancement!.id);

    expect(deleteEnhancementError).toBeNull();

    // 9. CRITICAL: Verify media was deleted by the database trigger
    const { data: mediaAfterDelete, error: mediaAfterError } = await client
      .from('media')
      .select()
      .eq('id', media!.id);

    expect(mediaAfterError).toBeNull();
    expect(mediaAfterDelete).toHaveLength(0); // Media should be deleted!
  });

  test('database trigger only deletes media owned by deleted enhancement', async () => {
    // 1. Create story and chapter
    const { data: story } = await client
      .from('stories')
      .insert({
        user_id: testUserId,
        title: 'Test Story for Selective Cleanup'
      })
      .select()
      .single();

    const { data: chapter } = await client
      .from('chapters')
      .insert({
        story_id: story!.id,
        text_content: 'Test content',
        order_index: 0
      })
      .select()
      .single();

    // 2. Create two anchors
    const { data: anchor1 } = await client
      .from('anchors')
      .insert({
        chapter_id: chapter!.id,
        after_paragraph_index: 0
      })
      .select()
      .single();

    const { data: anchor2 } = await client
      .from('anchors')
      .insert({
        chapter_id: chapter!.id,
        after_paragraph_index: 1
      })
      .select()
      .single();

    // 3. Create two media files
    const { data: media1 } = await client
      .from('media')
      .insert({
        user_id: testUserId,
        url: 'https://example.com/image1.png',
        storage_path: 'test/image1.png',
        media_type: 'image'
      })
      .select()
      .single();

    const { data: media2 } = await client
      .from('media')
      .insert({
        user_id: testUserId,
        url: 'https://example.com/image2.png',
        storage_path: 'test/image2.png',
        media_type: 'image'
      })
      .select()
      .single();

    // 4. Create two enhancements
    const { data: enhancement1 } = await client
      .from('enhancements')
      .insert({
        anchor_id: anchor1!.id,
        chapter_id: chapter!.id,
        enhancement_type: 'ai_image',
        media_id: media1!.id,
        status: 'completed'
      })
      .select()
      .single();

    const { data: enhancement2 } = await client
      .from('enhancements')
      .insert({
        anchor_id: anchor2!.id,
        chapter_id: chapter!.id,
        enhancement_type: 'ai_image',
        media_id: media2!.id,
        status: 'completed'
      })
      .select()
      .single();

    // 5. Set ownership for both media files
    await client
      .from('media')
      .update({ owner_type: 'enhancement', owner_id: enhancement1!.id })
      .eq('id', media1!.id);

    await client
      .from('media')
      .update({ owner_type: 'enhancement', owner_id: enhancement2!.id })
      .eq('id', media2!.id);

    // 6. Delete only the first enhancement
    await client
      .from('enhancements')
      .delete()
      .eq('id', enhancement1!.id);

    // 7. Verify only media1 was deleted, media2 still exists
    const { data: media1After } = await client
      .from('media')
      .select()
      .eq('id', media1!.id);

    const { data: media2After } = await client
      .from('media')
      .select()
      .eq('id', media2!.id);

    expect(media1After).toHaveLength(0); // Deleted
    expect(media2After).toHaveLength(1); // Still exists
  });

  test('cascade delete from anchor deletes enhancements and media', async () => {
    // This tests the full cascade: anchor → enhancement → media

    // 1. Create story, chapter, anchor
    const { data: story } = await client
      .from('stories')
      .insert({
        user_id: testUserId,
        title: 'Test Story for Cascade Delete'
      })
      .select()
      .single();

    const { data: chapter } = await client
      .from('chapters')
      .insert({
        story_id: story!.id,
        text_content: 'Test content',
        order_index: 0
      })
      .select()
      .single();

    const { data: anchor } = await client
      .from('anchors')
      .insert({
        chapter_id: chapter!.id,
        after_paragraph_index: 0
      })
      .select()
      .single();

    // 2. Create media
    const { data: media } = await client
      .from('media')
      .insert({
        user_id: testUserId,
        url: 'https://example.com/cascade-test.png',
        storage_path: 'test/cascade.png',
        media_type: 'image'
      })
      .select()
      .single();

    // 3. Create enhancement
    const { data: enhancement } = await client
      .from('enhancements')
      .insert({
        anchor_id: anchor!.id,
        chapter_id: chapter!.id,
        enhancement_type: 'ai_image',
        media_id: media!.id,
        status: 'completed'
      })
      .select()
      .single();

    // 4. Set ownership
    await client
      .from('media')
      .update({ owner_type: 'enhancement', owner_id: enhancement!.id })
      .eq('id', media!.id);

    // 5. Delete the anchor (should cascade to enhancement, then trigger to media)
    await client
      .from('anchors')
      .delete()
      .eq('id', anchor!.id);

    // 6. Verify enhancement was cascade deleted
    const { data: enhancementAfter } = await client
      .from('enhancements')
      .select()
      .eq('id', enhancement!.id);

    expect(enhancementAfter).toHaveLength(0); // Cascade deleted

    // 7. Verify media was trigger deleted
    const { data: mediaAfter } = await client
      .from('media')
      .select()
      .eq('id', media!.id);

    expect(mediaAfter).toHaveLength(0); // Trigger deleted
  });

  test('media without ownership is not deleted', async () => {
    // Create media without an owner - should not be deleted

    const { data: media } = await client
      .from('media')
      .insert({
        user_id: testUserId,
        url: 'https://example.com/orphan.png',
        storage_path: 'test/orphan.png',
        media_type: 'image'
      })
      .select()
      .single();

    // Create an enhancement without linking to this media
    const { data: story } = await client
      .from('stories')
      .insert({
        user_id: testUserId,
        title: 'Test Story'
      })
      .select()
      .single();

    const { data: chapter } = await client
      .from('chapters')
      .insert({
        story_id: story!.id,
        text_content: 'Test',
        order_index: 0
      })
      .select()
      .single();

    const { data: anchor } = await client
      .from('anchors')
      .insert({
        chapter_id: chapter!.id,
        after_paragraph_index: 0
      })
      .select()
      .single();

    const { data: enhancement } = await client
      .from('enhancements')
      .insert({
        anchor_id: anchor!.id,
        chapter_id: chapter!.id,
        enhancement_type: 'animation', // No media needed
        media_id: null,
        status: 'completed'
      })
      .select()
      .single();

    // Delete the enhancement
    await client
      .from('enhancements')
      .delete()
      .eq('id', enhancement!.id);

    // Orphan media should still exist
    const { data: mediaAfter } = await client
      .from('media')
      .select()
      .eq('id', media!.id);

    expect(mediaAfter).toHaveLength(1); // Still exists!
  });
});
