/**
 * Database Helpers for Create Story Flow
 * Mock implementations for testing - to be replaced with real Supabase calls
 */

import { 
  Story, 
  StoryChapter, 
  ParsedChapter,
  UUID,
  ProcessingStatus
} from '../../../shared/types.ts';
import { logInfo, logError } from '../../../shared/errors.ts';

// ============================================================================
// STORY OPERATIONS
// ============================================================================

export interface CreateStoryInput {
  title: string;
  userId: string;
  stylePreset: string;
  totalChapters: number;
  contentType: 'single_chapter' | 'multi_chapter' | 'full_book';
  detectionMetadata: {
    chapterPatterns: string[];
    wordCount: number;
    structuralIndicators: string[];
    confidence: number;
  };
}

export const createStory = async (input: CreateStoryInput): Promise<Story> => {
  try {
    logInfo('Creating story record', {
      title: input.title,
      userId: input.userId,
      totalChapters: input.totalChapters
    });

    // In production, this would be:
    // const { data, error } = await supabase
    //   .from('stories')
    //   .insert({
    //     title: input.title,
    //     user_id: input.userId,
    //     style_preset: input.stylePreset,
    //     total_chapters: input.totalChapters,
    //     content_type: input.contentType,
    //     detection_metadata: input.detectionMetadata,
    //     status: 'processing',
    //     created_at: new Date().toISOString(),
    //   })
    //   .select()
    //   .single();

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate DB latency
    
    const story: Story = {
      id: crypto.randomUUID(),
      userId: input.userId,
      title: input.title,
      description: `Auto-generated from uploaded file with ${input.totalChapters} chapters`,
      genre: 'unknown', // Could be detected from content in the future
      stylePreset: input.stylePreset as Story['stylePreset'],
      customStylePrompt: undefined,
      status: 'processing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    logInfo('Story record created successfully', {
      storyId: story.id,
      title: story.title
    });

    return story;

  } catch (error) {
    logError(error as Error, { title: input.title, userId: input.userId });
    throw error;
  }
};

// ============================================================================
// CHAPTER OPERATIONS
// ============================================================================

export interface CreateChapterInput {
  storyId: string;
  chapterNumber: number;
  index: number;
  title: string;
  content: string;
  wordCount: number;
  startIndex: number;
  endIndex: number;
}

export const createChapter = async (input: CreateChapterInput): Promise<StoryChapter> => {
  try {
    logInfo('Creating chapter record', {
      storyId: input.storyId,
      chapterNumber: input.chapterNumber,
      title: input.title,
      wordCount: input.wordCount
    });

    // In production, this would be:
    // const { data, error } = await supabase
    //   .from('chapters')
    //   .insert({
    //     story_id: input.storyId,
    //     chapter_number: input.chapterNumber,
    //     title: input.title,
    //     content: input.content,
    //     word_count: input.wordCount,
    //     processing_status: 'pending',
    //     created_at: new Date().toISOString(),
    //   })
    //   .select()
    //   .single();

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate DB latency
    
    const chapter: StoryChapter = {
      id: crypto.randomUUID(),
      storyId: input.storyId,
      chapterNumber: input.chapterNumber,
      title: input.title,
      content: input.content,
      wordCount: input.wordCount,
      processingStatus: 'pending',
      createdAt: new Date().toISOString(),
    };

    logInfo('Chapter record created successfully', {
      chapterId: chapter.id,
      chapterNumber: chapter.chapterNumber,
      title: chapter.title
    });

    return chapter;

  } catch (error) {
    logError(error as Error, { 
      storyId: input.storyId, 
      chapterNumber: input.chapterNumber 
    });
    throw error;
  }
};

// ============================================================================
// CHAPTER PROCESSING QUEUE
// ============================================================================

export interface QueueChapterOptions {
  previousChapterId?: string;
  priority: number;
  dependsOn: string[];
}

