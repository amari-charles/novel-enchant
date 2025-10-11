/**
 * Text AI Client Interface
 * For text generation tasks (scene extraction, prompt building, analysis, etc.)
 * Implementations: OpenAI GPT, Claude, Ollama, etc.
 */

export interface ITextAIClient {
  /**
   * Generate text completion from a prompt
   * @param prompt - The prompt to send to the AI
   * @returns The generated text response
   */
  generateText(prompt: string): Promise<string>;
}
