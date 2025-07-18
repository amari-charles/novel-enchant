/**
 * Unit Tests for Shared Utility Functions
 * Tests core utility functions used across the application
 */

import { describe, expect, test, beforeEach } from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { 
  calculateSimilarity, 
  cleanText, 
  extractTitle, 
  splitIntoChapters,
  chunkArray,
  deduplicateArray,
  deepClone,
  mergeDeep,
  isValidUrl,
  getFileExtension,
  SimpleCache
} from './utils.ts';

describe('calculateSimilarity', () => {
  test('should return 1.0 for identical strings', () => {
    expect(calculateSimilarity('hello world', 'hello world')).toBe(1.0);
  });

  test('should return 0.0 for completely different strings', () => {
    expect(calculateSimilarity('hello', 'xyz')).toBe(0.0);
  });

  test('should return value between 0 and 1 for similar strings', () => {
    const similarity = calculateSimilarity('hello world', 'hello word');
    expect(similarity).toBeGreaterThan(0);
    expect(similarity).toBeLessThan(1);
  });

  test('should handle empty strings', () => {
    expect(calculateSimilarity('', '')).toBe(1.0);
    expect(calculateSimilarity('hello', '')).toBe(0.0);
    expect(calculateSimilarity('', 'hello')).toBe(0.0);
  });

  test('should be case sensitive', () => {
    const similarity = calculateSimilarity('Hello', 'hello');
    expect(similarity).toBeLessThan(1.0);
  });
});

describe('cleanText', () => {
  test('should normalize whitespace', () => {
    expect(cleanText('hello    world\t\n')).toBe('hello world');
  });

  test('should trim leading and trailing whitespace', () => {
    expect(cleanText('  hello world  ')).toBe('hello world');
  });

  test('should normalize line endings', () => {
    expect(cleanText('hello\r\nworld')).toBe('hello world');
  });

  test('should handle empty string', () => {
    expect(cleanText('')).toBe('');
  });

  test('should handle string with only whitespace', () => {
    expect(cleanText('   \n\t  ')).toBe('');
  });
});

describe('extractTitle', () => {
  test('should extract title from first line', () => {
    const text = 'The Great Adventure\n\nThis is the beginning of the story...';
    expect(extractTitle(text)).toBe('The Great Adventure');
  });

  test('should handle text without clear title', () => {
    const text = 'This is just a regular paragraph without a title at the beginning.';
    expect(extractTitle(text)).toBe('This is just a regular paragraph without a title at the beginning.');
  });

  test('should return fallback for empty text', () => {
    expect(extractTitle('')).toBe('Untitled Story');
  });

  test('should handle very long first line', () => {
    const longLine = 'This is a very long first line that exceeds the typical title length and should be handled appropriately by the function';
    expect(extractTitle(longLine)).toBe('Untitled Story');
  });
});

describe('splitIntoChapters', () => {
  test('should split text by chapter markers', () => {
    const text = 'Chapter 1\nFirst chapter content\n\nChapter 2\nSecond chapter content';
    const chapters = splitIntoChapters(text);
    
    expect(chapters.length).toBe(2);
    expect(chapters[0]).toContain('First chapter content');
    expect(chapters[1]).toContain('Second chapter content');
  });

  test('should handle text without chapter markers', () => {
    const text = 'This is just a regular story without chapter markers.';
    const chapters = splitIntoChapters(text);
    
    expect(chapters).toEqual([text]);
  });

  test('should filter out very short chapters', () => {
    const text = 'Chapter 1\nX\n\nChapter 2\nThis is a proper chapter with enough content to be meaningful.';
    const chapters = splitIntoChapters(text);
    
    expect(chapters.length).toBe(1);
    expect(chapters[0]).toContain('This is a proper chapter');
  });
});

describe('chunkArray', () => {
  test('should split array into chunks of specified size', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7];
    const chunks = chunkArray(arr, 3);
    
    expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
  });

  test('should handle empty array', () => {
    expect(chunkArray([], 3)).toEqual([]);
  });

  test('should handle chunk size larger than array', () => {
    const arr = [1, 2, 3];
    const chunks = chunkArray(arr, 5);
    
    expect(chunks).toEqual([[1, 2, 3]]);
  });

  test('should handle chunk size of 1', () => {
    const arr = [1, 2, 3];
    const chunks = chunkArray(arr, 1);
    
    expect(chunks).toEqual([[1], [2], [3]]);
  });
});

