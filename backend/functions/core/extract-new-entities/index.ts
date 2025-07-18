/**
 * Extract New Entities From Scene Function
 * Identifies new characters and locations from unresolved mentions
 */

import { handleError, ProcessingError, AIAPIError } from '../../../shared/errors.ts';
import { Entity, EntityLink, FunctionResponse } from '../../../shared/types.ts';
import { validateExtractNewEntitiesFromSceneInput, validateRequestBody } from '../../utilities/validation/index.ts';
import { createOpenAIClient } from '../../utilities/ai-client/index.ts';
import { generateUUID } from '../../../shared/utils.ts';
import { logInfo, logError } from '../../../shared/errors.ts';

// ============================================================================
// CORE FUNCTION
// ============================================================================

export const extractNewEntitiesFromScene = async (
  sceneText: string,
  resolvedLinks: EntityLink[]
): Promise<Entity[]> => {
  const startTime = performance.now();
  
  try {
    logInfo('Starting new entity extraction', { 
      sceneTextLength: sceneText.length,
      resolvedLinksCount: resolvedLinks.length
    });
    
    if (sceneText.length === 0) {
      return [];
    }
    
    // Identify unresolved mentions (mentions without resolved entity IDs)
    const unresolvedMentions = resolvedLinks.filter(link => !link.resolvedEntityId);
    
    if (unresolvedMentions.length === 0) {
      logInfo('No unresolved mentions found, skipping entity extraction');
      return [];
    }
    
    // Get already resolved entities to avoid duplicates
    const resolvedMentionTexts = resolvedLinks
      .filter(link => link.resolvedEntityId)
      .map(link => link.mentionText);
    
    // Extract new entities using AI
    const extractedEntities = await extractEntitiesWithAI(sceneText, resolvedMentionTexts);
    
    // Process and validate extracted entities
    const processedEntities = await processExtractedEntities(extractedEntities, unresolvedMentions);
    
    const endTime = performance.now();
    logInfo('New entity extraction completed', {
      processingTime: `${endTime - startTime}ms`,
      unresolvedMentions: unresolvedMentions.length,
      extractedEntities: processedEntities.length,
      characters: processedEntities.filter(e => e.type === 'character').length,
      locations: processedEntities.filter(e => e.type === 'location').length
    });
    
    return processedEntities;
    
  } catch (error) {
    logError(error as Error, { 
      sceneTextLength: sceneText.length,
      resolvedLinksCount: resolvedLinks.length 
    });
    throw error;
  }
};

// ============================================================================
// AI ENTITY EXTRACTION
// ============================================================================

const extractEntitiesWithAI = async (
  sceneText: string,
  existingMentions: string[]
): Promise<{
  characters: Array<{ name: string; description: string; aliases: string[] }>;
  locations: Array<{ name: string; description: string; type: string }>;
}> => {
  try {
    // For now, this is mocked - in production it would use OpenAI
    // const openAIClient = createOpenAIClient();
    // const result = await openAIClient.extractEntities(sceneText, existingEntities);
    
    // Mock implementation for testing
    const mockResult = await mockExtractEntities(sceneText, existingMentions);
    
    return mockResult;
    
  } catch (error) {
    if (error instanceof AIAPIError) {
      throw new ProcessingError(`AI entity extraction failed: ${error.message}`, { originalError: error });
    }
    throw error;
  }
};

// ============================================================================
// MOCK AI EXTRACTION (TO BE REPLACED WITH REAL AI)
// ============================================================================

const mockExtractEntities = async (
  sceneText: string,
  existingMentions: string[]
): Promise<{
  characters: Array<{ name: string; description: string; aliases: string[] }>;
  locations: Array<{ name: string; description: string; type: string }>;
}> => {
  // This is a mock implementation for testing
  // In production, this would be replaced with actual OpenAI API calls
  
  const characters: Array<{ name: string; description: string; aliases: string[] }> = [];
  const locations: Array<{ name: string; description: string; type: string }> = [];
  
  // Simple pattern-based extraction for testing
  const text = sceneText.toLowerCase();
  
  // Look for potential character names (proper nouns)
  const characterMatches = sceneText.match(/\b[A-Z][a-z]{2,}\b/g) || [];
  const uniqueCharacters = [...new Set(characterMatches)];
  
  for (const name of uniqueCharacters) {
    if (!existingMentions.includes(name) && isLikelyCharacterName(name)) {
      characters.push({
        name,
        description: `A character mentioned in the scene named ${name}`,
        aliases: [],
      });
    }
  }
  
  // Look for potential locations
  const locationKeywords = [
    'castle', 'palace', 'tower', 'hall', 'room', 'chamber', 'kitchen', 'garden',
    'forest', 'mountain', 'river', 'lake', 'city', 'town', 'village', 'street',
    'inn', 'tavern', 'temple', 'market', 'library', 'house', 'building'
  ];
  
  for (const keyword of locationKeywords) {
    if (text.includes(keyword)) {
      const locationName = extractLocationName(sceneText, keyword);
      if (locationName && !existingMentions.includes(locationName)) {
        locations.push({
          name: locationName,
          description: `A ${keyword} mentioned in the scene`,
          type: categorizeLocationType(keyword),
        });
      }
    }
  }
  
  return { characters, locations };
};

