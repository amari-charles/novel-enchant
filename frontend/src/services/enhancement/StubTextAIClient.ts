/**
 * Stub Text AI Client for development/testing
 * Returns mock responses without calling an actual AI API
 */

import type { ITextAIClient } from './ITextAIClient';

export class StubTextAIClient implements ITextAIClient {
  async generateText(_prompt: string): Promise<string> {
    // Return a mock JSON response with 3 scenes
    return JSON.stringify({
      scenes: [
        {
          text: 'The hero stood at the edge of the cliff, sword gleaming in the moonlight.',
          reason: 'Dramatic moment with strong visual elements'
        },
        {
          text: 'The ancient library stretched endlessly, dust motes dancing in shafts of golden light.',
          reason: 'Atmospheric setting with rich visual detail'
        },
        {
          text: 'She turned to face him, eyes blazing with determination.',
          reason: 'Character moment with emotional intensity'
        }
      ]
    });
  }
}
