/**
 * Orchestrate Story Processing Function
 * Manages sequential chapter processing to maintain visual and narrative consistency
 */

import { handleError, ProcessingError } from '../../../shared/errors.ts';
import { 
  FunctionResponse, 
  ProcessingSequence, 
  ChapterProcessingJob,
  ParsedText,
  ChapterContext,
  Entity,
  EntityReference
} from '../../../shared/types.ts';
import { validateRequestBody } from '../../utilities/validation/index.ts';
import { logInfo, logError } from '../../../shared/errors.ts';

// ============================================================================
// CORE FUNCTION
// ============================================================================

export const orchestrateStoryProcessing = async (
  storyId: string,
  parsedText: ParsedText,
  userId: string
): Promise<ProcessingSequence> => {
  const startTime = performance.now();
  
  try {
    logInfo('Starting story processing orchestration', {
      storyId,
      userId,
      contentType: parsedText.contentType,
      chaptersToProcess: parsedText.chapters?.length || 1
    });
    
    // Create processing sequence based on content type
    const sequence = await createProcessingSequence(storyId, parsedText);
    
    // Initialize the sequential processing
    await initializeSequentialProcessing(sequence, userId);
    
    const endTime = performance.now();
    logInfo('Story processing orchestration initialized', {
      processingTime: `${endTime - startTime}ms`,
      storyId,
      sequenceId: sequence.storyId,
      totalChapters: sequence.totalChapters,
      status: sequence.status
    });
    
    return sequence;
    
  } catch (error) {
    logError(error as Error, { 
      storyId,
      userId,
      contentType: parsedText.contentType
    });
    
    throw error;
  }
};

// ============================================================================
// PROCESSING SEQUENCE CREATION
// ============================================================================

const createProcessingSequence = async (
  storyId: string,
  parsedText: ParsedText
): Promise<ProcessingSequence> => {
  const chapters: ChapterProcessingJob[] = [];
  
  if (parsedText.chapters && parsedText.chapters.length > 1) {
    // Multi-chapter processing - create sequential jobs
    parsedText.chapters.forEach((chapter, index) => {
      const job: ChapterProcessingJob = {
        id: crypto.randomUUID(),
        storyId,
        chapterNumber: chapter.number,
        status: index === 0 ? 'queued' : 'waiting_for_previous',
        prerequisiteChapter: index > 0 ? parsedText.chapters![index - 1].number : undefined,
        priority: 10 - index, // Higher priority for earlier chapters
        createdAt: new Date().toISOString(),
      };
      chapters.push(job);
    });
  } else {
    // Single chapter processing
    const job: ChapterProcessingJob = {
      id: crypto.randomUUID(),
      storyId,
      chapterNumber: 1,
      status: 'queued',
      priority: 10,
      createdAt: new Date().toISOString(),
    };
    chapters.push(job);
  }
  
  return {
    storyId,
    chapters,
    currentChapter: undefined,
    totalChapters: chapters.length,
    status: 'pending',
  };
};

// ============================================================================
// SEQUENTIAL PROCESSING INITIALIZATION
// ============================================================================

const initializeSequentialProcessing = async (
  sequence: ProcessingSequence,
  userId: string
): Promise<void> => {
  // Start processing the first chapter
  const firstChapter = sequence.chapters.find(ch => ch.status === 'queued');
  
  if (firstChapter) {
    await startChapterProcessing(firstChapter, sequence, userId);
  }
};

// ============================================================================
// CHAPTER PROCESSING MANAGEMENT
// ============================================================================

export const processNextChapter = async (
  storyId: string,
  completedChapterNumber: number
): Promise<{ nextChapter?: ChapterProcessingJob; allComplete: boolean }> => {
  try {
    logInfo('Processing next chapter in sequence', {
      storyId,
      completedChapterNumber
    });
    
    // In production, this would load the sequence from the database
    // For now, we'll simulate the logic
    const sequence = await getProcessingSequence(storyId);
    
    if (!sequence) {
      throw new ProcessingError(`Processing sequence not found for story: ${storyId}`);
    }
    
    // Mark completed chapter as done
    const completedChapter = sequence.chapters.find(ch => ch.chapterNumber === completedChapterNumber);
    if (completedChapter) {
      completedChapter.status = 'completed';
      completedChapter.completedAt = new Date().toISOString();
    }
    
    // Find next chapter to process
    const nextChapter = sequence.chapters.find(ch => 
      ch.status === 'waiting_for_previous' && 
      ch.prerequisiteChapter === completedChapterNumber
    );
    
    if (nextChapter) {
      nextChapter.status = 'queued';
      await startChapterProcessing(nextChapter, sequence, 'system'); // System continuation
      
      return { nextChapter, allComplete: false };
    } else {
      // Check if all chapters are complete
      const allComplete = sequence.chapters.every(ch => ch.status === 'completed');
      
      if (allComplete) {
        sequence.status = 'completed';
        await updateProcessingSequence(sequence);
      }
      
      return { allComplete };
    }
    
  } catch (error) {
    logError(error as Error, { storyId, completedChapterNumber });
    throw error;
  }
};

