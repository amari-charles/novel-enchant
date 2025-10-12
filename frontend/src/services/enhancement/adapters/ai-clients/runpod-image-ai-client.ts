/**
 * RunPod Image AI Client
 * Calls Supabase Edge Function to securely generate images via RunPod SDXL
 * API keys stay server-side for security
 */

import { supabase } from '@/lib/supabase';

import type { IImageAIClient } from './i-image-ai-client';

interface GenerateImageResponse {
  imageData: string; // base64 encoded image
  mimeType: string;
  jobId: string;
}

interface GenerateImageError {
  error: string;
}

export class RunPodImageAIClient implements IImageAIClient {
  /**
   * Generate an image from a text prompt
   * Calls Supabase Edge Function which handles RunPod API calls securely
   * @param prompt - The text description of the image to generate
   * @returns Data URL of the generated image
   */
  async generateImage(prompt: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke<GenerateImageResponse | GenerateImageError>(
      'generate-image',
      {
        body: { prompt }
      }
    );

    if (error) {
      throw new Error(`Image generation failed: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from image generation');
    }

    if ('error' in data) {
      throw new Error(`Image generation failed: ${data.error}`);
    }

    // Convert base64 to data URL
    const dataUrl = `data:${data.mimeType};base64,${data.imageData}`;
    return dataUrl;
  }
}
