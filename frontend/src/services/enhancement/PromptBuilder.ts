/**
 * Prompt Builder
 * Handles building prompts from scene context and orchestrating image generation
 * Manages character consistency through the CharacterRegistry
 */

import type { IPromptBuilder, ImageStyle, SceneImageResult } from './IPromptBuilder';
import type { IImageGenerator, GeneratedImage } from './IImageGenerator';
import type { ICharacterRegistry, SceneCharacterAnalysis, Character } from './ICharacterRegistry';

export class PromptBuilder implements IPromptBuilder {
  constructor(
    private imageGenerator: IImageGenerator,
    private characterRegistry: ICharacterRegistry
  ) {}

  /**
   * Build a simple prompt for image generation from a scene
   * For character consistency, use generateImageFromScene() instead
   * @param scene - The scene text
   * @param style - Style preferences
   * @returns The constructed prompt string
   */
  buildPrompt(scene: string, style?: ImageStyle): string {
    // Simple prompt building without character consistency
    // For full character consistency, use generateImageFromScene()
    let prompt = scene;

    // Add style preferences
    const styleElements: string[] = [];

    if (style?.artStyle) {
      styleElements.push(`${style.artStyle} art style`);
    }

    if (style?.mood) {
      styleElements.push(`${style.mood} mood`);
    }

    if (style?.colorPalette) {
      styleElements.push(`${style.colorPalette} color palette`);
    }

    if (styleElements.length > 0) {
      prompt += `\n\nStyle: ${styleElements.join(', ')}`;
    }

    prompt += '\n\nHigh quality, detailed illustration, professional composition';

    return prompt;
  }

  /**
   * Generate an image from a scene with full character consistency management
   * @param scene - The scene text to generate an image for
   * @param style - Style preferences for the generated image
   * @param storyId - Story ID for character consistency (required for character tracking)
   * @returns Generated image with metadata and character IDs
   */
  async generateImageFromScene(
    scene: string,
    style?: ImageStyle,
    storyId?: string
  ): Promise<SceneImageResult> {
    // 1. Identify which characters appear in scene (returns IDs only)
    const characterAnalysis = storyId
      ? await this.identifyCharactersInScene(scene, storyId)
      : undefined;

    // 2. Fetch visual descriptions for identified characters
    const characterDescriptions = characterAnalysis?.knownCharacterIds.length
      ? await this.getVisualDescriptions(characterAnalysis.knownCharacterIds)
      : new Map<string, string>();

    // 3. Build prompt with character consistency
    const prompt = await this.buildPromptWithCharacterConsistency(
      scene,
      characterDescriptions,
      characterAnalysis?.newCharacters || [],
      style
    );

    // 4. Generate image
    const generatedImage = await this.imageGenerator.generateImage(prompt);

    // 5. Register new characters discovered in the scene and collect their IDs
    const newCharacterRecords = storyId && characterAnalysis?.newCharacters.length
      ? await this.registerNewCharacters(characterAnalysis.newCharacters, storyId)
      : [];

    // 6. Combine all character IDs (known + newly registered)
    const allCharacterIds = [
      ...(characterAnalysis?.knownCharacterIds || []),
      ...newCharacterRecords.map(char => char.id)
    ];

    return {
      image: generatedImage,
      characterIds: allCharacterIds
    };
  }

  /**
   * Step 1: Identify which characters appear in the scene
   */
  private async identifyCharactersInScene(
    scene: string,
    storyId: string
  ): Promise<SceneCharacterAnalysis> {
    return await this.characterRegistry.identifyCharactersInScene(scene, storyId);
  }

  /**
   * Step 2: Get visual descriptions for specific characters
   */
  private async getVisualDescriptions(
    characterIds: string[]
  ): Promise<Map<string, string>> {
    return await this.characterRegistry.getVisualDescriptions(characterIds);
  }

  /**
   * Step 3: Build prompt incorporating character visual descriptions for consistency
   */
  private async buildPromptWithCharacterConsistency(
    scene: string,
    characterDescriptions: Map<string, string>,
    newCharacters: Array<{ name: string; visualDescription: string }>,
    style?: ImageStyle
  ): Promise<string> {
    let prompt = scene;

    // Add known character visual descriptions for consistency
    if (characterDescriptions.size > 0) {
      prompt += '\n\nMaintain visual consistency for these characters:';
      for (const [characterName, description] of characterDescriptions.entries()) {
        prompt += `\n- ${characterName}: ${description}`;
      }
    }

    // Add new character visual descriptions
    if (newCharacters.length > 0) {
      prompt += '\n\nNew characters appearing in this scene:';
      for (const char of newCharacters) {
        prompt += `\n- ${char.name}: ${char.visualDescription}`;
      }
    }

    // Add style preferences
    const styleElements: string[] = [];

    if (style?.artStyle) {
      styleElements.push(`${style.artStyle} art style`);
    }

    if (style?.mood) {
      styleElements.push(`${style.mood} mood`);
    }

    if (style?.colorPalette) {
      styleElements.push(`${style.colorPalette} color palette`);
    }

    if (styleElements.length > 0) {
      prompt += `\n\nStyle: ${styleElements.join(', ')}`;
    }

    prompt += '\n\nHigh quality, detailed illustration, professional composition';

    return prompt;
  }

  /**
   * Step 3: Register new characters to the database
   */
  private async registerNewCharacters(
    newCharacters: Array<{ name: string; visualDescription: string }>,
    storyId: string
  ): Promise<Character[]> {
    return await this.characterRegistry.registerNewCharacters(newCharacters, storyId);
  }
}