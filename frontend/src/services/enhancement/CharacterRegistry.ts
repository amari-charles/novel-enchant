/**
 * Character Registry
 * Manages character detection, tracking, and context for image generation
 */

import type {
  ICharacterRegistry,
  Character,
  CharacterContext,
  SceneCharacterAnalysis,
} from './ICharacterRegistry';
import type { ITextAIClient } from './ITextAIClient';
import type { ICharacterRepository } from './repositories/ICharacterRepository';

export class CharacterRegistry implements ICharacterRegistry {
  constructor(
    private textAI: ITextAIClient,
    private characterRepository: ICharacterRepository
  ) {}

  /**
   * Detect characters from text using AI/NLP
   * @param text - The text to analyze for character mentions
   * @returns Array of detected characters with confidence scores
   */
  async detectCharacters(_text: string): Promise<Character[]> {
    // TODO: Implement character detection logic
    // Could use NLP/AI to extract character names and descriptions
    throw new Error('Not implemented');
  }

  /**
   * Identify which characters appear in a specific scene
   * Checks against existing registry and detects new characters
   * Returns only character IDs for efficiency (use getVisualDescriptions to fetch details)
   */
  async identifyCharactersInScene(
    sceneText: string,
    storyId: string
  ): Promise<SceneCharacterAnalysis> {
    // 1. Get all known characters for this story (just names and IDs for AI matching)
    const allCharacters = await this.characterRepository.getByStoryId(storyId);

    // 2. Use AI to identify which characters appear in the scene
    const prompt = this.buildCharacterIdentificationPrompt(sceneText, allCharacters);
    const response = await this.textAI.generateText(prompt);
    const analysis = this.parseCharacterAnalysis(response, allCharacters);

    return analysis;
  }

  /**
   * Get visual descriptions for characters to maintain consistency
   * Returns map of character name to visual description
   */
  async getVisualDescriptions(characterIds: string[]): Promise<Map<string, string>> {
    const descriptions = new Map<string, string>();

    for (const id of characterIds) {
      const character = await this.characterRepository.get(id);
      if (character && character.name && character.short_desc) {
        descriptions.set(character.name, character.short_desc);
      }
    }

    return descriptions;
  }

  /**
   * Register new characters discovered in a scene
   */
  async registerNewCharacters(
    characters: Array<{ name: string; visualDescription: string }>,
    storyId: string
  ): Promise<Character[]> {
    const created: Character[] = [];

    for (const char of characters) {
      const newCharacter = await this.characterRepository.create({
        story_id: storyId,
        name: char.name,
        short_desc: char.visualDescription,
        aliases: [],
        status: 'confirmed',
        confidence: 0.9 // High confidence since AI detected them
      });
      created.push(newCharacter);
    }

    return created;
  }

  /**
   * Get character context for prompt building
   * @param characterIds - IDs of characters to include in context
   * @returns Character context with descriptions and metadata
   */
  async getCharacterContext(_characterIds: string[]): Promise<CharacterContext> {
    // TODO: Implement character context retrieval
    // Fetch character details from database and format for prompt building
    throw new Error('Not implemented');
  }

  /**
   * Register or update a character in the registry
   * @param name - Character name
   * @param description - Character description
   * @param workId - The work/story the character belongs to
   * @returns The created or updated character
   */
  async registerCharacter(
    _name: string,
    _description: string,
    _workId: string
  ): Promise<Character> {
    // TODO: Implement character registration
    // Create or update character record in database
    throw new Error('Not implemented');
  }

  /**
   * Get all characters relevant to a chapter
   * @param chapterId - The chapter ID
   * @returns Array of characters mentioned in or relevant to the chapter
   */
  async getCharactersForChapter(_chapterId: string): Promise<Character[]> {
    // TODO: Implement chapter character retrieval
    // Analyze chapter text and return relevant characters
    throw new Error('Not implemented');
  }

  /**
   * Build prompt for AI to identify characters in a scene
   */
  private buildCharacterIdentificationPrompt(
    sceneText: string,
    knownCharacters: Character[]
  ): string {
    const knownCharList = knownCharacters
      .map(c => `- ${c.name}: ${c.short_desc || 'No description'}`)
      .join('\n');

    return `You are analyzing a scene from a novel to identify which characters appear in it.

Known characters in this story:
${knownCharList || 'None yet'}

Scene text:
${sceneText}

Identify:
1. Which known characters appear in this scene
2. Any new characters mentioned that aren't in the known list

For new characters, provide a brief visual description based on how they're described in the scene.

Format your response as JSON:
{
  "knownCharacters": ["character name 1", "character name 2"],
  "newCharacters": [
    {
      "name": "character name",
      "visualDescription": "brief visual description for image generation"
    }
  ]
}`;
  }

  /**
   * Parse AI response into structured character analysis
   * Returns character IDs instead of full objects for efficiency
   */
  private parseCharacterAnalysis(
    response: string,
    allCharacters: Character[]
  ): SceneCharacterAnalysis {
    try {
      // Strip markdown code blocks if present (OpenAI often wraps JSON in ```json ... ```)
      let cleanedResponse = response.trim();

      // Remove ```json or ``` wrappers
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse
          .replace(/^```(?:json)?\n?/, '') // Remove opening ```json
          .replace(/\n?```$/, '');          // Remove closing ```
      }

      const parsed = JSON.parse(cleanedResponse);

      // Map known character names to character IDs
      const knownCharacterIds = allCharacters
        .filter(char => parsed.knownCharacters?.includes(char.name))
        .map(char => char.id);

      const newCharacters = parsed.newCharacters || [];

      return {
        knownCharacterIds,
        newCharacters
      };
    } catch (error) {
      console.error('Character analysis parsing error:', error);
      console.error('Response was:', response);
      throw new Error(`Failed to parse character analysis: ${error}`);
    }
  }
}
