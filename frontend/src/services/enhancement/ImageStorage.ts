/**
 * Image Storage
 * Handles uploading and retrieving images from Supabase Storage
 */

import type { IImageStorage } from './IImageStorage';

export class ImageStorage implements IImageStorage {
  /**
   * Upload an image to storage
   * @param imageBlob - The image file/blob to upload
   * @param path - The storage path (e.g., "users/{userId}/images/{imageId}.png")
   * @returns The storage path of the uploaded image
   */
  async uploadImage(_imageBlob: Blob | File, _path: string): Promise<string> {
    // TODO: Implement image upload to Supabase Storage
    // Use supabase.storage.from('bucket-name').upload()
    throw new Error('Not implemented');
  }

  /**
   * Get the public URL for an image
   * @param path - The storage path
   * @returns The public URL to access the image
   */
  async getImageUrl(_path: string): Promise<string> {
    // TODO: Implement get public URL from Supabase Storage
    // Use supabase.storage.from('bucket-name').getPublicUrl()
    throw new Error('Not implemented');
  }

  /**
   * Delete an image from storage
   * @param path - The storage path
   */
  async deleteImage(_path: string): Promise<void> {
    // TODO: Implement image deletion from Supabase Storage
    // Use supabase.storage.from('bucket-name').remove()
    throw new Error('Not implemented');
  }

  /**
   * Check if an image exists in storage
   * @param path - The storage path
   * @returns True if image exists, false otherwise
   */
  async exists(_path: string): Promise<boolean> {
    // TODO: Implement check if image exists in Supabase Storage
    // Use supabase.storage.from('bucket-name').list() or try to get metadata
    throw new Error('Not implemented');
  }
}
