/**
 * Chunk Text Into Sections Function
 * Splits text into manageable chunks for processing
 */

import { handleError, ProcessingError } from '../../../shared/errors.ts';
import { Chunk, FunctionResponse } from '../../../shared/types.ts';
import { validateChunkTextIntoSectionsInput, validateRequestBody } from '../../utilities/validation/index.ts';
import { generateUUID } from '../../../shared/utils.ts';
import { PROCESSING_PARAMS } from '../../../shared/constants.ts';
import { logInfo, logError } from '../../../shared/errors.ts';

// ============================================================================
// CORE FUNCTION
// ============================================================================

export const chunkTextIntoSections = async (
  text: string,
  chunkStrategy: 'paragraph' | 'semantic' | 'fixed' = 'paragraph',
  maxChunkSize: number = PROCESSING_PARAMS.TEXT_CHUNKING.DEFAULT_CHUNK_SIZE
): Promise<Chunk[]> => {
  const startTime = performance.now();
  
  try {
    logInfo('Starting text chunking', { 
      textLength: text.length,
      strategy: chunkStrategy,
      maxChunkSize 
    });
    
    if (text.length === 0) {
      throw new ProcessingError('Cannot chunk empty text');
    }
    
    let chunks: Chunk[];
    
    switch (chunkStrategy) {
      case 'paragraph':
        chunks = chunkByParagraph(text, maxChunkSize);
        break;
      case 'semantic':
        chunks = chunkBySemantic(text, maxChunkSize);
        break;
      case 'fixed':
        chunks = chunkByFixedSize(text, maxChunkSize);
        break;
      default:
        throw new ProcessingError(`Unknown chunking strategy: ${chunkStrategy}`);
    }
    
    // Validate that no chunk is too large
    const oversizedChunks = chunks.filter(chunk => chunk.text.length > maxChunkSize);
    if (oversizedChunks.length > 0) {
      logInfo(`Found ${oversizedChunks.length} oversized chunks, applying fixed-size splitting`);
      
      // Re-chunk oversized chunks using fixed-size strategy
      const refinedChunks: Chunk[] = [];
      let currentIndex = 0;
      
      for (const chunk of chunks) {
        if (chunk.text.length > maxChunkSize) {
          const subChunks = chunkByFixedSize(chunk.text, maxChunkSize);
          subChunks.forEach(subChunk => {
            refinedChunks.push({
              ...subChunk,
              index: currentIndex++,
              boundaries: 'forced',
            });
          });
        } else {
          refinedChunks.push({
            ...chunk,
            index: currentIndex++,
          });
        }
      }
      
      chunks = refinedChunks;
    }
    
    const endTime = performance.now();
    logInfo('Text chunking completed', {
      processingTime: `${endTime - startTime}ms`,
      chunksCreated: chunks.length,
      avgChunkSize: Math.round(chunks.reduce((sum, chunk) => sum + chunk.text.length, 0) / chunks.length),
      strategy: chunkStrategy
    });
    
    return chunks;
    
  } catch (error) {
    logError(error as Error, { 
      textLength: text.length, 
      strategy: chunkStrategy,
      maxChunkSize 
    });
    throw error;
  }
};

// ============================================================================
// CHUNKING STRATEGIES
// ============================================================================

const chunkByParagraph = (text: string, maxChunkSize: number): Chunk[] => {
  const chunks: Chunk[] = [];
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  let currentChunk = '';
  let currentChunkStart = 0;
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim();
    
    // If adding this paragraph would exceed max size, finalize current chunk
    if (currentChunk.length > 0 && (currentChunk.length + paragraph.length + 2) > maxChunkSize) {
      chunks.push({
        id: generateUUID(),
        index: chunks.length,
        text: currentChunk.trim(),
        boundaries: 'natural',
      });
      
      currentChunk = paragraph;
      currentChunkStart = i;
    } else {
      // Add paragraph to current chunk
      if (currentChunk.length > 0) {
        currentChunk += '\n\n' + paragraph;
      } else {
        currentChunk = paragraph;
        currentChunkStart = i;
      }
    }
  }
  
  // Add the last chunk if there's content
  if (currentChunk.trim().length > 0) {
    chunks.push({
      id: generateUUID(),
      index: chunks.length,
      text: currentChunk.trim(),
      boundaries: 'natural',
    });
  }
  
  return chunks;
};

