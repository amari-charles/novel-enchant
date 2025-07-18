/**
 * Test Runner for Novel Enchant Backend
 * Runs unit tests, integration tests, and provides test utilities
 */

import { runTests } from 'https://deno.land/std@0.208.0/testing/bdd.ts';

// Test configuration
const testConfig = {
  // Test patterns
  patterns: {
    unit: '**/*.spec.ts',
    integration: 'integration/**/*.spec.ts',
    e2e: 'e2e/**/*.spec.ts',
  },
  
  // Test environment
  environment: {
    timeout: 30000, // 30 seconds default timeout
    retries: 0,
    parallel: true,
  },
  
  // Coverage settings
  coverage: {
    include: ['../functions/**/*.ts', '../shared/**/*.ts'],
    exclude: ['**/*.spec.ts', '**/*.test.ts'],
  },
};

// Test utilities
export const testUtils = {
  /**
   * Creates sample test data for story processing
   */
  createSampleStoryData: () => ({
    title: 'The Enchanted Forest',
    genre: 'Fantasy',
    stylePreset: 'fantasy' as const,
    sampleText: `
      The ancient oak tree stood sentinel in the heart of the Whispering Woods, 
      its gnarled branches reaching toward the star-filled sky. Beneath its massive trunk, 
      a young mage named Lyra sat cross-legged, her spell book open before her.
      
      "Focus on the essence," she whispered to herself, tracing intricate patterns 
      in the air with her fingers. Golden sparks danced around her hands as she 
      channeled the forest's magical energy.
      
      Suddenly, a rustling in the nearby bushes caught her attention. A pair of 
      glowing eyes peered out from the darkness, watching her every move.
    `,
    expectedScenes: [
      {
        title: 'The Mage\'s Study',
        description: 'A young mage practicing magic under an ancient oak tree',
        visualScore: 0.8,
        impactScore: 0.7,
      },
      {
        title: 'The Watching Eyes',
        description: 'Mysterious creature observing from the shadows',
        visualScore: 0.9,
        impactScore: 0.8,
      },
    ],
    expectedEntities: [
      { name: 'Lyra', type: 'character' as const, description: 'A young mage' },
      { name: 'Whispering Woods', type: 'location' as const, description: 'An ancient forest' },
      { name: 'ancient oak tree', type: 'location' as const, description: 'A massive sentinel tree' },
    ],
  }),

  /**
   * Creates sample entity data for testing
   */
  createSampleEntities: () => [
    {
      id: 'char-1',
      name: 'Aragorn',
      type: 'character' as const,
      description: 'A skilled ranger and rightful king',
      aliases: ['Strider', 'Ranger'],
    },
    {
      id: 'char-2',
      name: 'Gandalf',
      type: 'character' as const,
      description: 'A wise wizard with a grey beard',
      aliases: ['Gandalf the Grey', 'Mithrandir'],
    },
    {
      id: 'loc-1',
      name: 'Rivendell',
      type: 'location' as const,
      description: 'A beautiful elven sanctuary',
      aliases: ['Imladris'],
    },
  ],

  /**
   * Creates sample mentions for testing entity resolution
   */
  createSampleMentions: () => [
    {
      mentionText: 'Strider',
      sentence: 'Strider approached the group with caution.',
      startIndex: 0,
      endIndex: 7,
    },
    {
      mentionText: 'the wizard',
      sentence: 'The wizard raised his staff.',
      startIndex: 4,
      endIndex: 14,
    },
    {
      mentionText: 'Rivendell',
      sentence: 'They finally reached Rivendell at sunset.',
      startIndex: 20,
      endIndex: 29,
    },
  ],

  /**
   * Creates sample prompt for testing
   */
  createSamplePrompt: () => ({
    id: 'prompt-1',
    text: 'A brave ranger standing guard in a mystical forest, fantasy art style, detailed',
    negativePrompt: 'low quality, blurry, distorted',
    style: 'fantasy',
    refImageUrls: [],
    technicalParams: {
      width: 768,
      height: 1024,
      steps: 25,
      cfgScale: 7.5,
      sampler: 'DPM++ 2M Karras',
    },
  }),

  /**
   * Validates test results structure
   */
  validateTestResult: <T>(result: T, expectedStructure: Record<string, string>): boolean => {
    if (!result || typeof result !== 'object') return false;
    
    for (const [key, expectedType] of Object.entries(expectedStructure)) {
      if (!(key in result)) return false;
      if (expectedType === 'array' && !Array.isArray((result as any)[key])) return false;
      if (expectedType !== 'array' && typeof (result as any)[key] !== expectedType) return false;
    }
    
    return true;
  },

  /**
   * Measures function execution time
   */
  measureExecutionTime: async <T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    return {
      result,
      time: end - start,
    };
  },

  /**
   * Creates a temporary file for testing
   */
  createTestFile: (content: string, extension: string = 'txt'): File => {
    const blob = new Blob([content], { type: 'text/plain' });
    return new File([blob], `test-file.${extension}`, { type: 'text/plain' });
  },

  /**
   * Simulates delay for testing async operations
   */
  delay: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Creates mock function response
   */
  createMockResponse: <T>(data: T, success: boolean = true): { success: boolean; data: T; timestamp: string } => ({
    success,
    data,
    timestamp: new Date().toISOString(),
  }),
};

// Test categories
export const testCategories = {
  unit: 'Unit Tests',
  integration: 'Integration Tests (Expected to fail without API keys)',
  e2e: 'End-to-End Tests (Expected to fail without full setup)',
};

// Main test runner
export async function runAllTests() {
  console.log('🧪 Running Novel Enchant Backend Tests\n');
  
  // Display test environment info
  console.log('Test Environment:');
  console.log(`- Deno Version: ${Deno.version.deno}`);
  console.log(`- TypeScript Version: ${Deno.version.typescript}`);
  console.log(`- OpenAI API Key: ${Deno.env.get('OPENAI_API_KEY') ? '✓' : '✗'}`);
  console.log(`- Replicate API Token: ${Deno.env.get('REPLICATE_API_TOKEN') ? '✓' : '✗'}`);
  console.log(`- Supabase URL: ${Deno.env.get('SUPABASE_URL') ? '✓' : '✗'}`);
  console.log('');

  // Run tests based on available environment
  const hasApiKeys = Deno.env.get('OPENAI_API_KEY') && Deno.env.get('REPLICATE_API_TOKEN');
  
  if (!hasApiKeys) {
    console.log('⚠️  Some integration tests will be skipped due to missing API keys');
    console.log('   Set OPENAI_API_KEY and REPLICATE_API_TOKEN to run all tests\n');
  }

  // Run the tests
  await runTests();
}

// Run tests if this file is executed directly
if (import.meta.main) {
  await runAllTests();
}