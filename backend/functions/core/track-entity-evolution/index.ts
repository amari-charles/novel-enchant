/**
 * Track Entity Evolution Function
 * Monitors changes in entity descriptions over time
 */

import { handleError, ProcessingError } from '../../../shared/errors.ts';
import { Entity, EvolutionChange, FunctionResponse } from '../../../shared/types.ts';
import { validateTrackEntityEvolutionInput, validateRequestBody } from '../../utilities/validation/index.ts';
import { calculateSimilarity } from '../../../shared/utils.ts';
import { logInfo, logError } from '../../../shared/errors.ts';

// ============================================================================
// CORE FUNCTION
// ============================================================================

export const trackEntityEvolution = async (
  entity: Entity,
  newDescription: string,
  chapterNumber?: number
): Promise<EvolutionChange | null> => {
  const startTime = performance.now();
  
  try {
    logInfo('Starting entity evolution tracking', { 
      entityId: entity.id,
      entityName: entity.name,
      chapterNumber,
      newDescriptionLength: newDescription.length
    });
    
    if (!newDescription || newDescription.trim().length === 0) {
      return null;
    }
    
    const currentDescription = entity.description;
    const trimmedNewDescription = newDescription.trim();
    
    // Check if descriptions are identical
    if (currentDescription === trimmedNewDescription) {
      return {
        updated: false,
        notes: 'No changes detected - descriptions are identical',
        changes: [],
      };
    }
    
    // Calculate similarity between descriptions
    const similarity = calculateSimilarity(currentDescription.toLowerCase(), trimmedNewDescription.toLowerCase());
    
    // If similarity is very high, consider it no significant change
    if (similarity > 0.95) {
      return {
        updated: false,
        notes: `Minimal changes detected (${Math.round(similarity * 100)}% similarity)`,
        changes: [],
      };
    }
    
    // Detect specific changes
    const changes = await detectChanges(currentDescription, trimmedNewDescription);
    
    // Only track if there are meaningful changes
    if (changes.length === 0) {
      return {
        updated: false,
        notes: 'No significant changes detected',
        changes: [],
      };
    }
    
    const evolutionChange: EvolutionChange = {
      updated: true,
      previousDescription: currentDescription,
      changes,
      notes: generateEvolutionNotes(changes, chapterNumber),
    };
    
    const endTime = performance.now();
    logInfo('Entity evolution tracking completed', {
      processingTime: `${endTime - startTime}ms`,
      entityId: entity.id,
      changesDetected: changes.length,
      similarity: Math.round(similarity * 100) + '%',
      updated: evolutionChange.updated
    });
    
    return evolutionChange;
    
  } catch (error) {
    logError(error as Error, { 
      entityId: entity.id,
      entityName: entity.name,
      chapterNumber 
    });
    throw error;
  }
};

// ============================================================================
// CHANGE DETECTION
// ============================================================================

const detectChanges = async (oldDescription: string, newDescription: string): Promise<string[]> => {
  const changes: string[] = [];
  
  // Normalize descriptions for comparison
  const oldNormalized = normalizeDescription(oldDescription);
  const newNormalized = normalizeDescription(newDescription);
  
  // Detect added content
  const addedContent = findAddedContent(oldNormalized, newNormalized);
  if (addedContent.length > 0) {
    changes.push(...addedContent.map(content => `Added: ${content}`));
  }
  
  // Detect removed content
  const removedContent = findRemovedContent(oldNormalized, newNormalized);
  if (removedContent.length > 0) {
    changes.push(...removedContent.map(content => `Removed: ${content}`));
  }
  
  // Detect modifications
  const modifications = findModifications(oldNormalized, newNormalized);
  if (modifications.length > 0) {
    changes.push(...modifications.map(mod => `Modified: ${mod}`));
  }
  
  // Detect specific attribute changes
  const attributeChanges = detectAttributeChanges(oldDescription, newDescription);
  changes.push(...attributeChanges);
  
  return changes;
};

const normalizeDescription = (description: string): string => {
  return description
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
};

