/**
 * Novel Enchant - Common Utilities
 * Shared utility functions for all backend functions
 */

import { UUID } from './types.ts';

// ============================================================================
// UUID GENERATION
// ============================================================================

export const generateUUID = (): UUID => {
  return crypto.randomUUID();
};

// ============================================================================
// TEXT PROCESSING UTILITIES
// ============================================================================

export const cleanText = (text: string): string => {
  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};

export const extractTitle = (text: string): string => {
  const lines = text.split('\n');
  const firstLine = lines[0]?.trim();
  
  // Look for title patterns
  if (firstLine && firstLine.length < 100) {
    return firstLine;
  }
  
  // Fallback to first significant text
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && trimmed.length > 10 && trimmed.length < 100) {
      return trimmed;
    }
  }
  
  return 'Untitled Story';
};

export const estimateReadingTime = (text: string): number => {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

export const splitIntoChapters = (text: string): string[] => {
  // Common chapter markers
  const chapterPatterns = [
    /^chapter\s+\d+/im,
    /^ch\.\s*\d+/im,
    /^\d+\.\s/m,
    /^part\s+\d+/im,
  ];
  
  for (const pattern of chapterPatterns) {
    const matches = [...text.matchAll(new RegExp(pattern, 'gim'))];
    if (matches.length > 1) {
      const chapters: string[] = [];
      let lastIndex = 0;
      
      for (const match of matches) {
        if (match.index && match.index > lastIndex) {
          chapters.push(text.slice(lastIndex, match.index).trim());
        }
        lastIndex = match.index || 0;
      }
      
      // Add the last chapter
      if (lastIndex < text.length) {
        chapters.push(text.slice(lastIndex).trim());
      }
      
      return chapters.filter(ch => ch.length > 100); // Filter out very short chapters
    }
  }
  
  // If no chapters found, return as single chapter
  return [text];
};

// ============================================================================
// STRING SIMILARITY
// ============================================================================

export const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  return (longer.length - editDistance(longer, shorter)) / longer.length;
};

const editDistance = (str1: string, str2: string): number => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const deduplicateArray = <T>(array: T[], keyFn?: (item: T) => any): T[] => {
  if (!keyFn) {
    return [...new Set(array)];
  }
  
  const seen = new Set();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ============================================================================
// OBJECT UTILITIES
// ============================================================================

export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as { [key: string]: any };
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned as T;
  }
  
  return obj;
};

export const mergeDeep = <T extends Record<string, any>>(target: T, source: Partial<T>): T => {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = result[key];
      
      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = mergeDeep(targetValue, sourceValue);
      } else {
        result[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
  }
  
  return result;
};

// ============================================================================
// TIMING UTILITIES
// ============================================================================

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const timeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
    ),
  ]);
};

export const measureExecutionTime = async <T>(
  operation: () => Promise<T>
): Promise<{ result: T; executionTime: number }> => {
  const start = performance.now();
  const result = await operation();
  const end = performance.now();
  
  return {
    result,
    executionTime: end - start,
  };
};

// ============================================================================
// URL UTILITIES
// ============================================================================

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

// ============================================================================
// FILE UTILITIES
// ============================================================================

export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const generateSecureFilename = (originalFilename: string): string => {
  const extension = getFileExtension(originalFilename);
  const uuid = generateUUID();
  return `${uuid}.${extension}`;
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[^\w\s.,!?-]/g, '') // Keep only safe characters
    .trim();
};

export const normalizeWhitespace = (text: string): string => {
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph breaks
    .trim();
};

// ============================================================================
// MATH UTILITIES
// ============================================================================

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};

export const randomInRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export const roundToDecimals = (value: number, decimals: number): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

// ============================================================================
// CACHING UTILITIES
// ============================================================================

export class SimpleCache<T> {
  private cache = new Map<string, { value: T; expiry: number }>();
  
  set(key: string, value: T, ttlMs: number = 300000): void { // 5 minutes default
    const expiry = Date.now() + ttlMs;
    this.cache.set(key, { value, expiry });
  }
  
  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value;
  }
  
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    // Clean expired items first
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }
}