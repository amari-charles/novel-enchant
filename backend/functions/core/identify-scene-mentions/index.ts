/**
 * Identify Scene Mentions Function
 * Finds character and location mentions in scene text
 */

import { handleError, ProcessingError } from '../../../shared/errors.ts';
import { RawMention, FunctionResponse } from '../../../shared/types.ts';
import { validateIdentifySceneMentionsInput, validateRequestBody } from '../../utilities/validation/index.ts';
import { generateUUID } from '../../../shared/utils.ts';
import { logInfo, logError } from '../../../shared/errors.ts';

// ============================================================================
// CORE FUNCTION
// ============================================================================

export const identifySceneMentions = async (sceneText: string): Promise<RawMention[]> => {
  const startTime = performance.now();
  
  try {
    logInfo('Starting mention identification', { 
      textLength: sceneText.length 
    });
    
    if (sceneText.length === 0) {
      return [];
    }
    
    const mentions: RawMention[] = [];
    
    // Split text into sentences for context
    const sentences = splitIntoSentences(sceneText);
    
    // Find potential character mentions
    const characterMentions = findCharacterMentions(sentences);
    mentions.push(...characterMentions);
    
    // Find potential location mentions
    const locationMentions = findLocationMentions(sentences);
    mentions.push(...locationMentions);
    
    // Remove duplicates and filter out very short mentions
    const filteredMentions = deduplicateMentions(mentions).filter(mention => 
      mention.mentionText.length >= 2 && 
      mention.mentionText.length <= 50
    );
    
    const endTime = performance.now();
    logInfo('Mention identification completed', {
      processingTime: `${endTime - startTime}ms`,
      mentionsFound: filteredMentions.length,
      characterMentions: filteredMentions.filter(m => isLikelyCharacterMention(m.mentionText)).length,
      locationMentions: filteredMentions.filter(m => isLikelyLocationMention(m.mentionText)).length
    });
    
    return filteredMentions;
    
  } catch (error) {
    logError(error as Error, { textLength: sceneText.length });
    throw error;
  }
};

// ============================================================================
// SENTENCE SPLITTING
// ============================================================================

const splitIntoSentences = (text: string): string[] => {
  // Split on sentence boundaries while preserving context
  const sentences = text
    .split(/[.!?]+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 0);
  
  return sentences;
};

// ============================================================================
// CHARACTER MENTION DETECTION
// ============================================================================

const findCharacterMentions = (sentences: string[]): RawMention[] => {
  const mentions: RawMention[] = [];
  
  // Patterns for character mentions
  const characterPatterns = [
    // Proper names (capitalized words)
    /\b[A-Z][a-z]{2,}\b/g,
    // Titles with names
    /\b(?:Mr|Mrs|Ms|Dr|Lord|Lady|Sir|Captain|Professor|King|Queen|Prince|Princess)\.?\s+[A-Z][a-z]+/g,
    // Pronouns (he, she, they, etc.)
    /\b(?:he|she|they|him|her|them|his|hers|their|theirs)\b/gi,
    // Family relations
    /\b(?:mother|father|mom|dad|sister|brother|aunt|uncle|grandmother|grandfather|cousin)\b/gi,
    // Roles/occupations when used as names
    /\b(?:the\s+)?(?:guard|soldier|merchant|wizard|knight|priest|doctor|teacher|captain|admiral)\b/gi,
  ];
  
  sentences.forEach((sentence, sentenceIndex) => {
    characterPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(sentence)) !== null) {
        const mentionText = match[0].trim();
        
        // Skip common words that aren't likely to be character names
        if (isLikelyCharacterMention(mentionText)) {
          mentions.push({
            mentionText,
            sentence: sentence.trim(),
            startIndex: match.index,
            endIndex: match.index + mentionText.length,
          });
        }
      }
    });
  });
  
  return mentions;
};

// ============================================================================
// LOCATION MENTION DETECTION
// ============================================================================

