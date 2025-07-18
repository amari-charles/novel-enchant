/**
 * AI Client - OpenAI and Replicate API clients
 */

import { AIAPIError, validateRequired } from '../../../shared/errors.ts';
import { API_ENDPOINTS, AI_MODELS, ENV_VARS } from '../../../shared/constants.ts';
import { withRetry } from '../../../shared/errors.ts';

// ============================================================================
// OPENAI CLIENT
// ============================================================================

export class OpenAIClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = Deno.env.get(ENV_VARS.OPENAI_API_KEY) || '';
    this.baseUrl = API_ENDPOINTS.OPENAI;
    
    if (!this.apiKey) {
      throw new AIAPIError('OpenAI API key not configured');
    }
  }

  async createChatCompletion(
    messages: Array<{ role: string; content: string }>,
    model: string = AI_MODELS.OPENAI.SCENE_EXTRACTION,
    temperature: number = 0.7,
    maxTokens: number = 2000
  ): Promise<string> {
    validateRequired(messages, 'messages');
    
    const requestBody = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    return withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new AIAPIError(
          `OpenAI API error: ${response.status} ${response.statusText}`,
          error,
          response.status >= 500 // Retry on server errors
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new AIAPIError('No content returned from OpenAI', data);
      }

      return content;
    });
  }

  async extractScenes(
    chapterText: string,
    storyContext: {
      title: string;
      genre?: string;
      stylePreset: string;
      existingCharacters: string[];
      existingLocations: string[];
    },
    maxScenes: number = 5
  ): Promise<Array<{
    title: string;
    description: string;
    excerpt: string;
    visualScore: number;
    impactScore: number;
    timeOfDay?: string;
    emotionalTone?: string;
    charactersPresent: string[];
    location?: string;
  }>> {
    const prompt = `You are an expert at analyzing fiction and identifying the most visually compelling scenes for illustration. 

Story Context:
- Title: ${storyContext.title}
- Genre: ${storyContext.genre || 'General Fiction'}
- Style: ${storyContext.stylePreset}
- Known Characters: ${storyContext.existingCharacters.join(', ') || 'None yet'}
- Known Locations: ${storyContext.existingLocations.join(', ') || 'None yet'}

Analyze the following chapter text and extract the ${maxScenes} most visually compelling scenes that would make great illustrations. Focus on:
1. Visual richness and detail
2. Character interactions and expressions
3. Dramatic moments and emotional impact
4. Unique or memorable settings

For each scene, provide:
- A concise title
- A detailed visual description (2-3 sentences)
- A brief excerpt of key dialogue or narrative
- Visual score (0-1): How visually interesting/detailed is this scene?
- Impact score (0-1): How important is this scene to the story?
- Time of day (if mentioned)
- Emotional tone
- Characters present
- Location description

Return ONLY a JSON array with this exact structure:
[
  {
    "title": "Scene title",
    "description": "Detailed visual description of the scene",
    "excerpt": "Key dialogue or narrative excerpt",
    "visualScore": 0.8,
    "impactScore": 0.9,
    "timeOfDay": "evening",
    "emotionalTone": "tense",
    "charactersPresent": ["Character1", "Character2"],
    "location": "Location description"
  }
]

Chapter Text:
${chapterText}`;

    const messages = [
      { role: 'system', content: 'You are an expert at analyzing fiction for visual scene extraction. Always respond with valid JSON only.' },
      { role: 'user', content: prompt }
    ];

    const response = await this.createChatCompletion(messages, AI_MODELS.OPENAI.SCENE_EXTRACTION, 0.3, 3000);
    
    try {
      const scenes = JSON.parse(response);
      if (!Array.isArray(scenes)) {
        throw new AIAPIError('Invalid response format: expected array');
      }
      return scenes;
    } catch (error) {
      throw new AIAPIError('Failed to parse scene extraction response', { response, error });
    }
  }

  async extractEntities(
    sceneText: string,
    existingEntities: Array<{ name: string; type: 'character' | 'location'; description: string }>
  ): Promise<{
    characters: Array<{ name: string; description: string; aliases: string[] }>;
    locations: Array<{ name: string; description: string; type: string }>;
  }> {
    const existingCharacters = existingEntities.filter(e => e.type === 'character');
    const existingLocations = existingEntities.filter(e => e.type === 'location');

    const prompt = `Analyze the following scene text and identify any new characters or locations that haven't been mentioned before.

Existing Characters: ${existingCharacters.map(c => c.name).join(', ') || 'None'}
Existing Locations: ${existingLocations.map(l => l.name).join(', ') || 'None'}

For each NEW character found, provide:
- Name (primary name they're referred to as)
- Description (physical appearance, clothing, notable features)
- Aliases (any alternative names, nicknames, or titles)

For each NEW location found, provide:
- Name
- Description (visual details, atmosphere, size, etc.)
- Type (indoor/outdoor/city/building/natural/fantasy/vehicle)

Return ONLY a JSON object with this exact structure:
{
  "characters": [
    {
      "name": "Character Name",
      "description": "Physical description and appearance",
      "aliases": ["nickname", "title"]
    }
  ],
  "locations": [
    {
      "name": "Location Name",
      "description": "Visual description of the location",
      "type": "indoor"
    }
  ]
}

Scene Text:
${sceneText}`;

    const messages = [
      { role: 'system', content: 'You are an expert at identifying characters and locations in fiction. Always respond with valid JSON only.' },
      { role: 'user', content: prompt }
    ];

    const response = await this.createChatCompletion(messages, AI_MODELS.OPENAI.ENTITY_EXTRACTION, 0.2, 2000);
    
    try {
      const entities = JSON.parse(response);
      return {
        characters: entities.characters || [],
        locations: entities.locations || []
      };
    } catch (error) {
      throw new AIAPIError('Failed to parse entity extraction response', { response, error });
    }
  }

  async assessImageQuality(
    imageUrl: string,
    originalPrompt: string,
    sceneDescription: string
  ): Promise<{
    qualityScore: number;
    issues: string[];
    suggestions: string[];
  }> {
    const prompt = `Assess the quality of an AI-generated image based on the prompt and scene description.

Original Prompt: ${originalPrompt}
Scene Description: ${sceneDescription}
Image URL: ${imageUrl}

Evaluate the image on:
1. Prompt adherence (does it match what was requested?)
2. Technical quality (composition, lighting, detail)
3. Artistic merit (aesthetics, visual appeal)
4. Character/object consistency
5. Overall coherence

Provide a quality score from 0-1 and identify any issues or suggestions for improvement.

Return ONLY a JSON object with this structure:
{
  "qualityScore": 0.85,
  "issues": ["list of specific issues found"],
  "suggestions": ["list of specific improvement suggestions"]
}`;

    const messages = [
      { role: 'system', content: 'You are an expert at assessing AI-generated image quality. Always respond with valid JSON only.' },
      { role: 'user', content: prompt }
    ];

    const response = await this.createChatCompletion(messages, AI_MODELS.OPENAI.QUALITY_ASSESSMENT, 0.2, 1000);
    
    try {
      return JSON.parse(response);
    } catch (error) {
      throw new AIAPIError('Failed to parse quality assessment response', { response, error });
    }
  }
}

