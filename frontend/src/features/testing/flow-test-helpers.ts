/**
 * Flow Test Helpers
 * Helper functions to test Edge Function handlers directly with mock data
 */

// Import the actual Edge Function handlers
// Note: In a real setup, these would be imported differently
// For now, we'll create mock implementations that simulate the actual handlers

interface MockFlowResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  timestamp: string;
}

// Mock implementation of createStoryFlow Edge Function handler
export const testCreateStoryFlowHandler = async (
  userId: string,
  stylePreset: string = 'fantasy'
): Promise<MockFlowResult> => {
  try {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock the actual Edge Function response structure
    return {
      success: true,
      data: {
        story: {
          id: 'story-' + Date.now(),
          userId,
          title: 'The Chronicles of Aethermoor',
          description: 'Auto-generated from uploaded file with 3 chapters',
          genre: 'fantasy',
          stylePreset,
          status: 'processing',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        chapters: [
          {
            id: 'chapter-1-' + Date.now(),
            storyId: 'story-' + Date.now(),
            chapterNumber: 1,
            title: 'Chapter 1: The Beginning',
            content: 'It was a dark and stormy night in the kingdom of Aethermoor...',
            wordCount: 245,
            processingStatus: 'pending',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'chapter-2-' + Date.now(),
            storyId: 'story-' + Date.now(),
            chapterNumber: 2,
            title: 'Chapter 2: The Quest Begins',
            content: 'At dawn, Lyra descended from the tower...',
            wordCount: 198,
            processingStatus: 'pending',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'chapter-3-' + Date.now(),
            storyId: 'story-' + Date.now(),
            chapterNumber: 3,
            title: 'Chapter 3: The Dark Forest',
            content: 'The Forbidden Forest was unlike anything...',
            wordCount: 167,
            processingStatus: 'pending',
            createdAt: new Date().toISOString(),
          }
        ],
        processingSequence: {
          storyId: 'story-' + Date.now(),
          totalChapters: 3,
          status: 'pending',
          chapters: [
            { id: 'job-1', chapterNumber: 1, status: 'queued', priority: 10 },
            { id: 'job-2', chapterNumber: 2, status: 'waiting_for_previous', priority: 9 },
            { id: 'job-3', chapterNumber: 3, status: 'waiting_for_previous', priority: 8 }
          ]
        }
      },
      message: 'Story creation flow completed successfully',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
};

// Mock implementation of processChapterFlow Edge Function handler
export const testProcessChapterFlowHandler = async (
  chapterId: string,
  options: {
    previousChapterId?: string;
    forceRegenerate?: boolean;
    skipImageGeneration?: boolean;
  } = {}
): Promise<MockFlowResult> => {
  try {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return {
      success: true,
      data: {
        chapter: {
          id: chapterId,
          storyId: 'story-123',
          chapterNumber: 1,
          title: 'Chapter 1: The Beginning',
          content: 'Chapter content processed...',
          wordCount: 1250,
          processingStatus: 'completed',
          createdAt: new Date().toISOString(),
        },
        scenes: [
          {
            id: 'scene-1-' + Date.now(),
            text: 'Princess Lyra stood at the window of the Crystal Tower, watching lightning illuminate the magical realm below.',
            summary: 'Princess Lyra at the Crystal Tower during a storm',
            visualScore: 8.5,
            impactScore: 9.0,
            timeOfDay: 'night',
            emotionalTone: 'mysterious',
          },
          {
            id: 'scene-2-' + Date.now(),
            text: 'Lightning illuminated the magical realm below, revealing ancient spires and floating islands.',
            summary: 'Lightning illuminates the magical kingdom',
            visualScore: 9.2,
            impactScore: 8.7,
            timeOfDay: 'night',
            emotionalTone: 'dramatic',
          }
        ],
        entities: [
          {
            id: 'entity-lyra-' + Date.now(),
            name: 'Princess Lyra',
            type: 'character',
            description: 'A young princess with silver hair and magical abilities',
            aliases: ['Lyra', 'The Princess'],
            firstAppearance: 'Chapter 1',
            referenceImages: [],
          },
          {
            id: 'entity-tower-' + Date.now(),
            name: 'Crystal Tower',
            type: 'location',
            description: 'A towering spire of pure crystal that houses the magical academy',
            aliases: ['The Tower', 'Crystal Spire'],
            firstAppearance: 'Chapter 1',
            referenceImages: [],
          }
        ],
        images: options.skipImageGeneration ? [] : [
          {
            imageUrl: 'https://example.com/generated-scene-1.jpg',
            status: 'success',
            metadata: {
              seed: 12345,
              modelVersion: 'sdxl-1.0',
              generationTime: 4500,
              cost: 0.05
            }
          },
          {
            imageUrl: 'https://example.com/generated-scene-2.jpg',
            status: 'success',
            metadata: {
              seed: 67890,
              modelVersion: 'sdxl-1.0',
              generationTime: 4200,
              cost: 0.05
            }
          }
        ],
        qualityReports: [
          {
            qualityScore: 8.7,
            issues: [],
            suggestions: ['Consider adding more detail to the background elements'],
            metrics: {
              promptAdherence: 9.1,
              technicalQuality: 8.5,
              aestheticScore: 8.5
            }
          }
        ]
      },
      message: 'Chapter processing flow completed successfully',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
};

// Full pipeline test that combines both flows
export const testFullPipelineHandler = async (
  userId: string,
  stylePreset: string = 'fantasy',
  skipImageGeneration: boolean = false
): Promise<MockFlowResult> => {
  try {
    console.log('Starting full pipeline test...');
    
    // Step 1: Create story
    const storyResult = await testCreateStoryFlowHandler(userId, stylePreset);
    
    if (!storyResult.success) {
      throw new Error('Story creation failed: ' + storyResult.error);
    }
    
    // Step 2: Process first chapter
    const firstChapter = storyResult.data.chapters[0];
    const chapterResult = await testProcessChapterFlowHandler(firstChapter.id, {
      skipImageGeneration,
    });
    
    if (!chapterResult.success) {
      throw new Error('Chapter processing failed: ' + chapterResult.error);
    }
    
    return {
      success: true,
      data: {
        steps: [
          {
            step: 'create_story',
            success: true,
            data: storyResult.data
          },
          {
            step: 'process_chapter',
            success: true,
            data: chapterResult.data
          }
        ],
        summary: {
          storyCreated: true,
          chaptersProcessed: 1,
          totalSteps: 2
        }
      },
      message: 'Full pipeline test completed successfully',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
};

// Helper to create mock Request objects for testing Edge Functions
export const createMockRequest = (
  url: string,
  method: string = 'POST',
  body?: any
): Request => {
  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    requestInit.body = JSON.stringify(body);
  }
  
  return new Request(url, requestInit);
};

// Helper to simulate calling an Edge Function handler
export const simulateEdgeFunctionCall = async (
  handler: (req: Request) => Promise<Response>,
  body: any
): Promise<MockFlowResult> => {
  try {
    const mockRequest = createMockRequest('http://localhost/test', 'POST', body);
    const response = await handler(mockRequest);
    const result = await response.json();
    
    return {
      success: response.ok,
      data: result.data,
      error: response.ok ? undefined : result.error?.message,
      message: result.message || (response.ok ? 'Success' : 'Failed'),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
};