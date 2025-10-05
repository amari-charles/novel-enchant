/**
 * Storage Bucket - Real Database Integration Tests
 * Tests Supabase Storage operations for enhancement images (no real AI image generation)
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

describe('Storage Bucket - Database Integration', () => {
  let client: SupabaseClient<Database>;
  let testUserId: string;

  beforeAll(async () => {
    client = getTestSupabaseClient();

    // Sign in as test user for all tests (authenticate this client instance)
    const { userId } = await createTestUser(client);
    testUserId = userId;

    // Clean up any stale test data from previous runs
    await cleanupStaleTestData();

    // Clean up any stale storage files from previous runs
    const { data: existingFiles } = await client.storage
      .from('enhancements')
      .list(testUserId);

    if (existingFiles && existingFiles.length > 0) {
      const filePaths = existingFiles.map(f => `${testUserId}/${f.name}`);
      await client.storage.from('enhancements').remove(filePaths);
    }
  });

  afterAll(async () => {
    // Cleanup test data (but keep user account for reuse)
    await cleanupTestUser(testUserId);
  });

  test('uploads image to enhancements bucket', async () => {
    // 1. Create test image as ArrayBuffer (File/Blob don't work in jsdom)
    const testImageData = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    ).buffer;

    // 2. Upload to enhancements bucket (use user-based folder structure)
    const fileName = `${testUserId}/test-${Date.now()}.png`;
    const { data, error } = await client.storage
      .from('enhancements')
      .upload(fileName, testImageData, {
        contentType: 'image/png',
      });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.path).toBe(fileName);

    // 3. Verify file exists (list within user folder)
    const { data: files } = await client.storage
      .from('enhancements')
      .list(testUserId);

    expect(files).toHaveLength(1);
    expect(files![0].name).toContain('test-');

    // 4. Cleanup - delete test file
    await client.storage.from('enhancements').remove([fileName]);
  }, 60000);

  test('generates public URL for uploaded image', async () => {
    // 1. Upload test image (use ArrayBuffer for jsdom compatibility)
    const testImageData = Buffer.from('test image content').buffer;
    const fileName = `${testUserId}/test-public-${Date.now()}.png`;

    await client.storage.from('enhancements').upload(fileName, testImageData, {
      contentType: 'image/png',
    });

    // 2. Get public URL
    const { data } = client.storage.from('enhancements').getPublicUrl(fileName);

    expect(data.publicUrl).toBeDefined();
    expect(data.publicUrl).toContain('enhancements');
    expect(data.publicUrl).toContain(fileName);

    // 3. Cleanup
    await client.storage.from('enhancements').remove([fileName]);
  }, 60000);

  test('deletes image from storage when media record is deleted', async () => {
    // 1. Upload test image (use ArrayBuffer for jsdom compatibility)
    const testImageData = Buffer.from('test image').buffer;
    const fileName = `${testUserId}/test-delete-${Date.now()}.png`;
    await client.storage.from('enhancements').upload(fileName, testImageData, {
      contentType: 'image/png',
    });

    // 2. Create media record with storage path
    const { data: media } = await client
      .from('media')
      .insert({
        user_id: testUserId,
        url: 'https://example.com/placeholder.png',
        storage_path: fileName,
        media_type: 'image',
        file_size: 1024,
        mime_type: 'image/png',
      })
      .select()
      .single();

    // 3. Verify file exists in storage (list within user folder)
    const { data: filesBefore } = await client.storage
      .from('enhancements')
      .list(testUserId);

    expect(filesBefore!.some(f => f.name.includes('test-delete-'))).toBe(true);

    // 4. Delete media record (should trigger automatic storage file deletion)
    await client.from('media').delete().eq('id', media!.id);

    // 5. Verify file was automatically deleted from storage by trigger
    const { data: filesAfter } = await client.storage
      .from('enhancements')
      .list(testUserId);

    expect(filesAfter!.some(f => f.name.includes('test-delete-'))).toBe(false);
  }, 60000);

  test('handles storage with media ownership flow', async () => {
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

    // 2. Upload image to storage (use ArrayBuffer for jsdom compatibility)
    const testImageData = Buffer.from('enhancement image').buffer;
    const fileName = `${testUserId}/enhancement-${Date.now()}.png`;
    const { data: uploadData } = await client.storage
      .from('enhancements')
      .upload(fileName, testImageData, {
        contentType: 'image/png',
      });

    expect(uploadData).toBeDefined();

    // 3. Get public URL
    const { data: urlData } = client.storage
      .from('enhancements')
      .getPublicUrl(fileName);

    // 4. Create media record with storage path
    const { data: media } = await client
      .from('media')
      .insert({
        user_id: testUserId,
        url: urlData.publicUrl,
        storage_path: fileName,
        media_type: 'image',
        file_size: 1024,
        mime_type: 'image/png',
      })
      .select()
      .single();

    // 5. Create enhancement with media
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

    // 6. Set media ownership
    await client
      .from('media')
      .update({
        owner_type: 'enhancement',
        owner_id: enhancement!.id,
      })
      .eq('id', media!.id);

    // 7. Verify complete setup
    const { data: verifyMedia } = await client
      .from('media')
      .select()
      .eq('id', media!.id)
      .single();

    expect(verifyMedia!.storage_path).toBe(fileName);
    expect(verifyMedia!.owner_type).toBe('enhancement');
    expect(verifyMedia!.owner_id).toBe(enhancement!.id);

    // 8. Delete enhancement (should cascade delete media and trigger storage cleanup)
    await client.from('enhancements').delete().eq('id', enhancement!.id);

    // 9. Verify media was deleted
    const { data: deletedMedia } = await client
      .from('media')
      .select()
      .eq('id', media!.id);

    expect(deletedMedia).toHaveLength(0);

    // 10. Verify storage file was automatically deleted by trigger
    const { data: deletedFiles } = await client.storage
      .from('enhancements')
      .list(testUserId);

    expect(deletedFiles!.some(f => f.name.includes('enhancement-'))).toBe(false);
  }, 60000);

  test('enforces storage bucket RLS policies', async () => {
    // 1. Upload as authenticated user (use ArrayBuffer for jsdom compatibility)
    const testImageData = Buffer.from('auth user image').buffer;
    const fileName = `${testUserId}/auth-test-${Date.now()}.png`;

    const { error: uploadError } = await client.storage
      .from('enhancements')
      .upload(fileName, testImageData, {
        contentType: 'image/png',
      });

    expect(uploadError).toBeNull();

    // 2. Try to delete with authenticated user (should succeed)
    const { error: deleteError } = await client.storage
      .from('enhancements')
      .remove([fileName]);

    expect(deleteError).toBeNull();
  }, 60000);

  test('lists files in enhancements bucket', async () => {
    // 1. Upload multiple test files (use ArrayBuffer for jsdom compatibility)
    const testImageData = Buffer.from('test').buffer;
    const fileNames = [
      `${testUserId}/list-test-1-${Date.now()}.png`,
      `${testUserId}/list-test-2-${Date.now()}.png`,
      `${testUserId}/list-test-3-${Date.now()}.png`,
    ];

    for (const fileName of fileNames) {
      await client.storage.from('enhancements').upload(fileName, testImageData, {
        contentType: 'image/png',
      });
    }

    // 2. List files (list within user folder)
    const { data: files, error } = await client.storage
      .from('enhancements')
      .list(testUserId);

    expect(error).toBeNull();
    expect(files!.length).toBeGreaterThanOrEqual(3);

    // 3. Verify file names contain list-test prefix
    const uploadedFileNames = files!.map((f) => f.name);
    expect(uploadedFileNames.filter(name => name.includes('list-test-')).length).toBeGreaterThanOrEqual(3);

    // 4. Cleanup
    await client.storage.from('enhancements').remove(fileNames);
  }, 60000);
});
