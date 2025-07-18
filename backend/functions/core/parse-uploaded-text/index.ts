/**
 * Parse Uploaded Text Function
 * Extracts text content from uploaded files (PDF, TXT, DOCX, EPUB)
 */

import { handleError, ProcessingError } from '../../../shared/errors.ts';
import { ParsedText, ParsedChapter, FunctionResponse } from '../../../shared/types.ts';
import { validateParseUploadedTextInput, validateRequestBody } from '../../utilities/validation/index.ts';
import { extractTitle, splitIntoChapters, cleanText } from '../../../shared/utils.ts';
import { logInfo, logError } from '../../../shared/errors.ts';

// ============================================================================
// CORE FUNCTION
// ============================================================================

export const parseUploadedText = async (file: File): Promise<ParsedText> => {
  const startTime = performance.now();
  
  try {
    logInfo('Starting text parsing', { 
      fileName: file.name, 
      fileSize: file.size,
      fileType: file.type 
    });
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    let rawText: string;
    
    // Parse based on file type
    switch (extension) {
      case 'txt':
        rawText = await parseTxtFile(file);
        break;
      case 'pdf':
        rawText = await parsePdfFile(file);
        break;
      case 'docx':
        rawText = await parseDocxFile(file);
        break;
      case 'epub':
        rawText = await parseEpubFile(file);
        break;
      default:
        throw new ProcessingError(`Unsupported file format: ${extension}`);
    }
    
    if (!rawText || rawText.trim().length === 0) {
      throw new ProcessingError('No text content found in file');
    }
    
    // Clean and normalize the text
    const cleanedText = cleanText(rawText);
    
    // Extract title
    const title = extractTitle(cleanedText);
    
    // Perform content-based chapter detection
    const chapterDetection = await detectChapterStructure(cleanedText);
    
    const result: ParsedText = {
      title,
      fullText: cleanedText,
      chapters: chapterDetection.chapters.length > 0 ? chapterDetection.chapters : undefined,
      contentType: chapterDetection.contentType,
      detectionMetadata: chapterDetection.metadata,
    };
    
    const endTime = performance.now();
    logInfo('Text parsing completed', {
      processingTime: `${endTime - startTime}ms`,
      textLength: cleanedText.length,
      chaptersFound: chapterDetection.chapters.length,
      contentType: chapterDetection.contentType,
      detectionConfidence: chapterDetection.metadata.confidence,
      title
    });
    
    return result;
    
  } catch (error) {
    logError(error as Error, { fileName: file.name, fileSize: file.size });
    throw error;
  }
};

// ============================================================================
// FILE TYPE PARSERS
// ============================================================================

const parseTxtFile = async (file: File): Promise<string> => {
  try {
    const text = await file.text();
    return text;
  } catch (error) {
    throw new ProcessingError(`Failed to parse TXT file: ${error.message}`);
  }
};

const parsePdfFile = async (file: File): Promise<string> => {
  try {
    // For PDF parsing, we'll use a PDF library
    // This is a placeholder - in production you'd use pdf-parse or similar
    const arrayBuffer = await file.arrayBuffer();
    
    // Placeholder: Basic PDF text extraction
    // In reality, you'd use a proper PDF parsing library
    const text = await extractTextFromPDF(arrayBuffer);
    
    return text;
  } catch (error) {
    throw new ProcessingError(`Failed to parse PDF file: ${error.message}`);
  }
};

const parseDocxFile = async (file: File): Promise<string> => {
  try {
    // For DOCX parsing, we'll use a DOCX library
    // This is a placeholder - in production you'd use mammoth or similar
    const arrayBuffer = await file.arrayBuffer();
    
    // Placeholder: Basic DOCX text extraction
    const text = await extractTextFromDOCX(arrayBuffer);
    
    return text;
  } catch (error) {
    throw new ProcessingError(`Failed to parse DOCX file: ${error.message}`);
  }
};

const parseEpubFile = async (file: File): Promise<string> => {
  try {
    // For EPUB parsing, we'll use an EPUB library
    // This is a placeholder - in production you'd use epub2 or similar
    const arrayBuffer = await file.arrayBuffer();
    
    // Placeholder: Basic EPUB text extraction
    const text = await extractTextFromEPUB(arrayBuffer);
    
    return text;
  } catch (error) {
    throw new ProcessingError(`Failed to parse EPUB file: ${error.message}`);
  }
};

// ============================================================================
// PLACEHOLDER PARSERS (TO BE REPLACED WITH ACTUAL LIBRARIES)
// ============================================================================

const extractTextFromPDF = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  // Placeholder implementation
  // In production, you would use a library like pdf-parse:
  // import pdfParse from 'pdf-parse';
  // const pdf = await pdfParse(Buffer.from(arrayBuffer));
  // return pdf.text;
  
  // For now, return a placeholder
  throw new ProcessingError('PDF parsing not yet implemented. Please use TXT files for now.');
};

const extractTextFromDOCX = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  // Placeholder implementation
  // In production, you would use a library like mammoth:
  // import mammoth from 'mammoth';
  // const result = await mammoth.extractRawText({ arrayBuffer });
  // return result.value;
  
  // For now, return a placeholder
  throw new ProcessingError('DOCX parsing not yet implemented. Please use TXT files for now.');
};

