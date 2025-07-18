/**
 * Unit Tests for chunkTextIntoSections Function
 * Tests the text chunking algorithm with various strategies
 */

import { describe, expect, test, beforeEach } from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { chunkTextIntoSections } from './index.ts';

describe('chunkTextIntoSections', () => {
  const sampleText = `This is the first paragraph. It contains multiple sentences and should be treated as a cohesive unit.

This is the second paragraph. It talks about different topics and should be in a separate chunk if possible.

This is the third paragraph. It continues the narrative and provides additional context for the story.

This is the fourth paragraph. It concludes the section and wraps up the current scene.`;

  const longSingleParagraph = 'This is a very long paragraph that should be split into multiple chunks based on the maximum chunk size. '.repeat(50);

  const shortText = 'This is a short text.';

  describe('paragraph strategy', () => {
    test('should split text into chunks by paragraphs', async () => {
      const result = await chunkTextIntoSections(sampleText, 'paragraph', 1000);
      
      expect(result).toEqual([
        {
          id: expect.any(String),
          index: 0,
          text: expect.stringContaining('This is the first paragraph'),
          boundaries: 'natural',
        },
        {
          id: expect.any(String),
          index: 1, 
          text: expect.stringContaining('This is the second paragraph'),
          boundaries: 'natural',
        },
        {
          id: expect.any(String),
          index: 2,
          text: expect.stringContaining('This is the third paragraph'),
          boundaries: 'natural',
        },
        {
          id: expect.any(String),
          index: 3,
          text: expect.stringContaining('This is the fourth paragraph'),
          boundaries: 'natural',
        },
      ]);
    });

    test('should combine paragraphs when they fit within max chunk size', async () => {
      const result = await chunkTextIntoSections(sampleText, 'paragraph', 500);
      
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThan(4); // Should combine some paragraphs
      
      // Check that all chunks are within size limit
      for (const chunk of result) {
        expect(chunk.text.length).toBeLessThanOrEqual(500);
      }
    });

    test('should handle oversized paragraphs by forcing splits', async () => {
      const result = await chunkTextIntoSections(longSingleParagraph, 'paragraph', 500);
      
      expect(result.length).toBeGreaterThan(1);
      
      // Should have some forced boundaries
      const forcedBoundaries = result.filter(chunk => chunk.boundaries === 'forced');
      expect(forcedBoundaries.length).toBeGreaterThan(0);
      
      // All chunks should be within size limit
      for (const chunk of result) {
        expect(chunk.text.length).toBeLessThanOrEqual(500);
      }
    });
  });

  describe('fixed strategy', () => {
    test('should split text into fixed-size chunks', async () => {
      const result = await chunkTextIntoSections(sampleText, 'fixed', 200);
      
      expect(result.length).toBeGreaterThan(1);
      
      // All chunks except possibly the last should be near the max size
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].text.length).toBeLessThanOrEqual(200);
        expect(result[i].text.length).toBeGreaterThan(100); // Should be reasonably full
      }
    });

    test('should maintain chunk order with correct indices', async () => {
      const result = await chunkTextIntoSections(sampleText, 'fixed', 300);
      
      for (let i = 0; i < result.length; i++) {
        expect(result[i].index).toBe(i);
      }
    });
  });

  describe('semantic strategy', () => {
    const semanticText = `Chapter 1: The Beginning

This is the first scene of the story. It introduces the main character.

* * *

This is the second scene. It shows a different perspective.

---

This is the third scene. It continues the narrative.`;

    test('should split text at semantic boundaries', async () => {
      const result = await chunkTextIntoSections(semanticText, 'semantic', 1000);
      
      expect(result.length).toBeGreaterThan(1);
      
      // Should identify semantic breaks
      const hasNaturalBoundaries = result.some(chunk => chunk.boundaries === 'natural');
      expect(hasNaturalBoundaries).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('should handle empty text', async () => {
      const result = await chunkTextIntoSections('', 'paragraph', 1000);
      expect(result).toEqual([]);
    });

    test('should handle very short text', async () => {
      const result = await chunkTextIntoSections(shortText, 'paragraph', 1000);
      
      expect(result).toEqual([{
        id: expect.any(String),
        index: 0,
        text: shortText,
        boundaries: 'natural',
      }]);
    });

    test('should handle text with only whitespace', async () => {
      const result = await chunkTextIntoSections('   \n\n   ', 'paragraph', 1000);
      expect(result).toEqual([]);
    });

    test('should handle single character max chunk size', async () => {
      const result = await chunkTextIntoSections('hello world', 'fixed', 5);
      
      expect(result.length).toBeGreaterThan(1);
      
      for (const chunk of result) {
        expect(chunk.text.length).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('chunk properties', () => {
    test('should generate unique IDs for each chunk', async () => {
      const result = await chunkTextIntoSections(sampleText, 'paragraph', 1000);
      
      const ids = result.map(chunk => chunk.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });

    test('should assign sequential indices', async () => {
      const result = await chunkTextIntoSections(sampleText, 'paragraph', 1000);
      
      for (let i = 0; i < result.length; i++) {
        expect(result[i].index).toBe(i);
      }
    });

    test('should preserve text content without data loss', async () => {
      const result = await chunkTextIntoSections(sampleText, 'paragraph', 1000);
      
      const reconstructed = result.map(chunk => chunk.text).join('\n\n');
      
      // Should contain all original words (order and exact formatting may vary)
      const originalWords = sampleText.split(/\s+/).filter(word => word.length > 0);
      const reconstructedWords = reconstructed.split(/\s+/).filter(word => word.length > 0);
      
      expect(reconstructedWords.length).toBe(originalWords.length);
    });
  });

  describe('performance and limits', () => {
    test('should handle large text efficiently', async () => {
      const largeText = 'This is a test sentence. '.repeat(10000);
      
      const startTime = performance.now();
      const result = await chunkTextIntoSections(largeText, 'paragraph', 2000);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result.length).toBeGreaterThan(0);
    });

    test('should respect maximum chunk size limits', async () => {
      const result = await chunkTextIntoSections(longSingleParagraph, 'paragraph', 300);
      
      for (const chunk of result) {
        expect(chunk.text.length).toBeLessThanOrEqual(300);
      }
    });
  });

  describe('error handling', () => {
    test('should throw error for invalid chunk strategy', async () => {
      await expect(
        chunkTextIntoSections(sampleText, 'invalid' as any, 1000)
      ).rejects.toThrow('Unknown chunking strategy: invalid');
    });

    test('should handle extreme parameters gracefully', async () => {
      // Very large max chunk size
      const result1 = await chunkTextIntoSections(sampleText, 'paragraph', 100000);
      expect(result1.length).toBe(1);
      
      // Very small max chunk size
      const result2 = await chunkTextIntoSections(sampleText, 'fixed', 1);
      expect(result2.length).toBeGreaterThan(1);
    });
  });
});