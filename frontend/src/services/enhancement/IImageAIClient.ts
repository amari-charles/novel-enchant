/**
 * Image AI Client Interface
 * For image generation tasks
 * Implementations: DALL-E, Stable Diffusion, Midjourney, Flux, etc.
 */

export interface IImageAIClient {
  /**
   * Generate an image from a text prompt
   * @param prompt - The text description of the image to generate
   * @returns URL of the generated image
   */
  generateImage(prompt: string): Promise<string>;
}
