/**
 * Character Discovery - Real Database Integration Tests
 * Tests character extraction and storage with stub AI client (no real OpenAI calls)
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

describe('Character Discovery - Database Integration', () => {
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

  test('stores discovered characters in database', async () => {
    // 1. Create story
    const { data: story } = await client
      .from('stories')
      .insert({
        user_id: testUserId,
        title: 'Test Story',
      })
      .select()
      .single();

    // 2. Create characters (as would be discovered by StubTextAIClient)
    const { data: characters, error: characterError } = await client
      .from('characters')
      .insert([
        {
          story_id: story!.id,
          name: 'Alice',
          short_desc: 'The protagonist',
          status: 'confirmed',
        },
        {
          story_id: story!.id,
          name: 'Bob',
          short_desc: 'The antagonist',
          status: 'confirmed',
        },
      ])
      .select();

    expect(characterError).toBeNull();
    expect(characters).toHaveLength(2);
    expect(characters![0].name).toBe('Alice');
    expect(characters![1].name).toBe('Bob');
  });

  test('associates characters with enhancements', async () => {
    // 1. Create story, chapter, and anchor
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
        text_content: 'Alice and Bob went on an adventure.',
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

    // 2. Create characters
    const { data: alice } = await client
      .from('characters')
      .insert({
        story_id: story!.id,
        name: 'Alice',
        status: 'confirmed',
      })
      .select()
      .single();

    const { data: bob } = await client
      .from('characters')
      .insert({
        story_id: story!.id,
        name: 'Bob',
        status: 'confirmed',
      })
      .select()
      .single();

    // 3. Create enhancement
    const { data: media } = await client
      .from('media')
      .insert({
        user_id: testUserId,
        url: 'https://picsum.photos/seed/scene/800/600',
        storage_path: 'test/scene.png',
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

    // 4. Associate characters with enhancement
    const { error: associationError } = await client
      .from('enhancement_characters')
      .insert([
        {
          enhancement_id: enhancement!.id,
          character_id: alice!.id,
        },
        {
          enhancement_id: enhancement!.id,
          character_id: bob!.id,
        },
      ]);

    expect(associationError).toBeNull();

    // 5. Verify associations
    const { data: associations } = await client
      .from('enhancement_characters')
      .select('*, characters(*)')
      .eq('enhancement_id', enhancement!.id);

    expect(associations).toHaveLength(2);
    const characterNames = associations!.map(a => a.characters!.name).sort();
    expect(characterNames).toEqual(['Alice', 'Bob']);
  });

  test('cascade deletes character associations when enhancement is deleted', async () => {
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

    // 2. Create character and enhancement
    const { data: character } = await client
      .from('characters')
      .insert({
        story_id: story!.id,
        name: 'Charlie',
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

    // 3. Associate character with enhancement
    await client
      .from('enhancement_characters')
      .insert({
        enhancement_id: enhancement!.id,
        character_id: character!.id,
      });

    // 4. Delete enhancement
    await client
      .from('enhancements')
      .delete()
      .eq('id', enhancement!.id);

    // 5. Verify association was cascade deleted
    const { data: deletedAssociations } = await client
      .from('enhancement_characters')
      .select()
      .eq('enhancement_id', enhancement!.id);

    expect(deletedAssociations).toHaveLength(0);

    // 6. Verify character still exists (not cascade deleted)
    const { data: remainingCharacter } = await client
      .from('characters')
      .select()
      .eq('id', character!.id);

    expect(remainingCharacter).toHaveLength(1);
  });

  test('cascade deletes characters when story is deleted', async () => {
    // 1. Create story with characters
    const { data: story } = await client
      .from('stories')
      .insert({
        user_id: testUserId,
        title: 'Test Story',
      })
      .select()
      .single();

    const { data: characters } = await client
      .from('characters')
      .insert([
        {
          story_id: story!.id,
          name: 'David',
        },
        {
          story_id: story!.id,
          name: 'Eve',
        },
      ])
      .select();

    expect(characters).toHaveLength(2);

    // 2. Delete story
    await client
      .from('stories')
      .delete()
      .eq('id', story!.id);

    // 3. Verify characters were cascade deleted
    const { data: deletedCharacters } = await client
      .from('characters')
      .select()
      .eq('story_id', story!.id);

    expect(deletedCharacters).toHaveLength(0);
  });

  test('allows duplicate character names in different stories', async () => {
    // 1. Create two stories
    const { data: story1 } = await client
      .from('stories')
      .insert({
        user_id: testUserId,
        title: 'Story 1',
      })
      .select()
      .single();

    const { data: story2 } = await client
      .from('stories')
      .insert({
        user_id: testUserId,
        title: 'Story 2',
      })
      .select()
      .single();

    // 2. Create same character name in both stories
    const { data: characters, error } = await client
      .from('characters')
      .insert([
        {
          story_id: story1!.id,
          name: 'Alice',
          status: 'confirmed',
        },
        {
          story_id: story2!.id,
          name: 'Alice',
          status: 'candidate',
        },
      ])
      .select();

    expect(error).toBeNull();
    expect(characters).toHaveLength(2);
    expect(characters![0].name).toBe('Alice');
    expect(characters![1].name).toBe('Alice');
    expect(characters![0].status).toBe('confirmed');
    expect(characters![1].status).toBe('candidate');
  });

  test('updates character details', async () => {
    // 1. Create story and character
    const { data: story } = await client
      .from('stories')
      .insert({
        user_id: testUserId,
        title: 'Test Story',
      })
      .select()
      .single();

    const { data: character } = await client
      .from('characters')
      .insert({
        story_id: story!.id,
        name: 'Frank',
        short_desc: 'Initial description',
        status: 'candidate',
      })
      .select()
      .single();

    // 2. Update character details
    const { error: updateError } = await client
      .from('characters')
      .update({
        short_desc: 'Updated description with more details',
        status: 'confirmed',
      })
      .eq('id', character!.id);

    expect(updateError).toBeNull();

    // 3. Verify updates
    const { data: updatedCharacter } = await client
      .from('characters')
      .select()
      .eq('id', character!.id)
      .single();

    expect(updatedCharacter!.short_desc).toBe('Updated description with more details');
    expect(updatedCharacter!.status).toBe('confirmed');
    expect(updatedCharacter!.name).toBe('Frank'); // Name unchanged
  });
});
