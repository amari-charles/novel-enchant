/**
 * File Upload Service for Reader Enhance feature
 * Handles file validation, upload to Supabase storage, and text extraction
 */

import { supabase } from "@/lib/supabase";
import { VALIDATION_LIMITS, type FileUpload, type SourceType } from '@/features/reader-enhance/types';

export class FileUploadService {
  private static readonly SUPPORTED_FORMATS = ['.txt', '.md', '.docx', '.pdf'];
  private static readonly MIME_TYPES = {
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.pdf': 'application/pdf',
  };

  /**
   * Validate file before upload
   */
  static validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file size
    const maxSizeBytes = VALIDATION_LIMITS.MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        isValid: false,
        error: `File size exceeds ${VALIDATION_LIMITS.MAX_FILE_SIZE_MB}MB limit`,
      };
    }

    // Check file format
    const fileExtension = this.getFileExtension(file.name);
    if (!this.SUPPORTED_FORMATS.includes(fileExtension)) {
      return {
        isValid: false,
        error: `Unsupported file format. Supported formats: ${this.SUPPORTED_FORMATS.join(', ')}`,
      };
    }

    // Check MIME type if available
    const expectedMimeType = this.MIME_TYPES[fileExtension as keyof typeof this.MIME_TYPES];
    if (file.type && file.type !== expectedMimeType) {
      return {
        isValid: false,
        error: 'File format does not match file extension',
      };
    }

    return { isValid: true };
  }

  /**
   * Upload file to Supabase storage
   */
  static async uploadFile(
    file: File,
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<{ url: string; path: string }> {
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Generate unique file path
    const fileExtension = this.getFileExtension(file.name);
    const fileName = `source-${Date.now()}${fileExtension}`;
    const filePath = `${userId}/uploads/${fileName}`;

    try {
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('enhanced-copies')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('enhanced-copies')
        .getPublicUrl(data.path);

      if (onProgress) {
        onProgress(100);
      }

      return {
        url: urlData.publicUrl,
        path: data.path,
      };
    } catch (error) {
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from uploaded file
   */
  static async extractTextFromFile(fileUrl: string, fileName: string): Promise<string> {
    const fileExtension = this.getFileExtension(fileName);

    try {
      switch (fileExtension) {
        case '.txt':
        case '.md':
          return await this.extractTextFromTextFile(fileUrl);
        case '.docx':
          return await this.extractTextFromDocx(fileUrl);
        case '.pdf':
          return await this.extractTextFromPdf(fileUrl);
        default:
          throw new Error(`Text extraction not supported for ${fileExtension} files`);
      }
    } catch (error) {
      throw new Error(`Failed to extract text from file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate text content
   */
  static validateText(text: string): { isValid: boolean; error?: string; wordCount?: number } {
    if (!text || text.trim().length === 0) {
      return {
        isValid: false,
        error: 'Text content cannot be empty',
      };
    }

    const wordCount = this.countWords(text);
    if (wordCount > VALIDATION_LIMITS.MAX_WORD_COUNT) {
      return {
        isValid: false,
        error: `Text exceeds ${VALIDATION_LIMITS.MAX_WORD_COUNT} word limit (${wordCount} words)`,
        wordCount,
      };
    }

    if (wordCount < 50) {
      return {
        isValid: false,
        error: 'Text is too short. Please provide at least 50 words for enhancement.',
        wordCount,
      };
    }

    return { isValid: true, wordCount };
  }

  /**
   * Get supported file formats for UI display
   */
  static getSupportedFormats(): string[] {
    return [...this.SUPPORTED_FORMATS];
  }

  /**
   * Get maximum file size for UI display
   */
  static getMaxFileSizeMB(): number {
    return VALIDATION_LIMITS.MAX_FILE_SIZE_MB;
  }

  // Private helper methods

  private static getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex !== -1 ? fileName.slice(lastDotIndex).toLowerCase() : '';
  }

  private static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private static async extractTextFromTextFile(fileUrl: string): Promise<string> {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    return await response.text();
  }

  private static async extractTextFromDocx(): Promise<string> {
    // Note: In a real implementation, you would use a library like mammoth.js
    // For now, we'll throw an error to be implemented later
    throw new Error('DOCX text extraction not yet implemented. Please convert to TXT or MD format.');
  }

  private static async extractTextFromPdf(): Promise<string> {
    // Note: In a real implementation, you would use a library like pdf.js
    // For now, we'll throw an error to be implemented later
    throw new Error('PDF text extraction not yet implemented. Please convert to TXT or MD format.');
  }

  /**
   * Create a file upload tracker object
   */
  static createUploadTracker(file: File): FileUpload {
    return {
      file,
      progress: 0,
      status: 'uploading',
    };
  }

  /**
   * Generate title from text content if not provided
   */
  static generateTitleFromText(text: string, maxLength = 50): string {
    const cleanText = text.trim().replace(/\s+/g, ' ');

    // Try to find a title in the first few lines
    const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    if (lines.length > 0) {
      const firstLine = lines[0];

      // If first line looks like a title (short, possibly with title case)
      if (firstLine.length <= 60 && !firstLine.endsWith('.') && !firstLine.endsWith('!') && !firstLine.endsWith('?')) {
        return firstLine.length <= maxLength ? firstLine : `${firstLine.slice(0, maxLength - 3)}...`;
      }
    }

    // Fall back to first N characters
    return cleanText.length <= maxLength ? cleanText : `${cleanText.slice(0, maxLength - 3)}...`;
  }
}

// Export commonly used types and constants
export { VALIDATION_LIMITS };
export type { FileUpload, SourceType };