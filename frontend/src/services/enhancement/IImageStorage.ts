/**
 * Image Storage Interface
 * Handles uploading and retrieving images from storage (Supabase Storage)
 */

export interface IImageStorage {
  /**
   * Upload an image to storage and create media record
   * @param imageBlob - The image file/blob to upload
   * @param path - The storage path (e.g., "users/{userId}/images/{imageId}.png")
   * @returns Object containing storage path and media ID
   */
  uploadImage(imageBlob: Blob | File, path: string): Promise<{
    storagePath: string;
    mediaId: string;
  }>;

  /**
   * Get the public URL for an image
   * @param path - The storage path
   * @returns The public URL to access the image
   */
  getImageUrl(path: string): Promise<string>;

  /**
   * Delete an image from storage
   * @param path - The storage path
   */
  deleteImage(path: string): Promise<void>;

  /**
   * Check if an image exists in storage
   * @param path - The storage path
   * @returns True if image exists, false otherwise
   */
  exists(path: string): Promise<boolean>;
}
