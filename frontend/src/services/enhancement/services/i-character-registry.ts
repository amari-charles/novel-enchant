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

/**
 * Scene character analysis result
 * Contains both known and new characters found in a scene
 */
export interface SceneCharacterAnalysis {
  /** IDs of known characters found in the scene (already in registry) */
  knownCharacterIds: string[];
  /** New characters detected in the scene (not yet in registry) */
  newCharacters: Array<{
    name: string;
    visualDescription: string;
  }>;
}

export interface ICharacterRegistry {
  /**
   * Detect characters from text using AI/NLP
   * @param text - The text to analyze for character mentions
   * @returns Array of detected characters with confidence scores
   */
  detectCharacters(text: string): Promise<Character[]>;

  /**
   * Identify which characters appear in a specific scene
   * Checks against existing registry and detects new characters
   * @param sceneText - The scene text to analyze
   * @param storyId - The story ID to scope character search
   * @returns Analysis containing known and new characters
   */
  identifyCharactersInScene(sceneText: string, storyId: string): Promise<SceneCharacterAnalysis>;

  /**
   * Get visual descriptions for characters to maintain consistency
   * @param characterIds - IDs of characters to get descriptions for
   * @returns Map of character ID to visual description
   */
  getVisualDescriptions(characterIds: string[]): Promise<Map<string, string>>;

  /**
   * Register new characters discovered in a scene
   * @param characters - Array of new characters with names and descriptions
   * @param storyId - The story ID
   * @returns Array of created character records
   */
  registerNewCharacters(
    characters: Array<{ name: string; visualDescription: string }>,
    storyId: string
  ): Promise<Character[]>;

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
