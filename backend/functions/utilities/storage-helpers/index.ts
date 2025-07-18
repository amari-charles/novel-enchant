/**
 * Storage Helpers - Supabase storage operations
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { StorageError, validateRequired } from '../../../shared/errors.ts';
import { ENV_VARS, SUPABASE_CONFIG } from '../../../shared/constants.ts';
import { generateSecureFilename, getFileExtension } from '../../../shared/utils.ts';

// ============================================================================
// STORAGE CLIENT
// ============================================================================

export const createStorageClient = () => {
  const supabaseUrl = Deno.env.get(ENV_VARS.SUPABASE_URL);
  const supabaseKey = Deno.env.get(ENV_VARS.SUPABASE_SERVICE_ROLE_KEY);
  
  if (!supabaseUrl || !supabaseKey) {
    throw new StorageError('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

// ============================================================================
// FILE UPLOAD OPERATIONS
// ============================================================================

export const uploadFile = async (
  bucketName: string,
  file: File,
  filename?: string
): Promise<{ path: string; publicUrl: string }> => {
  validateRequired(bucketName, 'bucketName');
  validateRequired(file, 'file');
  
  const supabase = createStorageClient();
  const finalFilename = filename || generateSecureFilename(file.name);
  
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(finalFilename, file, {
      cacheControl: '3600',
      upsert: true,
    });
  
  if (error) {
    throw new StorageError(`Failed to upload file: ${error.message}`, { error });
  }
  
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(finalFilename);
  
  return {
    path: data.path,
    publicUrl: publicUrlData.publicUrl,
  };
};

export const uploadFromUrl = async (
  bucketName: string,
  url: string,
  filename?: string
): Promise<{ path: string; publicUrl: string }> => {
  validateRequired(bucketName, 'bucketName');
  validateRequired(url, 'url');
  
  try {
    // Download the file from the URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new StorageError(`Failed to download file from URL: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    // Determine filename if not provided
    let finalFilename = filename;
    if (!finalFilename) {
      const urlPath = new URL(url).pathname;
      const extension = getFileExtension(urlPath) || 'jpg';
      finalFilename = `${crypto.randomUUID()}.${extension}`;
    }
    
    const supabase = createStorageClient();
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(finalFilename, blob, {
        cacheControl: '3600',
        upsert: true,
      });
    
    if (error) {
      throw new StorageError(`Failed to upload file: ${error.message}`, { error });
    }
    
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(finalFilename);
    
    return {
      path: data.path,
      publicUrl: publicUrlData.publicUrl,
    };
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }
    throw new StorageError(`Failed to upload from URL: ${error.message}`, { error });
  }
};

// ============================================================================
// FILE DOWNLOAD OPERATIONS
// ============================================================================

export const downloadFile = async (
  bucketName: string,
  path: string
): Promise<{ data: Blob; contentType: string }> => {
  validateRequired(bucketName, 'bucketName');
  validateRequired(path, 'path');
  
  const supabase = createStorageClient();
  
  const { data, error } = await supabase.storage
    .from(bucketName)
    .download(path);
  
  if (error) {
    throw new StorageError(`Failed to download file: ${error.message}`, { error });
  }
  
  return {
    data: data,
    contentType: data.type,
  };
};

export const getSignedUrl = async (
  bucketName: string,
  path: string,
  expiresIn: number = 3600
): Promise<string> => {
  validateRequired(bucketName, 'bucketName');
  validateRequired(path, 'path');
  
  const supabase = createStorageClient();
  
  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(path, expiresIn);
  
  if (error) {
    throw new StorageError(`Failed to create signed URL: ${error.message}`, { error });
  }
  
  return data.signedUrl;
};

export const getPublicUrl = (bucketName: string, path: string): string => {
  validateRequired(bucketName, 'bucketName');
  validateRequired(path, 'path');
  
  const supabase = createStorageClient();
  
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(path);
  
  return data.publicUrl;
};

// ============================================================================
// FILE MANAGEMENT OPERATIONS
// ============================================================================

export const deleteFile = async (bucketName: string, path: string): Promise<void> => {
  validateRequired(bucketName, 'bucketName');
  validateRequired(path, 'path');
  
  const supabase = createStorageClient();
  
  const { error } = await supabase.storage
    .from(bucketName)
    .remove([path]);
  
  if (error) {
    throw new StorageError(`Failed to delete file: ${error.message}`, { error });
  }
};

export const listFiles = async (
  bucketName: string,
  folder?: string,
  limit?: number
): Promise<Array<{ name: string; id: string; updated_at: string; size: number }>> => {
  validateRequired(bucketName, 'bucketName');
  
  const supabase = createStorageClient();
  
  const { data, error } = await supabase.storage
    .from(bucketName)
    .list(folder, {
      limit,
      sortBy: { column: 'updated_at', order: 'desc' },
    });
  
  if (error) {
    throw new StorageError(`Failed to list files: ${error.message}`, { error });
  }
  
  return data || [];
};

export const moveFile = async (
  bucketName: string,
  fromPath: string,
  toPath: string
): Promise<void> => {
  validateRequired(bucketName, 'bucketName');
  validateRequired(fromPath, 'fromPath');
  validateRequired(toPath, 'toPath');
  
  const supabase = createStorageClient();
  
  const { error } = await supabase.storage
    .from(bucketName)
    .move(fromPath, toPath);
  
  if (error) {
    throw new StorageError(`Failed to move file: ${error.message}`, { error });
  }
};

// ============================================================================
// SPECIALIZED OPERATIONS
// ============================================================================

export const uploadGeneratedImage = async (
  imageUrl: string,
  storyId: string,
  sceneId: string
): Promise<{ path: string; publicUrl: string; thumbnailUrl: string }> => {
  validateRequired(imageUrl, 'imageUrl');
  validateRequired(storyId, 'storyId');
  validateRequired(sceneId, 'sceneId');
  
  const filename = `${storyId}/${sceneId}/${crypto.randomUUID()}.jpg`;
  const thumbnailFilename = `${storyId}/${sceneId}/thumb_${crypto.randomUUID()}.jpg`;
  
  // Upload original image
  const { path, publicUrl } = await uploadFromUrl(
    SUPABASE_CONFIG.STORAGE_BUCKETS.GENERATED_IMAGES,
    imageUrl,
    filename
  );
  
  // Create thumbnail (simplified - in production you'd use image processing)
  const thumbnailUrl = await createThumbnail(imageUrl, thumbnailFilename);
  
  return {
    path,
    publicUrl,
    thumbnailUrl,
  };
};

export const uploadReferenceImage = async (
  file: File,
  entityId: string
): Promise<{ path: string; publicUrl: string }> => {
  validateRequired(file, 'file');
  validateRequired(entityId, 'entityId');
  
  const filename = `${entityId}/${crypto.randomUUID()}.${getFileExtension(file.name)}`;
  
  return await uploadFile(
    SUPABASE_CONFIG.STORAGE_BUCKETS.REFERENCE_IMAGES,
    file,
    filename
  );
};

export const uploadStoryFile = async (
  file: File,
  storyId: string
): Promise<{ path: string; publicUrl: string }> => {
  validateRequired(file, 'file');
  validateRequired(storyId, 'storyId');
  
  const filename = `${storyId}/${crypto.randomUUID()}.${getFileExtension(file.name)}`;
  
  return await uploadFile(
    SUPABASE_CONFIG.STORAGE_BUCKETS.STORY_UPLOADS,
    file,
    filename
  );
};

// ============================================================================
// THUMBNAIL GENERATION
// ============================================================================

const createThumbnail = async (
  originalImageUrl: string,
  thumbnailFilename: string
): Promise<string> => {
  try {
    // For now, we'll just return the original URL
    // In production, you'd implement actual thumbnail generation
    // using a service like ImageMagick or a thumbnail generation API
    
    // Placeholder: Upload the original as thumbnail (you'd resize it first)
    const { publicUrl } = await uploadFromUrl(
      SUPABASE_CONFIG.STORAGE_BUCKETS.THUMBNAILS,
      originalImageUrl,
      thumbnailFilename
    );
    
    return publicUrl;
  } catch (error) {
    // If thumbnail creation fails, return original URL
    console.warn('Failed to create thumbnail:', error);
    return originalImageUrl;
  }
};

// ============================================================================
// CLEANUP OPERATIONS
// ============================================================================

export const cleanupOldFiles = async (
  bucketName: string,
  maxAge: number = 30 * 24 * 60 * 60 * 1000 // 30 days
): Promise<{ deletedCount: number; errors: string[] }> => {
  validateRequired(bucketName, 'bucketName');
  
  const files = await listFiles(bucketName);
  const cutoffDate = new Date(Date.now() - maxAge);
  const oldFiles = files.filter(file => new Date(file.updated_at) < cutoffDate);
  
  let deletedCount = 0;
  const errors: string[] = [];
  
  for (const file of oldFiles) {
    try {
      await deleteFile(bucketName, file.name);
      deletedCount++;
    } catch (error) {
      errors.push(`Failed to delete ${file.name}: ${error.message}`);
    }
  }
  
  return { deletedCount, errors };
};

export const calculateStorageUsage = async (bucketName: string): Promise<{
  totalFiles: number;
  totalSize: number;
  formattedSize: string;
}> => {
  validateRequired(bucketName, 'bucketName');
  
  const files = await listFiles(bucketName);
  const totalFiles = files.length;
  const totalSize = files.reduce((acc, file) => acc + file.size, 0);
  
  const formatSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };
  
  return {
    totalFiles,
    totalSize,
    formattedSize: formatSize(totalSize),
  };
};