const findAddedContent = (oldDesc: string, newDesc: string): string[] => {
  const oldWords = new Set(oldDesc.split(/\s+/));
  const newWords = newDesc.split(/\s+/);
  
  const addedPhrases: string[] = [];
  let currentPhrase = '';
  
  for (const word of newWords) {
    if (!oldWords.has(word)) {
      currentPhrase += (currentPhrase ? ' ' : '') + word;
    } else {
      if (currentPhrase.length > 0) {
        addedPhrases.push(currentPhrase);
        currentPhrase = '';
      }
    }
  }
  
  if (currentPhrase.length > 0) {
    addedPhrases.push(currentPhrase);
  }
  
  // Filter out very short additions
  return addedPhrases.filter(phrase => phrase.length > 3);
};

const findRemovedContent = (oldDesc: string, newDesc: string): string[] => {
  const newWords = new Set(newDesc.split(/\s+/));
  const oldWords = oldDesc.split(/\s+/);
  
  const removedPhrases: string[] = [];
  let currentPhrase = '';
  
  for (const word of oldWords) {
    if (!newWords.has(word)) {
      currentPhrase += (currentPhrase ? ' ' : '') + word;
    } else {
      if (currentPhrase.length > 0) {
        removedPhrases.push(currentPhrase);
        currentPhrase = '';
      }
    }
  }
  
  if (currentPhrase.length > 0) {
    removedPhrases.push(currentPhrase);
  }
  
  // Filter out very short removals
  return removedPhrases.filter(phrase => phrase.length > 3);
};

const findModifications = (oldDesc: string, newDesc: string): string[] => {
  const modifications: string[] = [];
  
  // Look for sentence-level changes
  const oldSentences = oldDesc.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const newSentences = newDesc.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  for (const newSentence of newSentences) {
    const trimmedNew = newSentence.trim();
    if (trimmedNew.length === 0) continue;
    
    // Find the most similar old sentence
    let bestMatch = '';
    let bestSimilarity = 0;
    
    for (const oldSentence of oldSentences) {
      const similarity = calculateSimilarity(oldSentence.trim(), trimmedNew);
      if (similarity > bestSimilarity && similarity > 0.5) {
        bestSimilarity = similarity;
        bestMatch = oldSentence.trim();
      }
    }
    
    // If we found a similar sentence but it's not identical, it's a modification
    if (bestMatch && bestSimilarity < 0.95) {
      modifications.push(`"${bestMatch}" → "${trimmedNew}"`);
    }
  }
  
  return modifications;
};

// ============================================================================
// ATTRIBUTE-SPECIFIC CHANGE DETECTION
// ============================================================================

const detectAttributeChanges = (oldDesc: string, newDesc: string): string[] => {
  const changes: string[] = [];
  
  // Physical appearance changes
  const appearanceChanges = detectAppearanceChanges(oldDesc, newDesc);
  changes.push(...appearanceChanges);
  
  // Clothing changes
  const clothingChanges = detectClothingChanges(oldDesc, newDesc);
  changes.push(...clothingChanges);
  
  // Emotional state changes
  const emotionalChanges = detectEmotionalChanges(oldDesc, newDesc);
  changes.push(...emotionalChanges);
  
  // Injury/condition changes
  const conditionChanges = detectConditionChanges(oldDesc, newDesc);
  changes.push(...conditionChanges);
  
  return changes;
};

const detectAppearanceChanges = (oldDesc: string, newDesc: string): string[] => {
  const appearanceKeywords = [
    'hair', 'eyes', 'skin', 'face', 'height', 'build', 'beard', 'mustache',
    'scar', 'tattoo', 'wrinkles', 'age', 'young', 'old', 'tall', 'short',
    'thin', 'thick', 'muscular', 'slender', 'beautiful', 'handsome', 'ugly'
  ];
  
  return detectKeywordChanges(oldDesc, newDesc, appearanceKeywords, 'appearance');
};

