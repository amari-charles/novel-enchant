/**
 * Scene Selector
 * Handles extraction and selection of scenes from text
 */

import type {
  ISceneSelector,
  SceneSelectionResult,
  CharacterRegistryContext,
} from './ISceneSelector';

export class SceneSelector implements ISceneSelector {
  /**
   * Extract scenes from text input
   * @param text - The text to extract scenes from
   * @param characterRegistryContext - Optional context about characters in the text
   * @returns Result containing selected scenes and metadata
   */
  async selectScenes(
    _text: string,
    _characterRegistryContext?: CharacterRegistryContext
  ): Promise<SceneSelectionResult> {
    // TODO: Implement scene selection logic
    throw new Error('Not implemented');
  }
}
