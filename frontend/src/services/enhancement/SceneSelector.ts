/**
 * Scene Selector
 * Handles extraction and selection of scenes from text
 */

import type {
  ISceneSelector,
  SceneSelectionResult,
  SelectedScene,
} from './ISceneSelector';
import type { ITextAIClient } from './ITextAIClient';

export class SceneSelector implements ISceneSelector {
  constructor(private textAI: ITextAIClient) {}

  /**
   * Extract visually compelling scenes from text
   * @param text - The text to extract scenes from
   * @returns Result containing selected scenes and metadata
   */
  async selectScenes(text: string): Promise<SceneSelectionResult> {
    // 1. Build prompt for scene extraction
    const prompt = this.buildSceneExtractionPrompt(text);

    // 2. Call AI to extract scenes
    const response = await this.textAI.generateText(prompt);

    // 3. Parse AI response into structured scenes
    const scenes = this.parseSceneResponse(response, text);

    return {
      scenes,
      sceneCount: scenes.length
    };
  }

  /**
   * Build prompt for AI to extract visually descriptive scenes
   * AI determines appropriate number of scenes based on text length
   * @param text - The chapter text
   * @returns The constructed prompt
   */
  private buildSceneExtractionPrompt(text: string): string {
    const wordCount = text.split(/\s+/).length;

    return `You are analyzing a chapter of a novel to identify the most visually descriptive and important scenes for illustration.

The chapter is approximately ${wordCount} words long. Based on this length, determine an appropriate number of scenes to extract (typically 1 scene per 500-1000 words, minimum 2, maximum 8).

Extract scenes that would make compelling images. Each scene should:
- Be visually descriptive (settings, actions, character appearances)
- Represent key moments in the narrative
- Be self-contained enough to illustrate
- Be substantial enough to generate a detailed image (at least 1-2 sentences)

For each scene, provide:
1. The exact text snippet from the chapter (verbatim, not summarized)
2. A brief reason why this scene is visually compelling

Format your response as JSON:
{
  "scenes": [
    {
      "text": "exact text from chapter",
      "reason": "why this is visually compelling"
    }
  ]
}

Chapter text:
${text}`;
  }

  /**
   * Parse AI response into structured scene objects
   * @param response - Raw AI response (expected to be JSON)
   * @param originalText - Original chapter text to find positions
   * @returns Array of selected scenes with positions
   */
  private parseSceneResponse(response: string, originalText: string): SelectedScene[] {
    try {
      const parsed = JSON.parse(response);
      const scenes: SelectedScene[] = [];

      for (const scene of parsed.scenes || []) {
        const sceneText = scene.text;
        const startPosition = originalText.indexOf(sceneText);

        if (startPosition !== -1) {
          scenes.push({
            sceneText,
            startPosition,
            endPosition: startPosition + sceneText.length
          });
        }
      }

      return scenes;
    } catch (error) {
      throw new Error(`Failed to parse scene extraction response: ${error}`);
    }
  }
}

