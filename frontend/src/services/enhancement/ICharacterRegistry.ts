/**
 * Character Registry Interface
 * Manages character detection, tracking, and context for image generation
 */

/**
 * Character entity
 */
export interface Character {
  id: string;
  work_id: string;
  name: string | null;
  short_desc: string | null;
  aliases: string[];
  status: 'candidate' | 'confirmed' | 'ignored' | 'merged';
  confidence: number;
  created_at: string;
  updated_at: string;
}

/**
 * Character context for prompt building
 */
export interface CharacterContext {
  characters: Character[];
  metadata?: Record<string, unknown>;
}

export interface ICharacterRegistry {
  /**
   * Detect characters from text using AI/NLP
   * @param text - The text to analyze for character mentions
   * @returns Array of detected characters with confidence scores
   */
  detectCharacters(text: string): Promise<Character[]>;

  /**
   * Get character context for prompt building
   * @param characterIds - IDs of characters to include in context
   * @returns Character context with descriptions and metadata
   */
  getCharacterContext(characterIds: string[]): Promise<CharacterContext>;

  /**
   * Register or update a character in the registry
   * @param name - Character name
   * @param description - Character description
   * @param workId - The work/story the character belongs to
   * @returns The created or updated character
   */
  registerCharacter(
    name: string,
    description: string,
    workId: string
  ): Promise<Character>;

  /**
   * Get all characters relevant to a chapter
   * @param chapterId - The chapter ID
   * @returns Array of characters mentioned in or relevant to the chapter
   */
  getCharactersForChapter(chapterId: string): Promise<Character[]>;
}