const detectClothingChanges = (oldDesc: string, newDesc: string): string[] => {
  const clothingKeywords = [
    'wearing', 'dressed', 'clothes', 'shirt', 'dress', 'robe', 'cloak',
    'armor', 'helmet', 'boots', 'shoes', 'hat', 'crown', 'jewelry',
    'necklace', 'ring', 'bracelet', 'belt', 'coat', 'jacket', 'pants'
  ];
  
  return detectKeywordChanges(oldDesc, newDesc, clothingKeywords, 'clothing');
};

const detectEmotionalChanges = (oldDesc: string, newDesc: string): string[] => {
  const emotionalKeywords = [
    'happy', 'sad', 'angry', 'afraid', 'worried', 'excited', 'calm',
    'nervous', 'confident', 'tired', 'energetic', 'depressed', 'joyful',
    'anxious', 'peaceful', 'stressed', 'relaxed', 'determined', 'confused'
  ];
  
  return detectKeywordChanges(oldDesc, newDesc, emotionalKeywords, 'emotional state');
};

const detectConditionChanges = (oldDesc: string, newDesc: string): string[] => {
  const conditionKeywords = [
    'injured', 'wounded', 'healthy', 'sick', 'ill', 'healed', 'bleeding',
    'bruised', 'burned', 'scarred', 'limping', 'weak', 'strong', 'dizzy',
    'tired', 'exhausted', 'recovered', 'dying', 'unconscious', 'awake'
  ];
  
  return detectKeywordChanges(oldDesc, newDesc, conditionKeywords, 'condition');
};

const detectKeywordChanges = (
  oldDesc: string,
  newDesc: string,
  keywords: string[],
  category: string
): string[] => {
  const changes: string[] = [];
  const oldLower = oldDesc.toLowerCase();
  const newLower = newDesc.toLowerCase();
  
  for (const keyword of keywords) {
    const oldHas = oldLower.includes(keyword);
    const newHas = newLower.includes(keyword);
    
    if (oldHas && !newHas) {
      changes.push(`${category}: no longer ${keyword}`);
    } else if (!oldHas && newHas) {
      changes.push(`${category}: now ${keyword}`);
    }
  }
  
  return changes;
};

// ============================================================================
// EVOLUTION NOTES GENERATION
// ============================================================================

const generateEvolutionNotes = (changes: string[], chapterNumber?: number): string => {
  if (changes.length === 0) {
    return 'No significant changes detected';
  }
  
  const chapterNote = chapterNumber ? ` (Chapter ${chapterNumber})` : '';
  const changeCount = changes.length;
  
  let notes = `${changeCount} change${changeCount > 1 ? 's' : ''} detected${chapterNote}:\n`;
  
  // Group changes by type
  const addedChanges = changes.filter(c => c.startsWith('Added:'));
  const removedChanges = changes.filter(c => c.startsWith('Removed:'));
  const modifiedChanges = changes.filter(c => c.startsWith('Modified:'));
  const attributeChanges = changes.filter(c => !c.startsWith('Added:') && !c.startsWith('Removed:') && !c.startsWith('Modified:'));
  
  if (addedChanges.length > 0) {
    notes += `\nAdditions: ${addedChanges.map(c => c.substring(7)).join(', ')}`;
  }
  
  if (removedChanges.length > 0) {
    notes += `\nRemovals: ${removedChanges.map(c => c.substring(8)).join(', ')}`;
  }
  
  if (modifiedChanges.length > 0) {
    notes += `\nModifications: ${modifiedChanges.map(c => c.substring(10)).join(', ')}`;
  }
  
  if (attributeChanges.length > 0) {
    notes += `\nAttribute changes: ${attributeChanges.join(', ')}`;
  }
  
  return notes;
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
    const input = validateTrackEntityEvolutionInput(body);
    
    // Execute the core function
    const result = await trackEntityEvolution(
      input.entity,
      input.newDescription,
      input.chapterNumber
    );
    
    // Return successful response
    const response: FunctionResponse<EvolutionChange | null> = {
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
export { trackEntityEvolution as coreFunction };