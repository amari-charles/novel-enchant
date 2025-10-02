/**
 * Prompt Builder Interface
 * Defines the contract for building prompts from scene context
 */

import type { GeneratedImage } from './IImageGenerator';

/**
 * Style preferences for image generation
 */
export interface ImageStyle {
  /** Art style (e.g., 'cinematic', 'anime', 'watercolor') */
  artStyle?: string;
  /** Color palette preferences */
  colorPalette?: string;
  /** Mood or atmosphere */
  mood?: string;
  /** Additional style metadata */
  metadata?: Record<string, unknown>;
}

export interface IPromptBuilder {
  /**
   * Build a simple prompt for image generation from a scene
   * For character consistency, use generateImageFromScene() instead
   * @param scene - The scene text
   * @param style - Style preferences
   * @returns The constructed prompt string
   */
  buildPrompt(scene: string, style?: ImageStyle): string;

  /**
   * Generate an image from a scene by building a prompt and calling image generator
   * Includes character consistency management when storyId is provided
   * @param scene - The scene text to generate an image for
   * @param style - Style preferences for the generated image
   * @param storyId - Story ID for character tracking and consistency
   * @returns Generated image with metadata
   */
  generateImageFromScene(
    scene: string,
    style?: ImageStyle,
    storyId?: string
  ): Promise<GeneratedImage>;
}