const chunkBySemantic = (text: string, maxChunkSize: number): Chunk[] => {
  // Semantic chunking tries to break at natural narrative boundaries
  const chunks: Chunk[] = [];
  
  // Find semantic boundaries (scene breaks, dialogue breaks, etc.)
  const semanticBreaks = findSemanticBreaks(text);
  
  let currentChunk = '';
  let lastBreakIndex = 0;
  
  for (const breakIndex of semanticBreaks) {
    const segment = text.slice(lastBreakIndex, breakIndex).trim();
    
    // If adding this segment would exceed max size, finalize current chunk
    if (currentChunk.length > 0 && (currentChunk.length + segment.length + 1) > maxChunkSize) {
      chunks.push({
        id: generateUUID(),
        index: chunks.length,
        text: currentChunk.trim(),
        boundaries: 'natural',
      });
      
      currentChunk = segment;
    } else {
      // Add segment to current chunk
      if (currentChunk.length > 0) {
        currentChunk += '\n' + segment;
      } else {
        currentChunk = segment;
      }
    }
    
    lastBreakIndex = breakIndex;
  }
  
  // Add the remaining text
  if (lastBreakIndex < text.length) {
    const remaining = text.slice(lastBreakIndex).trim();
    if (remaining.length > 0) {
      if (currentChunk.length > 0 && (currentChunk.length + remaining.length + 1) <= maxChunkSize) {
        currentChunk += '\n' + remaining;
      } else {
        if (currentChunk.length > 0) {
          chunks.push({
            id: generateUUID(),
            index: chunks.length,
            text: currentChunk.trim(),
            boundaries: 'natural',
          });
        }
        currentChunk = remaining;
      }
    }
  }
  
  // Add the last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      id: generateUUID(),
      index: chunks.length,
      text: currentChunk.trim(),
      boundaries: 'natural',
    });
  }
  
  return chunks;
};

const chunkByFixedSize = (text: string, maxChunkSize: number): Chunk[] => {
  const chunks: Chunk[] = [];
  const overlapSize = PROCESSING_PARAMS.TEXT_CHUNKING.OVERLAP_SIZE;
  
  let currentPosition = 0;
  let chunkIndex = 0;
  
  while (currentPosition < text.length) {
    let chunkEnd = Math.min(currentPosition + maxChunkSize, text.length);
    
    // Try to break at a natural boundary (sentence, paragraph, or space)
    if (chunkEnd < text.length) {
      const naturalBreaks = [
        text.lastIndexOf('.', chunkEnd),
        text.lastIndexOf('!', chunkEnd),
        text.lastIndexOf('?', chunkEnd),
        text.lastIndexOf('\n', chunkEnd),
        text.lastIndexOf(' ', chunkEnd),
      ];
      
      const bestBreak = Math.max(...naturalBreaks.filter(index => index > currentPosition + maxChunkSize * 0.8));
      
      if (bestBreak > currentPosition + maxChunkSize * 0.8) {
        chunkEnd = bestBreak + 1;
      }
    }
    
    const chunkText = text.slice(currentPosition, chunkEnd).trim();
    
    if (chunkText.length > 0) {
      chunks.push({
        id: generateUUID(),
        index: chunkIndex++,
        text: chunkText,
        boundaries: chunkEnd === text.length ? 'natural' : 'forced',
      });
    }
    
    // Move to next chunk with overlap
    currentPosition = chunkEnd - overlapSize;
    
    // Ensure we don't go backwards
    if (currentPosition <= chunks[chunks.length - 1]?.text.length) {
      currentPosition = chunkEnd;
    }
  }
  
  return chunks;
};

// ============================================================================
// SEMANTIC BREAK DETECTION
// ============================================================================

const findSemanticBreaks = (text: string): number[] => {
  const breaks: number[] = [];
  
  // Common patterns that indicate scene or section breaks
  const patterns = [
    /\n\s*\*\s*\*\s*\*\s*\n/g,           // *** scene break
    /\n\s*---+\s*\n/g,                    // --- scene break
    /\n\s*#{1,3}\s+[^\n]+\n/g,           // Markdown headers
    /\n\s*Chapter\s+\d+/gi,              // Chapter headings
    /\n\s*Part\s+\d+/gi,                 // Part headings
    /\n\s*\d+\.\s*\n/g,                  // Numbered sections
    /\n\s*\n\s*\n/g,                     // Multiple line breaks
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      breaks.push(match.index);
    }
  }
  
  // Add paragraph breaks as fallback
  let paragraphMatch;
  const paragraphPattern = /\n\s*\n/g;
  while ((paragraphMatch = paragraphPattern.exec(text)) !== null) {
    breaks.push(paragraphMatch.index);
  }
  
  // Sort and deduplicate breaks
  return [...new Set(breaks)].sort((a, b) => a - b);
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
    const input = validateChunkTextIntoSectionsInput(body);
    
    // Execute the core function
    const result = await chunkTextIntoSections(
      input.text,
      input.chunkStrategy,
      input.maxChunkSize
    );
    
    // Return successful response
    const response: FunctionResponse<Chunk[]> = {
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
export { chunkTextIntoSections as coreFunction };