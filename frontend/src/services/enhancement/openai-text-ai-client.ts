/**
 * OpenAI Text AI Client
 * Uses OpenAI's GPT models for text generation tasks
 */

import type { ITextAIClient } from './i-text-ai-client';

export class OpenAITextAIClient implements ITextAIClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model: string = 'gpt-4o-mini') {
    this.apiKey = apiKey || import.meta.env.VITE_OPENAI_API_KEY || '';
    this.model = model;

    if (!this.apiKey) {
      console.warn('OpenAI API key not found. Set VITE_OPENAI_API_KEY in .env file.');
    }
  }

  async generateText(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required. Set VITE_OPENAI_API_KEY in your .env file.');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      return content;
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw error;
    }
  }
}
