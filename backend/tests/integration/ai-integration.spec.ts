/**
 * Integration Tests for AI Services
 * These tests will FAIL until real API keys are configured
 */

import { describe, expect, test, beforeAll } from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { createOpenAIClient, createReplicateClient } from '../../functions/utilities/ai-client/index.ts';

describe('AI Integration Tests', () => {
  // These tests are expected to fail until we have real API keys
  const skipTests = !Deno.env.get('OPENAI_API_KEY') || !Deno.env.get('REPLICATE_API_TOKEN');

  describe('OpenAI Integration', () => {
    let openAIClient: ReturnType<typeof createOpenAIClient>;

    beforeAll(() => {
      if (!skipTests) {
        openAIClient = createOpenAIClient();
      }
    });

    test('should extract scenes from sample text', async () => {
      if (skipTests) {
        console.log('⚠️  Skipping test - OpenAI API key not configured');
        return;
      }

      const sampleText = `
        The old wizard stepped into the candlelit chamber, his staff glowing with ethereal light. 
        Ancient books lined the walls, their leather bindings cracked with age. 
        In the center of the room stood a crystal pedestal, upon which rested a shimmering orb.
        
        "At last," he whispered, his voice echoing in the sacred space. 
        "The Heart of Eternity." His weathered hand reached toward the artifact, 
        but as his fingers touched the crystal surface, the entire chamber began to shake.
      `;

      const storyContext = {
        title: 'The Wizard\'s Quest',
        genre: 'Fantasy',
        stylePreset: 'fantasy' as const,
        existingCharacters: ['wizard'],
        existingLocations: ['chamber'],
      };

      const scenes = await openAIClient.extractScenes(sampleText, storyContext, 3);

      expect(scenes).toBeInstanceOf(Array);
      expect(scenes.length).toBeGreaterThan(0);
      expect(scenes.length).toBeLessThanOrEqual(3);

      // Validate scene structure
      for (const scene of scenes) {
        expect(scene).toHaveProperty('title');
        expect(scene).toHaveProperty('description');
        expect(scene).toHaveProperty('visualScore');
        expect(scene).toHaveProperty('impactScore');
        expect(typeof scene.title).toBe('string');
        expect(typeof scene.description).toBe('string');
        expect(typeof scene.visualScore).toBe('number');
        expect(typeof scene.impactScore).toBe('number');
        expect(scene.visualScore).toBeGreaterThanOrEqual(0);
        expect(scene.visualScore).toBeLessThanOrEqual(1);
        expect(scene.impactScore).toBeGreaterThanOrEqual(0);
        expect(scene.impactScore).toBeLessThanOrEqual(1);
      }
    });

    test('should extract entities from scene text', async () => {
      if (skipTests) {
        console.log('⚠️  Skipping test - OpenAI API key not configured');
        return;
      }

      const sceneText = `
        Princess Elara stood at the balcony of the Crystal Tower, overlooking the bustling 
        market square below. Her silver gown caught the morning light as she watched the 
        merchants setting up their stalls. Captain Marcus approached from behind, his armor 
        clanking softly on the marble floor.
      `;

      const existingEntities = [
        { name: 'Elara', type: 'character' as const, description: 'A princess' },
      ];

      const entities = await openAIClient.extractEntities(sceneText, existingEntities);

      expect(entities).toHaveProperty('characters');
      expect(entities).toHaveProperty('locations');
      expect(entities.characters).toBeInstanceOf(Array);
      expect(entities.locations).toBeInstanceOf(Array);

      // Should find Captain Marcus as a new character
      const marcus = entities.characters.find(c => c.name.toLowerCase().includes('marcus'));
      expect(marcus).toBeDefined();

      // Should find Crystal Tower and market square as locations
      const locations = entities.locations.map(l => l.name.toLowerCase());
      expect(locations.some(name => name.includes('tower') || name.includes('market'))).toBe(true);
    });

    test('should assess image quality', async () => {
      if (skipTests) {
        console.log('⚠️  Skipping test - OpenAI API key not configured');
        return;
      }

      const mockImageUrl = 'https://example.com/test-image.jpg';
      const originalPrompt = 'A wizard in a magical chamber, fantasy art style';
      const sceneDescription = 'The wizard discovers a magical orb in an ancient chamber';

      const assessment = await openAIClient.assessImageQuality(
        mockImageUrl,
        originalPrompt,
        sceneDescription
      );

      expect(assessment).toHaveProperty('qualityScore');
      expect(assessment).toHaveProperty('issues');
      expect(assessment).toHaveProperty('suggestions');
      expect(typeof assessment.qualityScore).toBe('number');
      expect(assessment.qualityScore).toBeGreaterThanOrEqual(0);
      expect(assessment.qualityScore).toBeLessThanOrEqual(1);
      expect(assessment.issues).toBeInstanceOf(Array);
      expect(assessment.suggestions).toBeInstanceOf(Array);
    });
  });

  describe('Replicate Integration', () => {
    let replicateClient: ReturnType<typeof createReplicateClient>;

    beforeAll(() => {
      if (!skipTests) {
        replicateClient = createReplicateClient();
      }
    });

    test('should generate image from prompt', async () => {
      if (skipTests) {
        console.log('⚠️  Skipping test - Replicate API token not configured');
        return;
      }

      const prompt = 'A majestic wizard in a magical chamber, fantasy art style, high quality, detailed';
      const negativePrompt = 'low quality, blurry, distorted';

      const result = await replicateClient.generateImage(
        prompt,
        negativePrompt,
        768,
        1024,
        25,
        7.5
      );

      expect(result).toHaveProperty('predictionId');
      expect(result).toHaveProperty('imageUrl');
      expect(typeof result.predictionId).toBe('string');
      
      if (result.imageUrl) {
        expect(typeof result.imageUrl).toBe('string');
        expect(result.imageUrl).toMatch(/^https?:\/\//);
      }
    }, 60000); // 60 second timeout for image generation

    test('should handle prediction status polling', async () => {
      if (skipTests) {
        console.log('⚠️  Skipping test - Replicate API token not configured');
        return;
      }

      // Create a prediction first
      const prediction = await replicateClient.createPrediction(
        'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
        {
          prompt: 'A simple test image',
          width: 512,
          height: 512,
          num_inference_steps: 20,
        }
      );

      expect(prediction).toHaveProperty('id');
      expect(prediction).toHaveProperty('status');

      // Poll for status
      const status = await replicateClient.getPrediction(prediction.id);
      
      expect(status).toHaveProperty('id');
      expect(status).toHaveProperty('status');
      expect(['starting', 'processing', 'succeeded', 'failed', 'canceled']).toContain(status.status);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid API keys gracefully', async () => {
      // Temporarily override environment variables to test error handling
      const originalOpenAIKey = Deno.env.get('OPENAI_API_KEY');
      const originalReplicateToken = Deno.env.get('REPLICATE_API_TOKEN');

      try {
        Deno.env.set('OPENAI_API_KEY', 'invalid-key');
        Deno.env.set('REPLICATE_API_TOKEN', 'invalid-token');

        const openAIClient = createOpenAIClient();
        const replicateClient = createReplicateClient();

        // These should fail gracefully
        await expect(
          openAIClient.extractScenes('test text', {
            title: 'Test',
            stylePreset: 'fantasy',
            existingCharacters: [],
            existingLocations: [],
          })
        ).rejects.toThrow();

        await expect(
          replicateClient.generateImage('test prompt')
        ).rejects.toThrow();

      } finally {
        // Restore original environment variables
        if (originalOpenAIKey) {
          Deno.env.set('OPENAI_API_KEY', originalOpenAIKey);
        } else {
          Deno.env.delete('OPENAI_API_KEY');
        }

        if (originalReplicateToken) {
          Deno.env.set('REPLICATE_API_TOKEN', originalReplicateToken);
        } else {
          Deno.env.delete('REPLICATE_API_TOKEN');
        }
      }
    });
  });
});

// Helper function to check if integration tests should run
export const shouldRunIntegrationTests = (): boolean => {
  const hasOpenAI = !!Deno.env.get('OPENAI_API_KEY');
  const hasReplicate = !!Deno.env.get('REPLICATE_API_TOKEN');
  
  if (!hasOpenAI || !hasReplicate) {
    console.log(`
⚠️  Integration tests require API keys:
   - OpenAI API Key: ${hasOpenAI ? '✓' : '✗'}
   - Replicate API Token: ${hasReplicate ? '✓' : '✗'}
   
   Set these environment variables to run integration tests:
   - OPENAI_API_KEY=your-openai-key
   - REPLICATE_API_TOKEN=your-replicate-token
   
   These tests will be skipped until real API keys are provided.
    `);
  }
  
  return hasOpenAI && hasReplicate;
};