const findLocationMentions = (sentences: string[]): RawMention[] => {
  const mentions: RawMention[] = [];
  
  // Patterns for location mentions
  const locationPatterns = [
    // Places with prepositions
    /\b(?:in|at|to|from|through|across|near|by|outside|inside|within|beneath|above|below|beyond)\s+(?:the\s+)?([A-Z][a-z\s]{2,20})\b/g,
    // Specific location types
    /\b(?:the\s+)?([A-Z][a-z\s]*(?:castle|palace|tower|hall|room|chamber|kitchen|garden|forest|mountain|river|lake|sea|ocean|desert|valley|cave|dungeon|city|town|village|street|road|bridge|inn|tavern|temple|church|market|square|library|shop|house|home|building))\b/g,
    // Directional locations
    /\b(?:the\s+)?([A-Z][a-z\s]*(?:north|south|east|west|northern|southern|eastern|western)\s+\w+)\b/g,
  ];
  
  sentences.forEach((sentence, sentenceIndex) => {
    locationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(sentence)) !== null) {
        const mentionText = (match[1] || match[0]).trim();
        
        // Skip if it's likely a character name instead
        if (isLikelyLocationMention(mentionText)) {
          mentions.push({
            mentionText,
            sentence: sentence.trim(),
            startIndex: match.index,
            endIndex: match.index + mentionText.length,
          });
        }
      }
    });
  });
  
  return mentions;
};

// ============================================================================
// MENTION CLASSIFICATION
// ============================================================================

const isLikelyCharacterMention = (text: string): boolean => {
  const cleanText = text.toLowerCase().trim();
  
  // Skip common words that are unlikely to be character names
  const skipWords = [
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'among', 'until', 'while', 'since', 'although', 'unless',
    'because', 'where', 'when', 'why', 'how', 'what', 'which', 'who', 'whom',
    'this', 'that', 'these', 'those', 'all', 'any', 'each', 'every', 'some',
    'many', 'much', 'few', 'little', 'more', 'most', 'less', 'least', 'own',
    'such', 'same', 'so', 'than', 'too', 'very', 'just', 'now', 'here', 'there',
    'once', 'again', 'also', 'still', 'yet', 'already', 'never', 'always',
    'often', 'sometimes', 'usually', 'perhaps', 'maybe', 'probably', 'certainly',
    'indeed', 'really', 'actually', 'exactly', 'quite', 'rather', 'fairly',
    'instead', 'otherwise', 'however', 'therefore', 'moreover', 'furthermore',
    'meanwhile', 'finally', 'suddenly', 'immediately', 'quickly', 'slowly',
    'carefully', 'easily', 'hardly', 'nearly', 'almost', 'completely', 'entirely'
  ];
  
  if (skipWords.includes(cleanText)) {
    return false;
  }
  
  // Character indicators
  const characterIndicators = [
    /^(?:he|she|they|him|her|them|his|hers|their)$/i,
    /^(?:mr|mrs|ms|dr|lord|lady|sir|captain|professor|king|queen|prince|princess)/i,
    /^(?:mother|father|mom|dad|sister|brother|aunt|uncle|grandmother|grandfather|cousin)$/i,
    /^[A-Z][a-z]+$/, // Simple proper nouns
  ];
  
  return characterIndicators.some(pattern => pattern.test(cleanText));
};

const isLikelyLocationMention = (text: string): boolean => {
  const cleanText = text.toLowerCase().trim();
  
  // Skip if it looks more like a character name
  if (isLikelyCharacterMention(text)) {
    return false;
  }
  
  // Location indicators
  const locationIndicators = [
    /\b(?:castle|palace|tower|hall|room|chamber|kitchen|garden|forest|mountain|river|lake|sea|ocean|desert|valley|cave|dungeon|city|town|village|street|road|bridge|inn|tavern|temple|church|market|square|library|shop|house|home|building)\b/i,
    /\b(?:north|south|east|west|northern|southern|eastern|western)\b/i,
    /^the\s+/i, // Often locations start with "the"
  ];
  
  return locationIndicators.some(pattern => pattern.test(cleanText));
};

// ============================================================================
// MENTION DEDUPLICATION
// ============================================================================

const deduplicateMentions = (mentions: RawMention[]): RawMention[] => {
  const seen = new Set<string>();
  const unique: RawMention[] = [];
  
  for (const mention of mentions) {
    const key = `${mention.mentionText.toLowerCase()}:${mention.sentence}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(mention);
    }
  }
  
  return unique;
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
    const input = validateIdentifySceneMentionsInput(body);
    
    // Execute the core function
    const result = await identifySceneMentions(input.sceneText);
    
    // Return successful response
    const response: FunctionResponse<RawMention[]> = {
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
export { identifySceneMentions as coreFunction };