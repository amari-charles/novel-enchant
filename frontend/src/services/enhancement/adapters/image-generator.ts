/**
 * Image Generator
 * Low-level service for generating images from prompts
 * Provider-agnostic implementation that can be swapped with different backends
 */

import type { IImageGenerator, GeneratedImage } from './i-image-generator';
import type { IImageAIClient } from './ai-clients/i-image-ai-client';

export class ImageGenerator implements IImageGenerator {
  constructor(private imageAI: IImageAIClient) {}

  /**
   * Generate an image from a prompt
   * @param prompt - The text prompt describing the image to generate
   * @returns Generated image with URL and metadata
   */
  async generateImage(prompt: string): Promise<GeneratedImage> {
    const imageUrl = await this.imageAI.generateImage(prompt);

    return {
      imageUrl,
      prompt,
      metadata: {
        generatedAt: new Date().toISOString(),
        provider: this.imageAI.constructor.name
      }
    };
  }
}
