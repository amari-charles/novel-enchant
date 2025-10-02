/**
 * Prompt Builder Interface
 * Defines the contract for building prompts from scene context
 */

import type { CharacterRegistryContext } from './ISceneSelector';
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
   * Build a prompt for image generation from a scene
   * @param scene - The scene text
   * @param characterRegistryContext - Optional context about characters
   * @param style - Style preferences
   * @returns The constructed prompt string
   */
  buildPrompt(
    scene: string,
    characterRegistryContext?: CharacterRegistryContext,
    style?: ImageStyle
  ): string;

  /**
   * Generate an image from a scene by building a prompt and calling image generator
   * @param scene - The scene text to generate an image for
   * @param characterRegistryContext - Optional context about characters in the scene
   * @param style - Style preferences for the generated image
   * @returns Generated image with metadata
   */
  generateImageFromScene(
    scene: string,
    characterRegistryContext?: CharacterRegistryContext,
    style?: ImageStyle
  ): Promise<GeneratedImage>;
}
