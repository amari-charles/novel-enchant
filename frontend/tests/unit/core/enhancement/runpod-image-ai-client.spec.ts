/**
 * Unit tests for RunPodImageAIClient
 * Tests Edge Function invocation and response parsing
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';

import { supabase } from '@/lib/supabase';
import { RunPodImageAIClient } from '@/services/enhancement/adapters/ai-clients/runpod-image-ai-client';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}));

describe('RunPodImageAIClient', () => {
  const MOCK_PROMPT = 'a cozy reading nook, cinematic';
  const MOCK_JOB_ID = 'job-123';
  const MOCK_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const MOCK_MIME_TYPE = 'image/png';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    test('creates instance without arguments', () => {
      const client = new RunPodImageAIClient();
      expect(client).toBeDefined();
    });
  });

  describe('generateImage', () => {
    test('invokes Edge Function and returns data URL', async () => {
      const client = new RunPodImageAIClient();
      const expectedDataUrl = `data:${MOCK_MIME_TYPE};base64,${MOCK_BASE64}`;

      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: {
          imageData: MOCK_BASE64,
          mimeType: MOCK_MIME_TYPE,
          jobId: MOCK_JOB_ID
        },
        error: null
      });

      const result = await client.generateImage(MOCK_PROMPT);

      expect(result).toBe(expectedDataUrl);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('generate-image', {
        body: { prompt: MOCK_PROMPT }
      });
    });

    test('throws if Edge Function returns error', async () => {
      const client = new RunPodImageAIClient();

      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: null,
        error: new Error('Function invocation failed')
      });

      await expect(client.generateImage(MOCK_PROMPT)).rejects.toThrow(
        'Image generation failed: Function invocation failed'
      );
    });

    test('throws if Edge Function returns no data', async () => {
      const client = new RunPodImageAIClient();

      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: null,
        error: null
      });

      await expect(client.generateImage(MOCK_PROMPT)).rejects.toThrow(
        'No data returned from image generation'
      );
    });

    test('throws if Edge Function returns error in data', async () => {
      const client = new RunPodImageAIClient();

      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: { error: 'RunPod API key not configured' },
        error: null
      });

      await expect(client.generateImage(MOCK_PROMPT)).rejects.toThrow(
        'Image generation failed: RunPod API key not configured'
      );
    });

    test('constructs correct data URL with different MIME types', async () => {
      const client = new RunPodImageAIClient();

      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: {
          imageData: MOCK_BASE64,
          mimeType: 'image/jpeg',
          jobId: MOCK_JOB_ID
        },
        error: null
      });

      const result = await client.generateImage(MOCK_PROMPT);

      expect(result).toBe(`data:image/jpeg;base64,${MOCK_BASE64}`);
    });
  });
});
