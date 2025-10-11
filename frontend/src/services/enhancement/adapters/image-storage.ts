/**
 * Image Storage
 * Handles uploading and retrieving images from Supabase Storage
 * Keeps storage bucket and media table in sync
 */

import type { IMediaRepository } from '@/lib/repositories/media.repository.interface';
import { supabase } from '@/lib/supabase';

import type { IImageStorage, MediaOwnerType } from './i-image-storage';

/**
 * Default bucket name for enhancement images
 */
const DEFAULT_BUCKET = 'enhancements';

export class ImageStorage implements IImageStorage {
  constructor(
    private mediaRepository: IMediaRepository,
    private userId: string,
    private bucketName: string = DEFAULT_BUCKET
  ) {}

  /**
   * Upload an image to storage and create media record
   * @param imageBlob - The image file/blob to upload
   * @param path - The storage path (e.g., "enhancements/{chapterId}/{anchorId}.png")
   * @param ownerType - Optional type of entity that owns this media
   * @param ownerId - Optional ID of the owning entity
   * @returns Object containing storage path and media ID
   */
  async uploadImage(
    imageBlob: Blob | File,
    path: string,
    ownerType?: MediaOwnerType,
    ownerId?: string
  ): Promise<{
    storagePath: string;
    mediaId: string;
  }> {
    // 1. Upload to storage bucket
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .upload(path, imageBlob, {
        upsert: false,
        contentType: imageBlob.type || 'image/png'
      });

    if (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // 2. Get public URL
    const { data: urlData } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(data.path);

    // 3. Create media record to keep in sync
    const media = await this.mediaRepository.create({
      user_id: this.userId,
      url: urlData.publicUrl,
      storage_path: data.path,
      media_type: 'image',
      file_size: imageBlob.size,
      mime_type: imageBlob.type || 'image/png',
      metadata: {},
      owner_type: ownerType,
      owner_id: ownerId
    });

    return {
      storagePath: data.path,
      mediaId: media.id
    };
  }

  /**
   * Update the owner of a media record
   * @param mediaId - The media ID to update
   * @param ownerType - Type of entity that owns this media
   * @param ownerId - ID of the owning entity
   */
  async setMediaOwner(
    mediaId: string,
    ownerType: MediaOwnerType,
    ownerId: string
  ): Promise<void> {
    await this.mediaRepository.update(mediaId, {
      owner_type: ownerType,
      owner_id: ownerId
    });
  }

  /**
   * Get the public URL for an image
   * @param path - The storage path
   * @returns The public URL to access the image
   */
  async getImageUrl(path: string): Promise<string> {
    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Delete an image from storage and media table
   * @param path - The storage path
   */
  async deleteImage(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(this.bucketName)
      .remove([path]);

    if (error) {
      throw new Error(`Failed to delete image: ${error.message}`);
    }

    // Note: Media table cleanup happens via database triggers or background jobs
    // that remove orphaned media records
  }

  /**
   * Check if an image exists in storage
   * @param path - The storage path
   * @returns True if image exists, false otherwise
   */
  async exists(path: string): Promise<boolean> {
    const lastSlashIndex = path.lastIndexOf('/');
    const folder = lastSlashIndex >= 0 ? path.substring(0, lastSlashIndex) : '';
    const filename = lastSlashIndex >= 0 ? path.substring(lastSlashIndex + 1) : path;

    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .list(folder, {
        search: filename
      });

    if (error) {
      return false;
    }

    return data.some(file => file.name === filename);
  }
}
