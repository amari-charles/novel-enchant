/**
 * Scene Selector Interface
 * Defines the contract for scene selection operations
 */

/**
 * Represents a selected scene with its metadata
 */
export interface SelectedScene {
  /** The text content of the selected scene */
  sceneText: string;
  /** The starting position of the scene within the source text */
  startPosition: number;
  /** The ending position of the scene within the source text */
  endPosition: number;
}

/**
 * Result of scene selection operation
 */
export interface SceneSelectionResult {
  /** Array of selected scenes */
  scenes: SelectedScene[];
  /** Total number of scenes created */
  sceneCount: number;
}

/**
 * Optional context about characters for scene selection
 */
export interface CharacterRegistryContext {
  /** List of character names to consider when selecting scenes */
  characters?: string[];
  /** Additional metadata about characters */
  metadata?: Record<string, unknown>;
}

export interface ISceneSelector {
  /**
   * Extract scenes from text input
   * @param text - The text to extract scenes from
   * @param characterRegistryContext - Optional context about characters in the text
   * @returns Result containing selected scenes and metadata
   */
  selectScenes(
    text: string,
    characterRegistryContext?: CharacterRegistryContext
  ): Promise<SceneSelectionResult>;
}
