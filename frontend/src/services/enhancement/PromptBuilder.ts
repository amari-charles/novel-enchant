/**
 * Prompt Builder
 * Handles building prompts from scene context and orchestrating image generation
 */

import type { IPromptBuilder, ImageStyle } from './IPromptBuilder';
import type { CharacterRegistryContext } from './ISceneSelector';
import type { IImageGenerator, GeneratedImage } from './IImageGenerator';

export class PromptBuilder implements IPromptBuilder {
  private imageGenerator: IImageGenerator;

  /**
   * @param imageGenerator - The image generator service to use for generating images
   */
  constructor(imageGenerator: IImageGenerator) {
    this.imageGenerator = imageGenerator;
  }

  /**
   * Build a prompt for image generation from a scene
   * @param scene - The scene text
   * @param characterRegistryContext - Optional context about characters
   * @param style - Style preferences
   * @returns The constructed prompt string
   */
  buildPrompt(
    _scene: string,
    _characterRegistryContext?: CharacterRegistryContext,
    _style?: ImageStyle
  ): string {
    // TODO: Implement prompt building logic
    // Should incorporate scene context, character details, and style preferences
    throw new Error('Not implemented');
  }

  /**
   * Generate an image from a scene by building a prompt and calling image generator
   * @param scene - The scene text to generate an image for
   * @param characterRegistryContext - Optional context about characters in the scene
   * @param style - Style preferences for the generated image
   * @returns Generated image with metadata
   */
  async generateImageFromScene(
    _scene: string,
    _characterRegistryContext?: CharacterRegistryContext,
    _style?: ImageStyle
  ): Promise<GeneratedImage> {
    // TODO: Implement orchestration logic
    // 1. Build prompt using buildPrompt()
    // 2. Call this.imageGenerator.generateImage(prompt)
    // 3. Return result
    // Prevent unused property warning
    if (this.imageGenerator) { /* used in implementation */ }
    throw new Error('Not implemented');
  }
}