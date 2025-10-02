/**
 * Stub Image AI Client for development/testing
 * Returns mock image URLs without calling an actual AI API
 */

import type { IImageAIClient } from './IImageAIClient';

export class StubImageAIClient implements IImageAIClient {
  async generateImage(_prompt: string): Promise<string> {
    // Return a placeholder image URL
    // Using picsum.photos for deterministic placeholder images
    const seed = Math.floor(Math.random() * 1000);
    return `https://picsum.photos/seed/${seed}/1024/768`;
  }
}
