/**
 * Cascade Deletes - Real Database Integration Tests
 * Tests cascade delete behavior across the entire schema
 *
 * IMPORTANT: These tests require a running Supabase instance with migrations applied
 * Run: supabase start && supabase db reset (or connect to remote with proper env vars)
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/lib/supabase';
import {
  getTestSupabaseClient,
  createTestUser,
  cleanupTestUser,
  cleanupStaleTestData,
} from './setup';

describe('Cascade Deletes - Database Integration', () => {
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

  test('deleting story cascades to chapters', async () => {
    // 1. Create story with chapters
    const { data: story } = await client
      .from('stories')
      .insert({
        user_id: testUserId,
        title: 'Test Story',
      })
      .select()
      .single();

    const { data: chapters } = await client
      .from('chapters')
      .insert([
        {
          story_id: story!.id,
          text_content: 'Chapter 1',
          order_index: 0,
        },
        {
          story_id: story!.id,
          text_content: 'Chapter 2',
          order_index: 1,
        },
      ])
      .select();

    expect(chapters).toHaveLength(2);

    const chapterIds = chapters!.map((c) => c.id);

    // 2. Delete story
    await client.from('stories').delete().eq('id', story!.id);

    // 3. Verify chapters were cascade deleted
    const { data: remainingChapters } = await client
      .from('chapters')
      .select()
      .in('id', chapterIds);

    expect(remainingChapters).toHaveLength(0);
  });

  test('deleting chapter cascades to anchors', async () => {
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

    // 2. Create anchors
    const { data: anchors } = await client
      .from('anchors')
      .insert([
        { chapter_id: chapter!.id, after_paragraph_index: 0 },
        { chapter_id: chapter!.id, after_paragraph_index: 1 },
      ])
      .select();

    expect(anchors).toHaveLength(2);

    const anchorIds = anchors!.map((a) => a.id);

    // 3. Delete chapter
    await client.from('chapters').delete().eq('id', chapter!.id);

    // 4. Verify anchors were cascade deleted
    const { data: remainingAnchors } = await client
      .from('anchors')
      .select()
      .in('id', anchorIds);

    expect(remainingAnchors).toHaveLength(0);
  });

  test('deleting anchor cascades to enhancements', async () => {
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

    // 2. Create enhancements
    const { data: media1 } = await client
      .from('media')
      .insert({
        user_id: testUserId,
        url: 'https://picsum.photos/seed/cascade1/800/600',
        storage_path: 'test/cascade1.png',
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
        url: 'https://picsum.photos/seed/cascade2/800/600',
        storage_path: 'test/cascade2.png',
        media_type: 'image',
        file_size: 1024,
        mime_type: 'image/png',
      })
      .select()
      .single();

    const { data: enhancements } = await client
      .from('enhancements')
      .insert([
        {
          anchor_id: anchor!.id,
        chapter_id: chapter!.id,
          media_id: media1!.id,
          enhancement_type: 'ai_image',
          status: 'completed',
        },
        {
          anchor_id: anchor!.id,
        chapter_id: chapter!.id,
          media_id: media2!.id,
          enhancement_type: 'ai_image',
          status: 'completed',
        },
      ])
      .select();

    expect(enhancements).toHaveLength(2);

    const enhancementIds = enhancements!.map((e) => e.id);

    // 3. Delete anchor
    await client.from('anchors').delete().eq('id', anchor!.id);

    // 4. Verify enhancements were cascade deleted
    const { data: remainingEnhancements } = await client
      .from('enhancements')
      .select()
      .in('id', enhancementIds);

    expect(remainingEnhancements).toHaveLength(0);
  });

  test('deleting enhancement cascades to enhancement_characters', async () => {
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

    const { data: characters } = await client
      .from('characters')
      .insert([
        { story_id: story!.id, name: 'Alice', status: 'confirmed' },
        { story_id: story!.id, name: 'Bob', status: 'confirmed' },
      ])
      .select();

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
        url: 'https://picsum.photos/seed/junction-cascade/800/600',
        storage_path: 'test/junction-cascade.png',
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
        media_id: media!.id,
        enhancement_type: 'ai_image',
        status: 'completed',
      })
      .select()
      .single();

    // 2. Create junction records
    await client.from('enhancement_characters').insert([
      {
        enhancement_id: enhancement!.id,
        character_id: characters![0].id,
      },
      {
        enhancement_id: enhancement!.id,
        character_id: characters![1].id,
      },
    ]);

    // 3. Verify junction records exist
    const { data: junctionsBefore } = await client
      .from('enhancement_characters')
      .select()
      .eq('enhancement_id', enhancement!.id);

    expect(junctionsBefore).toHaveLength(2);

    // 4. Delete enhancement
    await client.from('enhancements').delete().eq('id', enhancement!.id);

    // 5. Verify junction records were cascade deleted
    const { data: junctionsAfter } = await client
      .from('enhancement_characters')
      .select()
      .eq('enhancement_id', enhancement!.id);

    expect(junctionsAfter).toHaveLength(0);

    // 6. Verify characters still exist (not cascade deleted)
    const { data: remainingCharacters } = await client
      .from('characters')
      .select()
      .in(
        'id',
        characters!.map((c) => c.id)
      );

    expect(remainingCharacters).toHaveLength(2);
  });

  test('deleting story cascades through entire hierarchy', async () => {
    // This is the comprehensive cascade delete test
    // Story -> Chapters -> Anchors -> Enhancements -> Enhancement_Characters
    // Story -> Characters

    // 1. Create complete story structure
    const { data: story } = await client
      .from('stories')
      .insert({
        user_id: testUserId,
        title: 'Complete Test Story',
      })
      .select()
      .single();

    const { data: chapters } = await client
      .from('chapters')
      .insert([
        {
          story_id: story!.id,
          text_content: 'Chapter 1 content',
          order_index: 0,
        },
        {
          story_id: story!.id,
          text_content: 'Chapter 2 content',
          order_index: 1,
        },
      ])
      .select();

    const { data: characters } = await client
      .from('characters')
      .insert([
        { story_id: story!.id, name: 'Protagonist', status: 'confirmed' },
        { story_id: story!.id, name: 'Antagonist', status: 'confirmed' },
      ])
      .select();

    const { data: anchors } = await client
      .from('anchors')
      .insert([
        { chapter_id: chapters![0].id, after_paragraph_index: 0 },
        { chapter_id: chapters![1].id, after_paragraph_index: 0 },
      ])
      .select();

    const { data: media } = await client
      .from('media')
      .insert([
        {
          user_id: testUserId,
          url: 'https://picsum.photos/seed/complete1/800/600',
          storage_path: 'test/complete1.png',
          media_type: 'image',
          file_size: 1024,
          mime_type: 'image/png',
        },
        {
          user_id: testUserId,
          url: 'https://picsum.photos/seed/complete2/800/600',
          storage_path: 'test/complete2.png',
          media_type: 'image',
          file_size: 1024,
          mime_type: 'image/png',
        },
      ])
      .select();

    const { data: enhancements } = await client
      .from('enhancements')
      .insert([
        {
          chapter_id: chapters![0].id,
          anchor_id: anchors![0].id,
          media_id: media![0].id,
          enhancement_type: 'ai_image',
          status: 'completed',
        },
        {
          chapter_id: chapters![1].id,
          anchor_id: anchors![1].id,
          media_id: media![1].id,
          enhancement_type: 'ai_image',
          status: 'completed',
        },
      ])
      .select();

    await client.from('enhancement_characters').insert([
      {
        enhancement_id: enhancements![0].id,
        character_id: characters![0].id,
      },
      {
        enhancement_id: enhancements![1].id,
        character_id: characters![1].id,
      },
    ]);

    // 2. Collect all IDs for verification
    const chapterIds = chapters!.map((c) => c.id);
    const characterIds = characters!.map((c) => c.id);
    const anchorIds = anchors!.map((a) => a.id);
    const enhancementIds = enhancements!.map((e) => e.id);

    // 3. Delete the story
    await client.from('stories').delete().eq('id', story!.id);

    // 4. Verify cascade deletes
    const { data: remainingChapters } = await client
      .from('chapters')
      .select()
      .in('id', chapterIds);
    expect(remainingChapters).toHaveLength(0);

    const { data: remainingCharacters } = await client
      .from('characters')
      .select()
      .in('id', characterIds);
    expect(remainingCharacters).toHaveLength(0);

    const { data: remainingAnchors } = await client
      .from('anchors')
      .select()
      .in('id', anchorIds);
    expect(remainingAnchors).toHaveLength(0);

    const { data: remainingEnhancements } = await client
      .from('enhancements')
      .select()
      .in('id', enhancementIds);
    expect(remainingEnhancements).toHaveLength(0);

    const { data: remainingJunctions } = await client
      .from('enhancement_characters')
      .select()
      .in('enhancement_id', enhancementIds);
    expect(remainingJunctions).toHaveLength(0);
  });

  test('deleting enhancement with owned media cascades to media via trigger', async () => {
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

    // 2. Create media
    const { data: media } = await client
      .from('media')
      .insert({
        user_id: testUserId,
        url: 'https://picsum.photos/seed/owned/800/600',
        storage_path: 'test/owned.png',
        media_type: 'image',
        file_size: 1024,
        mime_type: 'image/png',
      })
      .select()
      .single();

    // 3. Create enhancement
    const { data: enhancement } = await client
      .from('enhancements')
      .insert({
        anchor_id: anchor!.id,
        chapter_id: chapter!.id,
        media_id: media!.id,
        enhancement_type: 'ai_image',
        status: 'completed',
      })
      .select()
      .single();

    // 4. Set media ownership
    await client
      .from('media')
      .update({
        owner_type: 'enhancement',
        owner_id: enhancement!.id,
      })
      .eq('id', media!.id);

    // 5. Delete enhancement
    await client.from('enhancements').delete().eq('id', enhancement!.id);

    // 6. Verify media was deleted by trigger
    const { data: remainingMedia } = await client
      .from('media')
      .select()
      .eq('id', media!.id);

    expect(remainingMedia).toHaveLength(0);
  });
});