const startChapterProcessing = async (
  chapter: ChapterProcessingJob,
  sequence: ProcessingSequence,
  userId: string
): Promise<void> => {
  try {
    chapter.status = 'processing';
    chapter.startedAt = new Date().toISOString();
    sequence.currentChapter = chapter.chapterNumber;
    sequence.status = 'in_progress';
    
    // Build chapter context from previous chapters
    const chapterContext = await buildChapterContext(sequence, chapter.chapterNumber);
    
    // In production, this would trigger the actual chapter processing pipeline
    // For now, we'll log the processing start
    logInfo('Chapter processing started', {
      storyId: sequence.storyId,
      chapterNumber: chapter.chapterNumber,
      hasPreviousContext: !!chapterContext,
      prerequisiteChapter: chapter.prerequisiteChapter
    });
    
    // Update the sequence in storage
    await updateProcessingSequence(sequence);
    
    // In production, this would call the actual processing functions:
    // 1. extractVisualScenes(chapterText, context)
    // 2. identifySceneMentions + resolveMentionsToEntities
    // 3. extractNewEntitiesFromScene + mergeEntities
    // 4. trackEntityEvolution
    // 5. constructImagePrompt (with chapterContext)
    // 6. generateImageFromPrompt
    // 7. assessImageQuality
    
  } catch (error) {
    chapter.status = 'failed';
    chapter.error = error.message;
    await updateProcessingSequence(sequence);
    throw error;
  }
};

// ============================================================================
// CHAPTER CONTEXT BUILDING
// ============================================================================

const buildChapterContext = async (
  sequence: ProcessingSequence,
  currentChapterNumber: number
): Promise<ChapterContext | undefined> => {
  // Find the most recent completed chapter
  const previousChapters = sequence.chapters
    .filter(ch => ch.chapterNumber < currentChapterNumber && ch.status === 'completed')
    .sort((a, b) => b.chapterNumber - a.chapterNumber);
  
  if (previousChapters.length === 0) {
    return undefined; // First chapter
  }
  
  const mostRecentChapter = previousChapters[0];
  
  // In production, this would load actual data from the database
  // For now, we'll create a mock context
  const mockContext: ChapterContext = {
    chapterNumber: mostRecentChapter.chapterNumber,
    entityStates: await loadEntityStatesForChapter(sequence.storyId, mostRecentChapter.chapterNumber),
    previousScenes: await loadScenesForChapter(sequence.storyId, mostRecentChapter.chapterNumber),
    styleEvolution: await loadStyleEvolution(sequence.storyId, mostRecentChapter.chapterNumber),
  };
  
  return mockContext;
};

// ============================================================================
// MOCK DATA LOADERS (TO BE REPLACED WITH REAL DATABASE CALLS)
// ============================================================================

const loadEntityStatesForChapter = async (
  storyId: string,
  chapterNumber: number
): Promise<Record<string, EntityReference[]>> => {
  // In production, this would query the database for entity states
  // Return format: { [entityId]: EntityReference[] }
  
  logInfo('Loading entity states for chapter context', { storyId, chapterNumber });
  
  // Mock implementation
  return {};
};

const loadScenesForChapter = async (storyId: string, chapterNumber: number) => {
  // In production, this would load actual scenes from the database
  logInfo('Loading scenes for chapter context', { storyId, chapterNumber });
  
  // Mock implementation
  return [];
};

const loadStyleEvolution = async (storyId: string, chapterNumber: number): Promise<string[]> => {
  // In production, this would track style evolution across chapters
  logInfo('Loading style evolution for chapter context', { storyId, chapterNumber });
  
  // Mock implementation
  return [];
};

// ============================================================================
// SEQUENCE MANAGEMENT (MOCK - TO BE REPLACED WITH DATABASE)
// ============================================================================

const getProcessingSequence = async (storyId: string): Promise<ProcessingSequence | null> => {
  // In production, this would load from database
  // For now, return null to simulate not found
  logInfo('Loading processing sequence', { storyId });
  return null;
};

const updateProcessingSequence = async (sequence: ProcessingSequence): Promise<void> => {
  // In production, this would save to database
  logInfo('Updating processing sequence', { 
    storyId: sequence.storyId,
    status: sequence.status,
    currentChapter: sequence.currentChapter
  });
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const getSequenceStatus = async (storyId: string): Promise<ProcessingSequence | null> => {
  return await getProcessingSequence(storyId);
};

export const retryFailedChapter = async (
  storyId: string,
  chapterNumber: number
): Promise<void> => {
  const sequence = await getProcessingSequence(storyId);
  
  if (!sequence) {
    throw new ProcessingError(`Processing sequence not found for story: ${storyId}`);
  }
  
  const failedChapter = sequence.chapters.find(ch => 
    ch.chapterNumber === chapterNumber && ch.status === 'failed'
  );
  
  if (!failedChapter) {
    throw new ProcessingError(`Failed chapter ${chapterNumber} not found in story: ${storyId}`);
  }
  
  // Reset chapter status and retry
  failedChapter.status = 'queued';
  failedChapter.error = undefined;
  failedChapter.startedAt = undefined;
  failedChapter.completedAt = undefined;
  
  await startChapterProcessing(failedChapter, sequence, 'retry');
};

// ============================================================================
// SUPABASE EDGE FUNCTION HANDLER
// ============================================================================

export default async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
  
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST method is allowed' },
      timestamp: new Date().toISOString(),
    }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // Validate and parse request body
    const body = await validateRequestBody(req);
    
    if (!body.storyId || !body.parsedText || !body.userId) {
      throw new ProcessingError('Missing required fields: storyId, parsedText, userId');
    }
    
    // Execute the core function
    const result = await orchestrateStoryProcessing(
      body.storyId,
      body.parsedText,
      body.userId
    );
    
    // Return successful response
    const response: FunctionResponse<ProcessingSequence> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    const errorResponse = handleError(error);
    
    return new Response(JSON.stringify(errorResponse), {
      status: error.code === 'VALIDATION_ERROR' ? 400 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// ============================================================================
// ALTERNATIVE DIRECT EXPORT (for testing)
// ============================================================================

// Export the core function for testing and internal use
export { orchestrateStoryProcessing as coreFunction };