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
  /** The paragraph index after which this scene ends (where the image should be placed) */
  afterParagraphIndex: number;
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

export interface ISceneSelector {
  /**
   * Extract visually compelling scenes from text
   * @param text - The text to extract scenes from
   * @returns Result containing selected scenes and metadata
   */
  selectScenes(text: string): Promise<SceneSelectionResult>;
}
