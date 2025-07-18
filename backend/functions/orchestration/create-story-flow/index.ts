/**
 * Create Story Flow Function
 * Parses uploaded file, extracts chapter structure, creates story, and queues chapter processing
 */

import { handleError, ProcessingError, ValidationError } from '../../../shared/errors.ts';
import { 
  FunctionResponse, 
  ParsedText,
  ParsedChapter,
  Story,
  StoryChapter,
  ProcessingSequence,
  UUID
} from '../../../shared/types.ts';
import { validateRequestBody } from '../../utilities/validation/index.ts';
import { parseUploadedText } from '../../core/parse-uploaded-text/index.ts';
import { logInfo, logError } from '../../../shared/errors.ts';

// Import database helpers (to be implemented)
import { 
  createStory, 
  createChapter, 
  queueProcessChapterFlow,
  extractChaptersFromText 
} from './database-helpers.ts';

// ============================================================================
// CORE FUNCTION
// ============================================================================

export const createStoryFlow = async (
  file: File, 
  userId: string,
  stylePreset: string = 'realistic'
): Promise<{
  story: Story;
  chapters: StoryChapter[];
  processingSequence: ProcessingSequence;
}> => {
  const startTime = performance.now();
  
  try {
    logInfo('Starting story creation flow', {
      fileName: file.name,
      fileSize: file.size,
      userId,
      stylePreset
    });

    // 1. Parse uploaded file
    const parsedText = await parseUploadedText(file);
    logInfo('File parsed successfully', {
      title: parsedText.title,
      contentType: parsedText.contentType,
      chaptersDetected: parsedText.chapters?.length || 0,
      detectionConfidence: parsedText.detectionMetadata.confidence
    });

    // 2. Determine chapters - use detected chapters or extract from text
    let chapters: ParsedChapter[];
    if (parsedText.chapters && parsedText.chapters.length > 0) {
      chapters = parsedText.chapters;
      logInfo('Using detected chapter structure', { 
        chaptersCount: chapters.length 
      });
    } else {
      logInfo('No chapters detected, extracting from text');
      chapters = await extractChaptersFromText(parsedText.fullText);
      logInfo('Chapters extracted from text', { 
        chaptersCount: chapters.length 
      });
    }

    // Validate minimum requirements
    if (chapters.length === 0) {
      throw new ValidationError('No chapters could be detected or extracted from the text');
    }

    // 3. Create story record
    const story = await createStory({
      title: parsedText.title,
      userId,
      stylePreset,
      totalChapters: chapters.length,
      contentType: parsedText.contentType,
      detectionMetadata: parsedText.detectionMetadata,
    });

    logInfo('Story record created', {
      storyId: story.id,
      title: story.title,
      totalChapters: story.totalChapters
    });

    // 4. Create chapter records
    const createdChapters: StoryChapter[] = [];
    
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      
      const createdChapter = await createChapter({
        storyId: story.id,
        chapterNumber: chapter.number,
        index: i,
        title: chapter.title || `Chapter ${i + 1}`,
        content: chapter.content,
        wordCount: chapter.wordCount,
        startIndex: chapter.startIndex,
        endIndex: chapter.endIndex,
      });
      
      createdChapters.push(createdChapter);
      
      logInfo('Chapter record created', {
        chapterId: createdChapter.id,
        chapterNumber: createdChapter.chapterNumber,
        title: createdChapter.title,
        wordCount: createdChapter.wordCount
      });
    }

    // 5. Queue sequential chapter processing
    const processingSequence = await queueSequentialProcessing(story.id, createdChapters);
    
    logInfo('Chapter processing queued', {
      storyId: story.id,
      sequenceStatus: processingSequence.status,
      totalJobs: processingSequence.chapters.length
    });

    const endTime = performance.now();
    logInfo('Story creation flow completed', {
      processingTime: `${endTime - startTime}ms`,
      storyId: story.id,
      chaptersCreated: createdChapters.length,
      firstChapterStarted: processingSequence.currentChapter !== undefined
    });

    return {
      story,
      chapters: createdChapters,
      processingSequence,
    };

  } catch (error) {
    logError(error as Error, {
      fileName: file.name,
      fileSize: file.size,
      userId,
      stylePreset
    });
    
    throw error;
  }
};

// ============================================================================
// SEQUENTIAL PROCESSING QUEUE SETUP
// ============================================================================

