/**
 * Supabase Edge Function: Generate Image
 * Generates AI images for story scenes using SDXL/Stable Diffusion
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateImageRequest {
  jobId: string;
  sceneId: string;
  prompt: string;
  style?: string;
  negativePrompt?: string;
  retryAttempt?: number;
}

interface ImageGenerationResponse {
  url: string;
  takeId: string;
  prompt: string;
  generatedAt: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    const {
      jobId,
      sceneId,
      prompt,
      style = 'cinematic',
      negativePrompt = getDefaultNegativePrompt(),
      retryAttempt = 0,
    } = await req.json() as GenerateImageRequest;

    if (!jobId || !sceneId || !prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: jobId, sceneId, and prompt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get job details or handle retry scenarios
    let job;
    const { data: existingJob, error: jobError } = await supabase
      .from('enhance_jobs')
      .select('user_id, status')
      .eq('id', jobId)
      .single();

    if (jobError || !existingJob) {
      // For retry scenarios, get user from auth context
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extract user from token
      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: userError } = await supabase.auth.getUser(token);

      if (userError || !userData.user) {
        return new Response(
          JSON.stringify({ error: 'Invalid authentication' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      job = { user_id: userData.user.id, status: 'retry' };
    } else {
      job = existingJob;
    }

    // Enhance prompt with style
    const enhancedPrompt = enhancePromptWithStyle(prompt, style);

    // Generate image (mock implementation for now)
    const imageResult = await generateImageWithProvider(
      enhancedPrompt,
      negativePrompt,
      style
    );

    if (!imageResult.success) {
      throw new Error(imageResult.error || 'Image generation failed');
    }

    // Upload to storage
    const takeId = `take_${Date.now()}`;
    const storagePath = `${job.user_id}/${jobId}/scenes/${sceneId}/${takeId}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('enhanced-copies')
      .upload(storagePath, imageResult.imageData!, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('enhanced-copies')
      .getPublicUrl(uploadData.path);

    const response: ImageGenerationResponse = {
      url: urlData.publicUrl,
      takeId,
      prompt: enhancedPrompt,
      generatedAt: new Date().toISOString(),
    };

    // Only update job if it's a real job (not a retry)
    if (job.status !== 'retry') {
      await updateJobWithImage(supabase, jobId, sceneId, response);
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...response,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Image generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Image generation failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function getDefaultNegativePrompt(): string {
  return 'text, watermark, signature, logo, copyright, low quality, blurry, ' +
         'distorted, disfigured, bad anatomy, bad proportions, extra limbs, ' +
         'cloned face, ugly, poorly drawn, mutation, duplicate';
}

function enhancePromptWithStyle(prompt: string, style: string): string {
  const styleModifiers: Record<string, string> = {
    cinematic: 'cinematic lighting, film grain, depth of field, dramatic composition',
    illustration: 'digital illustration, detailed artwork, vibrant colors',
    realistic: 'photorealistic, high detail, natural lighting, 8k resolution',
    fantasy: 'fantasy art, magical atmosphere, ethereal lighting, enchanted',
    anime: 'anime style, cel shaded, Japanese animation, expressive',
    watercolor: 'watercolor painting, soft edges, flowing colors, artistic',
    'oil-painting': 'oil painting, brushstrokes, classical art, textured',
    sketch: 'pencil sketch, line art, black and white, hand drawn',
  };

  const modifier = styleModifiers[style] || styleModifiers.cinematic;
  return `${prompt}, ${modifier}`;
}

async function generateImageWithProvider(
  prompt: string,
  negativePrompt: string,
  style: string
): Promise<{ success: boolean; imageData?: Uint8Array; error?: string }> {
  // Check which provider to use
  const provider = Deno.env.get('IMAGE_GEN_PROVIDER') || 'mock';

  switch (provider) {
    case 'mock':
      return generateMockImage(prompt);
    case 'replicate':
      return generateWithReplicate(prompt, negativePrompt);
    case 'stability':
      return generateWithStability(prompt, negativePrompt);
    case 'openai':
      return generateWithOpenAI(prompt);
    default:
      return generateMockImage(prompt);
  }
}

async function generateMockImage(prompt: string): Promise<{ success: boolean; imageData?: Uint8Array; error?: string }> {
  // Generate a simple placeholder image for development
  const svg = `
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <rect width="1024" height="1024" fill="#f0f0f0"/>
      <text x="512" y="500" font-family="Arial" font-size="24" text-anchor="middle" fill="#666">
        AI Generated Image
      </text>
      <text x="512" y="540" font-family="Arial" font-size="16" text-anchor="middle" fill="#999">
        ${prompt.slice(0, 50)}...
      </text>
    </svg>
  `;

  const encoder = new TextEncoder();
  return {
    success: true,
    imageData: encoder.encode(svg),
  };
}

async function generateWithReplicate(
  prompt: string,
  negativePrompt: string
): Promise<{ success: boolean; imageData?: Uint8Array; error?: string }> {
  const apiToken = Deno.env.get('REPLICATE_API_TOKEN');
  if (!apiToken) {
    return { success: false, error: 'Replicate API token not configured' };
  }

  try {
    // Start prediction
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
        input: {
          prompt,
          negative_prompt: negativePrompt,
          width: 1024,
          height: 1024,
          num_inference_steps: 30,
          guidance_scale: 7.5,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.statusText}`);
    }

    const prediction = await response.json();

    // Poll for completion
    let result = prediction;
    while (result.status !== 'succeeded' && result.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const pollResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${result.id}`,
        {
          headers: {
            'Authorization': `Token ${apiToken}`,
          },
        }
      );

      result = await pollResponse.json();
    }

    if (result.status === 'failed') {
      throw new Error(result.error || 'Image generation failed');
    }

    // Download image
    const imageResponse = await fetch(result.output[0]);
    const imageData = new Uint8Array(await imageResponse.arrayBuffer());

    return { success: true, imageData };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function generateWithStability(
  prompt: string,
  negativePrompt: string
): Promise<{ success: boolean; imageData?: Uint8Array; error?: string }> {
  const apiKey = Deno.env.get('STABILITY_API_KEY');
  if (!apiKey) {
    return { success: false, error: 'Stability API key not configured' };
  }

  try {
    const response = await fetch(
      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          text_prompts: [
            { text: prompt, weight: 1 },
            { text: negativePrompt, weight: -1 },
          ],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          steps: 30,
          samples: 1,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Stability API error: ${response.statusText}`);
    }

    const result = await response.json();
    const base64Image = result.artifacts[0].base64;
    const imageData = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));

    return { success: true, imageData };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function generateWithOpenAI(prompt: string): Promise<{ success: boolean; imageData?: Uint8Array; error?: string }> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    return { success: false, error: 'OpenAI API key not configured' };
  }

  try {
    console.log('Generating image with OpenAI DALL-E 3...');
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'b64_json', // Get base64 instead of URL
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.statusText} - ${error}`);
    }

    const result = await response.json();
    const base64Image = result.data[0].b64_json;

    // Convert base64 to Uint8Array
    const binaryString = atob(base64Image);
    const imageData = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      imageData[i] = binaryString.charCodeAt(i);
    }

    console.log('Successfully generated image with OpenAI');
    return { success: true, imageData };
  } catch (error) {
    console.error('OpenAI generation error:', error);
    return { success: false, error: error.message };
  }
}

async function updateJobWithImage(
  supabase: any,
  jobId: string,
  sceneId: string,
  image: ImageGenerationResponse
): Promise<void> {
  // Get current job data
  const { data: job, error: fetchError } = await supabase
    .from('enhance_jobs')
    .select('result_json')
    .eq('id', jobId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch job: ${fetchError.message}`);
  }

  // Update the specific scene with the generated image
  const resultJson = job.result_json || { chapters: [] };

  for (const chapter of resultJson.chapters) {
    for (const scene of chapter.scenes) {
      if (scene.id === sceneId) {
        scene.image_url = image.url;
        scene.status = 'generated';

        if (!scene.takes) {
          scene.takes = [];
        }

        scene.takes.push({
          id: image.takeId,
          url: image.url,
          accepted: false,
          generatedAt: image.generatedAt,
        });

        break;
      }
    }
  }

  // Update job
  const { error: updateError } = await supabase
    .from('enhance_jobs')
    .update({
      result_json: resultJson,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (updateError) {
    throw new Error(`Failed to update job: ${updateError.message}`);
  }
}