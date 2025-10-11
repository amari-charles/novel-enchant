/**
 * Image Storage Interface
 * Handles uploading and retrieving images from storage (Supabase Storage)
 */

export type MediaOwnerType = 'enhancement' | 'story_cover' | 'avatar' | 'user_upload';

export interface IImageStorage {
  /**
   * Upload an image to storage and create media record
   * @param imageBlob - The image file/blob to upload
   * @param path - The storage path (e.g., "users/{userId}/images/{imageId}.png")
   * @param ownerType - Optional type of entity that owns this media (can be set later)
   * @param ownerId - Optional ID of the owning entity (can be set later)
   * @returns Object containing storage path and media ID
   */
  uploadImage(
    imageBlob: Blob | File,
    path: string,
    ownerType?: MediaOwnerType,
    ownerId?: string
  ): Promise<{
    storagePath: string;
    mediaId: string;
  }>;

  /**
   * Update the owner of a media record
   * @param mediaId - The media ID to update
   * @param ownerType - Type of entity that owns this media
   * @param ownerId - ID of the owning entity
   */
  setMediaOwner(
    mediaId: string,
    ownerType: MediaOwnerType,
    ownerId: string
  ): Promise<void>;

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