const queueSequentialProcessing = async (
  storyId: string,
  chapters: StoryChapter[]
): Promise<ProcessingSequence> => {
  try {
    logInfo('Setting up sequential chapter processing', {
      storyId,
      totalChapters: chapters.length
    });

    // Queue each chapter with proper dependencies
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      const previousChapterId = i > 0 ? chapters[i - 1].id : undefined;
      
      await queueProcessChapterFlow(chapter.id, {
        previousChapterId,
        priority: 10 - i, // Higher priority for earlier chapters
        dependsOn: previousChapterId ? [previousChapterId] : [],
      });
      
      logInfo('Chapter queued for processing', {
        chapterId: chapter.id,
        chapterNumber: chapter.chapterNumber,
        previousChapterId,
        priority: 10 - i
      });
    }

    // Create processing sequence tracking
    const processingSequence: ProcessingSequence = {
      storyId,
      chapters: chapters.map((chapter, index) => ({
        id: crypto.randomUUID(),
        storyId,
        chapterNumber: chapter.chapterNumber,
        status: index === 0 ? 'queued' : 'waiting_for_previous',
        prerequisiteChapter: index > 0 ? chapters[index - 1].chapterNumber : undefined,
        priority: 10 - index,
        createdAt: new Date().toISOString(),
      })),
      currentChapter: undefined, // Will be set when first chapter starts
      totalChapters: chapters.length,
      status: 'pending',
    };

    return processingSequence;

  } catch (error) {
    logError(error as Error, { storyId, totalChapters: chapters.length });
    throw new ProcessingError(`Failed to queue sequential processing: ${error.message}`);
  }
};

// ============================================================================
// CHAPTER EXTRACTION FALLBACK
// ============================================================================

const extractChaptersFromTextFallback = async (text: string): Promise<ParsedChapter[]> => {
  // This is a fallback implementation for when parseUploadedText doesn't detect chapters
  // Uses more aggressive heuristics
  
  logInfo('Using fallback chapter extraction', { textLength: text.length });
  
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const wordCount = text.split(/\s+/).length;
  
  // More aggressive chapter detection patterns
  const chapterPatterns = [
    /^chapter\s+\d+/i,
    /^chapter\s+(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)/i,
    /^ch\.\s*\d+/i,
    /^\d+\.\s*[A-Z]/,
    /^part\s+\d+/i,
    /^book\s+\d+/i,
    /^[IVX]+\.\s*[A-Z]/,  // Roman numerals
    /^\*\*\*+/,           // Section breaks
    /^-{3,}/,             // Dashes
  ];
  
  const chapterBreaks: Array<{ line: string; index: number; lineNumber: number }> = [];
  
  lines.forEach((line, lineIndex) => {
    chapterPatterns.forEach(pattern => {
      if (pattern.test(line)) {
        const charIndex = text.indexOf(line);
        chapterBreaks.push({ 
          line, 
          index: charIndex, 
          lineNumber: lineIndex 
        });
      }
    });
  });
  
  // If still no chapters found, split by word count
  if (chapterBreaks.length < 2) {
    logInfo('No clear chapter breaks found, using length-based splitting');
    
    // For very long texts, split into chapters of roughly equal size
    if (wordCount > 5000) {
      const targetWordsPerChapter = Math.min(3000, wordCount / 3);
      const words = text.split(/\s+/);
      const chapters: ParsedChapter[] = [];
      
      let currentStart = 0;
      let chapterNumber = 1;
      
      while (currentStart < words.length) {
        const currentEnd = Math.min(currentStart + targetWordsPerChapter, words.length);
        const chapterWords = words.slice(currentStart, currentEnd);
        const chapterText = chapterWords.join(' ');
        
        chapters.push({
          id: crypto.randomUUID(),
          number: chapterNumber,
          title: `Chapter ${chapterNumber}`,
          content: chapterText,
          wordCount: chapterWords.length,
          startIndex: text.indexOf(chapterWords[0]),
          endIndex: text.indexOf(chapterWords[chapterWords.length - 1]) + chapterWords[chapterWords.length - 1].length,
        });
        
        currentStart = currentEnd;
        chapterNumber++;
      }
      
      return chapters;
    } else {
      // Single chapter for shorter texts
      return [{
        id: crypto.randomUUID(),
        number: 1,
        title: 'Chapter 1',
        content: text,
        wordCount: wordCount,
        startIndex: 0,
        endIndex: text.length,
      }];
    }
  }
  
  // Create chapters from detected breaks
  const chapters: ParsedChapter[] = [];
  
  for (let i = 0; i < chapterBreaks.length; i++) {
    const currentBreak = chapterBreaks[i];
    const nextBreak = chapterBreaks[i + 1];
    
    const startIndex = currentBreak.index;
    const endIndex = nextBreak ? nextBreak.index : text.length;
    
    const chapterContent = text.substring(startIndex, endIndex).trim();
    
    chapters.push({
      id: crypto.randomUUID(),
      number: i + 1,
      title: currentBreak.line || `Chapter ${i + 1}`,
      content: chapterContent,
      wordCount: chapterContent.split(/\s+/).length,
      startIndex,
      endIndex,
    });
  }
  
  logInfo('Chapters extracted using fallback method', { 
    chaptersFound: chapters.length,
    patterns: chapterBreaks.length
  });
  
  return chapters;
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
    
    if (!body.file || !body.userId) {
      throw new ValidationError('Missing required fields: file, userId');
    }
    
    // Execute the core function
    const result = await createStoryFlow(
      body.file,
      body.userId,
      body.stylePreset || 'realistic'
    );
    
    // Return successful response
    const response: FunctionResponse<typeof result> = {
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
export { createStoryFlow as coreFunction };