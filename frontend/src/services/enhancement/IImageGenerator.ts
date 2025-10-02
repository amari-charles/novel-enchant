/**
 * Image Generator Interface
 * Low-level interface for image generation providers
 * This abstraction allows swapping different image generation services
 * (DALL-E, Stable Diffusion, Midjourney, etc.)
 */

/**
 * Generated image result
 */
export interface GeneratedImage {
  /** URL of the generated image */
  imageUrl: string;
  /** Prompt used to generate the image */
  prompt: string;
  /** Additional metadata about the generation */
  metadata?: Record<string, unknown>;
}

export interface IImageGenerator {
  /**
   * Generate an image from a prompt
   * @param prompt - The text prompt describing the image to generate
   * @returns Generated image with URL and metadata
   */
  generateImage(prompt: string): Promise<GeneratedImage>;
}
