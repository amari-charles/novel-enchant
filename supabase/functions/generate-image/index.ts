/**
 * Supabase Edge Function: generate-image
 * Securely calls RunPod SDXL serverless endpoint
 * Keeps API keys server-side and prevents exposure to browser
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const RUNPOD_API_BASE = 'https://api.runpod.ai/v2';
const POLL_INITIAL_DELAY = 1200; // 1.2s
const POLL_MAX_DELAY = 2500; // 2.5s
const POLL_BACKOFF_FACTOR = 1.2;
const POLL_TIMEOUT = 120_000; // 120s

interface GenerateImageRequest {
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
  guidance_scale?: number;
  num_images?: number;
  seed?: number | null;
}

interface RunPodJobSubmitResponse {
  id: string;
  status: string;
}

interface RunPodJobStatusResponse {
  id: string;
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  output?: unknown;
  error?: string;
}

/**
 * Sleep utility for polling delays
 */
const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Submit a job to RunPod
 */
async function submitJob(
  apiKey: string,
  endpointId: string,
  input: GenerateImageRequest
): Promise<string> {
  const url = `${RUNPOD_API_BASE}/${endpointId}/run`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: {
        prompt: input.prompt,
        width: input.width ?? 512,
        height: input.height ?? 512,
        num_inference_steps: input.steps ?? 8,
        guidance_scale: input.guidance_scale ?? 0.0,
        num_images: input.num_images ?? 1,
        seed: input.seed ?? null
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`RunPod job submission failed: ${response.status} ${text}`);
  }

  const data = await response.json() as RunPodJobSubmitResponse;
  return data.id;
}

/**
 * Poll a job until completion or failure
 */
async function pollJob(
  apiKey: string,
  endpointId: string,
  jobId: string
): Promise<unknown> {
  const url = `${RUNPOD_API_BASE}/${endpointId}/status/${jobId}`;
  const startTime = Date.now();
  let delay = POLL_INITIAL_DELAY;

  while (true) {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`RunPod status check failed: ${response.status} ${text}`);
    }

    const status = await response.json() as RunPodJobStatusResponse;

    if (status.status === 'COMPLETED') {
      return status.output;
    }

    if (status.status === 'FAILED') {
      throw new Error(status.error || 'RunPod job failed');
    }

    // Check timeout
    if (Date.now() - startTime > POLL_TIMEOUT) {
      throw new Error('RunPod job timed out after 120 seconds');
    }

    // Wait before next poll
    await sleep(delay);
    delay = Math.min(Math.round(delay * POLL_BACKOFF_FACTOR), POLL_MAX_DELAY);
  }
}

/**
 * Convert data URL to base64 string
 */
function extractBase64(dataUrl: string): string {
  return dataUrl.replace(/^data:image\/\w+;base64,/, '');
}

/**
 * Fetch image from URL and convert to base64
 */
async function fetchToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Convert to base64
  const base64 = btoa(String.fromCharCode(...bytes));
  const mimeType = response.headers.get('content-type') || 'image/png';

  return { base64, mimeType };
}

/**
 * Parse RunPod output to base64 image
 */
async function parseOutput(output: unknown): Promise<{ base64: string; mimeType: string }> {
  // Handle direct data URL
  if (
    typeof output === 'object' &&
    output !== null &&
    'image' in output &&
    typeof output.image === 'string' &&
    output.image.startsWith('data:image/')
  ) {
    const mimeType = output.image.match(/data:(image\/\w+);base64,/)?.[1] || 'image/png';
    return {
      base64: extractBase64(output.image),
      mimeType
    };
  }

  // Handle HTTP URL
  if (
    typeof output === 'object' &&
    output !== null &&
    'url' in output &&
    typeof output.url === 'string'
  ) {
    return fetchToBase64(output.url);
  }

  // Handle array of URLs/data URLs
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    if (typeof first === 'string') {
      if (first.startsWith('http')) {
        return fetchToBase64(first);
      }
      if (first.startsWith('data:image/')) {
        const mimeType = first.match(/data:(image\/\w+);base64,/)?.[1] || 'image/png';
        return {
          base64: extractBase64(first),
          mimeType
        };
      }
    }
  }

  // Handle { images: [...] }
  if (
    typeof output === 'object' &&
    output !== null &&
    'images' in output &&
    Array.isArray(output.images) &&
    output.images.length > 0
  ) {
    const first = output.images[0];
    if (typeof first === 'string') {
      if (first.startsWith('http')) {
        return fetchToBase64(first);
      }
      if (first.startsWith('data:image/')) {
        const mimeType = first.match(/data:(image\/\w+);base64,/)?.[1] || 'image/png';
        return {
          base64: extractBase64(first),
          mimeType
        };
      }
    }
  }

  throw new Error(
    `Unknown RunPod output format. Expected data URL, HTTP URL, or array. Got: ${JSON.stringify(output)}`
  );
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get RunPod credentials from environment
    const apiKey = Deno.env.get('RUNPOD_API_KEY');
    const endpointId = Deno.env.get('RUNPOD_ENDPOINT_ID');

    if (!apiKey || !endpointId) {
      return new Response(
        JSON.stringify({ error: 'RunPod credentials not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const body = await req.json() as GenerateImageRequest;

    if (!body.prompt || typeof body.prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid prompt' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Submit job and poll for completion
    const jobId = await submitJob(apiKey, endpointId, body);
    const output = await pollJob(apiKey, endpointId, jobId);
    const { base64, mimeType } = await parseOutput(output);

    // Return base64 image
    return new Response(
      JSON.stringify({
        imageData: base64,
        mimeType,
        jobId
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error generating image:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Image generation failed'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