describe('deduplicateArray', () => {
  test('should remove duplicate primitives', () => {
    const arr = [1, 2, 2, 3, 3, 3];
    const unique = deduplicateArray(arr);
    
    expect(unique).toEqual([1, 2, 3]);
  });

  test('should remove duplicate objects using key function', () => {
    const arr = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 1, name: 'Alice' },
    ];
    const unique = deduplicateArray(arr, item => item.id);
    
    expect(unique).toEqual([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]);
  });

  test('should handle empty array', () => {
    expect(deduplicateArray([])).toEqual([]);
  });

  test('should preserve order of first occurrence', () => {
    const arr = [3, 1, 2, 1, 3];
    const unique = deduplicateArray(arr);
    
    expect(unique).toEqual([3, 1, 2]);
  });
});

describe('deepClone', () => {
  test('should clone primitive values', () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone('hello')).toBe('hello');
    expect(deepClone(true)).toBe(true);
    expect(deepClone(null)).toBe(null);
  });

  test('should clone arrays', () => {
    const original = [1, 2, [3, 4]];
    const cloned = deepClone(original);
    
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned[2]).not.toBe(original[2]);
  });

  test('should clone objects', () => {
    const original = { a: 1, b: { c: 2 } };
    const cloned = deepClone(original);
    
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.b).not.toBe(original.b);
  });

  test('should clone dates', () => {
    const original = new Date('2023-01-01');
    const cloned = deepClone(original);
    
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.getTime()).toBe(original.getTime());
  });
});

describe('mergeDeep', () => {
  test('should merge simple objects', () => {
    const target = { a: 1, b: 2 };
    const source = { b: 3, c: 4 };
    
    const result = mergeDeep(target, source);
    
    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  test('should merge nested objects', () => {
    const target = { a: { x: 1, y: 2 }, b: 3 };
    const source = { a: { y: 4, z: 5 }, c: 6 };
    
    const result = mergeDeep(target, source);
    
    expect(result).toEqual({ 
      a: { x: 1, y: 4, z: 5 }, 
      b: 3, 
      c: 6 
    });
  });

  test('should not mutate original objects', () => {
    const target = { a: { x: 1 } };
    const source = { a: { y: 2 } };
    
    const result = mergeDeep(target, source);
    
    expect(target).toEqual({ a: { x: 1 } });
    expect(source).toEqual({ a: { y: 2 } });
  });
});

describe('isValidUrl', () => {
  test('should validate correct URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://example.com')).toBe(true);
    expect(isValidUrl('https://example.com/path')).toBe(true);
  });

  test('should reject invalid URLs', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
    expect(isValidUrl('example.com')).toBe(false);
    expect(isValidUrl('')).toBe(false);
  });
});

describe('getFileExtension', () => {
  test('should extract file extension', () => {
    expect(getFileExtension('document.pdf')).toBe('pdf');
    expect(getFileExtension('image.jpg')).toBe('jpg');
    expect(getFileExtension('file.tar.gz')).toBe('gz');
  });

  test('should handle files without extension', () => {
    expect(getFileExtension('README')).toBe('');
    expect(getFileExtension('file.')).toBe('');
  });

  test('should handle empty string', () => {
    expect(getFileExtension('')).toBe('');
  });

  test('should return lowercase extension', () => {
    expect(getFileExtension('IMAGE.JPG')).toBe('jpg');
  });
});

describe('SimpleCache', () => {
  let cache: SimpleCache<string>;

  beforeEach(() => {
    cache = new SimpleCache<string>();
  });

  test('should store and retrieve values', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  test('should return undefined for non-existent keys', () => {
    expect(cache.get('non-existent')).toBeUndefined();
  });

  test('should handle TTL expiration', async () => {
    cache.set('key1', 'value1', 100); // 100ms TTL
    
    expect(cache.get('key1')).toBe('value1');
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(cache.get('key1')).toBeUndefined();
  });

  test('should check existence of keys', () => {
    cache.set('key1', 'value1');
    
    expect(cache.has('key1')).toBe(true);
    expect(cache.has('non-existent')).toBe(false);
  });

  test('should delete keys', () => {
    cache.set('key1', 'value1');
    cache.delete('key1');
    
    expect(cache.get('key1')).toBeUndefined();
  });

  test('should clear all keys', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.clear();
    
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBeUndefined();
  });

  test('should report correct size', () => {
    expect(cache.size()).toBe(0);
    
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    
    expect(cache.size()).toBe(2);
  });
});