export const queueProcessChapterFlow = async (
  chapterId: string,
  options: QueueChapterOptions
): Promise<void> => {
  try {
    logInfo('Queuing chapter for processing', {
      chapterId,
      previousChapterId: options.previousChapterId,
      priority: options.priority
    });

    // In production, this would:
    // 1. Add to processing queue (Redis or database queue)
    // 2. Set up dependencies
    // 3. Trigger first chapter if no dependencies

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 25)); // Simulate queue operation

    // If this is the first chapter (no dependencies), mark as ready to start
    if (!options.previousChapterId) {
      logInfo('First chapter queued - ready to start processing', { chapterId });
      
      // In production, this would trigger the actual processing
      // For now, just log that it would start
      logInfo('Would start processing chapter immediately', { chapterId });
    } else {
      logInfo('Chapter queued with dependency', { 
        chapterId, 
        dependsOn: options.previousChapterId 
      });
    }

  } catch (error) {
    logError(error as Error, { chapterId, options });
    throw error;
  }
};

// ============================================================================
// CHAPTER EXTRACTION FALLBACK
// ============================================================================

export const extractChaptersFromText = async (text: string): Promise<ParsedChapter[]> => {
  try {
    logInfo('Extracting chapters from text using fallback method', {
      textLength: text.length
    });

    // This implements the same logic as in the main function
    // but as a separate helper for reusability
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const wordCount = text.split(/\s+/).length;
    
    // Chapter detection patterns
    const chapterPatterns = [
      /^chapter\s+\d+/i,
      /^chapter\s+(one|two|three|four|five|six|seven|eight|nine|ten)/i,
      /^ch\.\s*\d+/i,
      /^\d+\.\s*[A-Z]/,
      /^part\s+\d+/i,
      /^book\s+\d+/i,
      /^[IVX]+\.\s*[A-Z]/,  // Roman numerals
    ];
    
    const chapterBreaks: Array<{ line: string; index: number }> = [];
    
    lines.forEach(line => {
      chapterPatterns.forEach(pattern => {
        if (pattern.test(line)) {
          const charIndex = text.indexOf(line);
          chapterBreaks.push({ line, index: charIndex });
        }
      });
    });
    
    // If no clear breaks found, create single chapter or split by length
    if (chapterBreaks.length < 2) {
      if (wordCount > 5000) {
        // Split long text into manageable chapters
        const targetWordsPerChapter = Math.min(3000, Math.ceil(wordCount / 3));
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
            startIndex: currentStart > 0 ? text.indexOf(chapterWords[0]) : 0,
            endIndex: currentEnd === words.length ? text.length : text.indexOf(chapterWords[chapterWords.length - 1]) + chapterWords[chapterWords.length - 1].length,
          });
          
          currentStart = currentEnd;
          chapterNumber++;
        }
        
        logInfo('Text split into length-based chapters', {
          chaptersCreated: chapters.length,
          averageWordsPerChapter: Math.round(wordCount / chapters.length)
        });
        
        return chapters;
      } else {
        // Single chapter for shorter texts
        logInfo('Creating single chapter for short text', { wordCount });
        
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
    
    logInfo('Chapters extracted from detected breaks', {
      chaptersFound: chapters.length,
      patternMatches: chapterBreaks.length
    });
    
    return chapters;

  } catch (error) {
    logError(error as Error, { textLength: text.length });
    throw error;
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const getChapterId = async (storyId: string, index: number): Promise<string | null> => {
  // In production, this would query the database
  // SELECT id FROM chapters WHERE story_id = ? AND chapter_number = ? ORDER BY chapter_number LIMIT 1
  
  logInfo('Getting chapter ID by index', { storyId, index });
  
  // Mock implementation - in reality this would be a real database query
  return `mock-chapter-${storyId}-${index}`;
};

export const updateChapterStatus = async (
  chapterId: string, 
  status: ProcessingStatus
): Promise<void> => {
  // In production, this would update the database
  // UPDATE chapters SET processing_status = ?, updated_at = NOW() WHERE id = ?
  
  logInfo('Updating chapter status', { chapterId, status });
  
  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 25));
};