const isLikelyCharacterName = (name: string): boolean => {
  // Simple heuristics for character names
  const skipWords = [
    'The', 'And', 'But', 'For', 'Not', 'With', 'From', 'They', 'That', 'This',
    'Were', 'Been', 'Have', 'Their', 'What', 'Your', 'When', 'Where', 'Would',
    'Could', 'Should', 'Will', 'Then', 'Than', 'Only', 'Also', 'Just', 'Very',
    'Even', 'Back', 'Good', 'Great', 'Right', 'Left', 'First', 'Last', 'Next',
    'Before', 'After', 'During', 'While', 'Until', 'Since', 'Though', 'Through'
  ];
  
  return !skipWords.includes(name) && name.length >= 3 && name.length <= 20;
};

const extractLocationName = (text: string, keyword: string): string | null => {
  // Look for patterns like "the Great Hall", "Dragon's Castle", etc.
  const patterns = [
    new RegExp(`(?:the\\s+)?([A-Z][a-z'\\s]*${keyword})`, 'i'),
    new RegExp(`([A-Z][a-z'\\s]*\\s+${keyword})`, 'i'),
    new RegExp(`(${keyword}\\s+of\\s+[A-Z][a-z'\\s]*)`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return null;
};

const categorizeLocationType = (keyword: string): string => {
  const typeMap: Record<string, string> = {
    'castle': 'building',
    'palace': 'building',
    'tower': 'building',
    'hall': 'indoor',
    'room': 'indoor',
    'chamber': 'indoor',
    'kitchen': 'indoor',
    'garden': 'outdoor',
    'forest': 'natural',
    'mountain': 'natural',
    'river': 'natural',
    'lake': 'natural',
    'city': 'city',
    'town': 'city',
    'village': 'city',
    'street': 'outdoor',
    'inn': 'building',
    'tavern': 'building',
    'temple': 'building',
    'market': 'outdoor',
    'library': 'building',
    'house': 'building',
    'building': 'building',
  };
  
  return typeMap[keyword.toLowerCase()] || 'unknown';
};

// ============================================================================
// ENTITY PROCESSING
// ============================================================================

const processExtractedEntities = async (
  extractedEntities: {
    characters: Array<{ name: string; description: string; aliases: string[] }>;
    locations: Array<{ name: string; description: string; type: string }>;
  },
  unresolvedMentions: EntityLink[]
): Promise<Entity[]> => {
  const entities: Entity[] = [];
  
  // Process characters
  for (const character of extractedEntities.characters) {
    const entity: Entity = {
      id: generateUUID(),
      name: character.name,
      type: 'character',
      description: character.description,
      aliases: character.aliases,
    };
    
    entities.push(entity);
  }
  
  // Process locations
  for (const location of extractedEntities.locations) {
    const entity: Entity = {
      id: generateUUID(),
      name: location.name,
      type: 'location',
      description: location.description,
      aliases: [],
    };
    
    entities.push(entity);
  }
  
  // Filter out entities that are too similar to unresolved mentions
  const relevantEntities = entities.filter(entity => 
    isRelevantToUnresolvedMentions(entity, unresolvedMentions)
  );
  
  return relevantEntities;
};

const isRelevantToUnresolvedMentions = (
  entity: Entity,
  unresolvedMentions: EntityLink[]
): boolean => {
  const entityName = entity.name.toLowerCase();
  
  // Check if this entity could resolve any of the unresolved mentions
  for (const mention of unresolvedMentions) {
    const mentionText = mention.mentionText.toLowerCase();
    
    // Check for exact match or close similarity
    if (entityName === mentionText || 
        entityName.includes(mentionText) || 
        mentionText.includes(entityName)) {
      return true;
    }
    
    // Check aliases
    if (entity.aliases) {
      for (const alias of entity.aliases) {
        if (alias.toLowerCase() === mentionText) {
          return true;
        }
      }
    }
  }
  
  return false;
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
    const input = validateExtractNewEntitiesFromSceneInput(body);
    
    // Execute the core function
    const result = await extractNewEntitiesFromScene(input.sceneText, input.resolvedLinks);
    
    // Return successful response
    const response: FunctionResponse<Entity[]> = {
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
export { extractNewEntitiesFromScene as coreFunction };