// ============================================================================
// REPLICATE CLIENT
// ============================================================================

export class ReplicateClient {
  private apiToken: string;
  private baseUrl: string;

  constructor() {
    this.apiToken = Deno.env.get(ENV_VARS.REPLICATE_API_TOKEN) || '';
    this.baseUrl = API_ENDPOINTS.REPLICATE;
    
    if (!this.apiToken) {
      throw new AIAPIError('Replicate API token not configured');
    }
  }

  async createPrediction(
    model: string,
    input: Record<string, any>
  ): Promise<{ id: string; status: string; urls?: { get: string; cancel: string } }> {
    validateRequired(model, 'model');
    validateRequired(input, 'input');

    const requestBody = {
      version: model,
      input,
    };

    return withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new AIAPIError(
          `Replicate API error: ${response.status} ${response.statusText}`,
          error,
          response.status >= 500
        );
      }

      return await response.json();
    });
  }

  async getPrediction(predictionId: string): Promise<{
    id: string;
    status: string;
    output?: string | string[];
    error?: string;
    logs?: string;
  }> {
    validateRequired(predictionId, 'predictionId');

    return withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${this.apiToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new AIAPIError(
          `Replicate API error: ${response.status} ${response.statusText}`,
          error,
          response.status >= 500
        );
      }

      return await response.json();
    });
  }

  async generateImage(
    prompt: string,
    negativePrompt?: string,
    width: number = 768,
    height: number = 1024,
    steps: number = 25,
    cfgScale: number = 7.5,
    seed?: number
  ): Promise<{ predictionId: string; imageUrl?: string }> {
    validateRequired(prompt, 'prompt');

    const input = {
      prompt,
      negative_prompt: negativePrompt || '',
      width,
      height,
      num_inference_steps: steps,
      guidance_scale: cfgScale,
      num_outputs: 1,
      scheduler: 'DPM++ 2M Karras',
      apply_watermark: false,
    };

    if (seed) {
      input.seed = seed;
    }

    // Create the prediction
    const prediction = await this.createPrediction(AI_MODELS.REPLICATE.SDXL_BASE, input);

    // Poll for completion
    let result = prediction;
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      result = await this.getPrediction(result.id);
      attempts++;
    }

    if (result.status === 'failed') {
      throw new AIAPIError(`Image generation failed: ${result.error}`, result);
    }

    if (result.status !== 'succeeded') {
      throw new AIAPIError('Image generation timed out', result);
    }

    const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;

    return {
      predictionId: result.id,
      imageUrl: imageUrl || undefined,
    };
  }
}

// ============================================================================
// CLIENT FACTORY
// ============================================================================

export const createOpenAIClient = () => new OpenAIClient();
export const createReplicateClient = () => new ReplicateClient();