const extractTextFromEPUB = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  // Placeholder implementation
  // In production, you would use a library like epub2:
  // import { parseEpub } from 'epub2';
  // const epub = await parseEpub(arrayBuffer);
  // return epub.sections.map(section => section.text).join('\n\n');
  
  // For now, return a placeholder
  throw new ProcessingError('EPUB parsing not yet implemented. Please use TXT files for now.');
};

// ============================================================================
// CONTENT-BASED CHAPTER DETECTION
// ============================================================================

interface ChapterDetectionResult {
  chapters: ParsedChapter[];
  contentType: 'single_chapter' | 'multi_chapter' | 'full_book';
  metadata: {
    chapterPatterns: string[];
    wordCount: number;
    structuralIndicators: string[];
    confidence: number;
  };
}

const detectChapterStructure = async (text: string): Promise<ChapterDetectionResult> => {
  const wordCount = text.split(/\s+/).length;
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Chapter detection patterns
  const chapterPatterns = [
    /^chapter\s+\d+/i,
    /^chapter\s+one|two|three|four|five|six|seven|eight|nine|ten/i,
    /^ch\.\s*\d+/i,
    /^\d+\.\s*[A-Z]/,
    /^part\s+\d+/i,
    /^book\s+\d+/i,
  ];
  
  // Find potential chapter headings
  const chapterMatches: Array<{ line: string; index: number; pattern: string }> = [];
  const foundPatterns: string[] = [];
  
  lines.forEach((line, index) => {
    chapterPatterns.forEach(pattern => {
      if (pattern.test(line)) {
        chapterMatches.push({ 
          line, 
          index, 
          pattern: pattern.source 
        });
        if (!foundPatterns.includes(pattern.source)) {
          foundPatterns.push(pattern.source);
        }
      }
    });
  });
  
  // Analyze structural indicators
  const structuralIndicators: string[] = [];
  
  // Check for consistent formatting
  if (lines.some(line => line.match(/^[A-Z\s]+$/))) {
    structuralIndicators.push('ALL_CAPS_HEADINGS');
  }
  
  // Check for section breaks
  if (text.includes('***') || text.includes('---')) {
    structuralIndicators.push('SECTION_BREAKS');
  }
  
  // Check word count thresholds
  if (wordCount > 50000) {
    structuralIndicators.push('NOVEL_LENGTH');
  } else if (wordCount > 10000) {
    structuralIndicators.push('NOVELLA_LENGTH');
  } else if (wordCount > 1000) {
    structuralIndicators.push('SHORT_STORY_LENGTH');
  }
  
  // Determine content type and confidence
  let contentType: ChapterDetectionResult['contentType'];
  let confidence: number;
  
  if (chapterMatches.length >= 2) {
    // Multiple chapters detected
    contentType = chapterMatches.length >= 10 ? 'full_book' : 'multi_chapter';
    confidence = Math.min(0.9, 0.6 + (chapterMatches.length * 0.05));
  } else if (wordCount > 50000) {
    // Long text without clear chapter markers - likely a full book
    contentType = 'full_book';
    confidence = 0.7;
  } else if (wordCount > 10000 && structuralIndicators.length > 1) {
    // Medium length with some structure - might be multi-chapter
    contentType = 'multi_chapter';
    confidence = 0.6;
  } else {
    // Single chapter or short story
    contentType = 'single_chapter';
    confidence = 0.8;
  }
  
  // Create ParsedChapter objects
  const chapters: ParsedChapter[] = [];
  
  if (chapterMatches.length >= 2) {
    // Split text into chapters based on detected headings
    for (let i = 0; i < chapterMatches.length; i++) {
      const currentMatch = chapterMatches[i];
      const nextMatch = chapterMatches[i + 1];
      
      const startIndex = text.indexOf(currentMatch.line);
      const endIndex = nextMatch ? text.indexOf(nextMatch.line) : text.length;
      
      const chapterContent = text.substring(startIndex, endIndex).trim();
      
      chapters.push({
        id: crypto.randomUUID(),
        number: i + 1,
        title: currentMatch.line,
        content: chapterContent,
        wordCount: chapterContent.split(/\s+/).length,
        startIndex,
        endIndex,
      });
    }
  } else if (contentType === 'single_chapter') {
    // Treat entire text as single chapter
    chapters.push({
      id: crypto.randomUUID(),
      number: 1,
      title: 'Chapter 1',
      content: text,
      wordCount: wordCount,
      startIndex: 0,
      endIndex: text.length,
    });
  }
  
  return {
    chapters,
    contentType,
    metadata: {
      chapterPatterns: foundPatterns,
      wordCount,
      structuralIndicators,
      confidence,
    },
  };
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
    const input = validateParseUploadedTextInput(body);
    
    // Execute the core function
    const result = await parseUploadedText(input.file);
    
    // Return successful response
    const response: FunctionResponse<ParsedText> = {
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
export { parseUploadedText as coreFunction };