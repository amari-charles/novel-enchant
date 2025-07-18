/**
 * Resolve Mentions to Entities Function
 * Matches mention text to known entities with confidence scoring
 */

import { handleError, ProcessingError } from '../../../shared/errors.ts';
import { RawMention, Entity, EntityLink, FunctionResponse } from '../../../shared/types.ts';
import { validateResolveMentionsToEntitiesInput, validateRequestBody } from '../../utilities/validation/index.ts';
import { calculateSimilarity } from '../../../shared/utils.ts';
import { PROCESSING_PARAMS } from '../../../shared/constants.ts';
import { logInfo, logError } from '../../../shared/errors.ts';

// ============================================================================
// CORE FUNCTION
// ============================================================================

export const resolveMentionsToEntities = async (
  mentions: RawMention[],
  knownEntities: Entity[]
): Promise<EntityLink[]> => {
  const startTime = performance.now();
  
  try {
    logInfo('Starting mention resolution', { 
      mentionsCount: mentions.length,
      entitiesCount: knownEntities.length
    });
    
    if (mentions.length === 0) {
      return [];
    }
    
    const entityLinks: EntityLink[] = [];
    
    // Process each mention
    for (const mention of mentions) {
      const link = await resolveSingleMention(mention, knownEntities);
      entityLinks.push(link);
    }
    
    // Sort by confidence (highest first)
    entityLinks.sort((a, b) => b.confidence - a.confidence);
    
    const endTime = performance.now();
    const resolvedCount = entityLinks.filter(link => link.resolvedEntityId).length;
    const avgConfidence = entityLinks.length > 0 ? 
      Math.round(entityLinks.reduce((sum, link) => sum + link.confidence, 0) / entityLinks.length * 100) / 100 : 0;
    
    logInfo('Mention resolution completed', {
      processingTime: `${endTime - startTime}ms`,
      totalMentions: mentions.length,
      resolvedMentions: resolvedCount,
      unresolvedMentions: mentions.length - resolvedCount,
      avgConfidence
    });
    
    return entityLinks;
    
  } catch (error) {
    logError(error as Error, { 
      mentionsCount: mentions.length,
      entitiesCount: knownEntities.length 
    });
    throw error;
  }
};

// ============================================================================
// SINGLE MENTION RESOLUTION
// ============================================================================

const resolveSingleMention = async (
  mention: RawMention,
  knownEntities: Entity[]
): Promise<EntityLink> => {
  const candidates = await findCandidates(mention, knownEntities);
  
  if (candidates.length === 0) {
    return {
      mentionText: mention.mentionText,
      confidence: 0,
      disambiguationContext: `No matching entities found for "${mention.mentionText}"`
    };
  }
  
  // Get the best candidate
  const bestCandidate = candidates[0];
  
  // Prepare alternative candidates
  const alternativeCandidates = candidates
    .slice(1, PROCESSING_PARAMS.ENTITY_RESOLUTION.MAX_ALTERNATIVES + 1)
    .map(candidate => candidate.entity.id);
  
  // Create entity link
  const link: EntityLink = {
    mentionText: mention.mentionText,
    confidence: bestCandidate.confidence,
    alternativeCandidates: alternativeCandidates.length > 0 ? alternativeCandidates : undefined,
  };
  
  // Only resolve if confidence is above threshold
  if (bestCandidate.confidence >= PROCESSING_PARAMS.ENTITY_RESOLUTION.MIN_CONFIDENCE) {
    link.resolvedEntityId = bestCandidate.entity.id;
  } else {
    link.disambiguationContext = `Low confidence match. Best candidate: ${bestCandidate.entity.name} (${Math.round(bestCandidate.confidence * 100)}%)`;
  }
  
  return link;
};

// ============================================================================
// CANDIDATE FINDING
// ============================================================================

interface EntityCandidate {
  entity: Entity;
  confidence: number;
  matchType: 'exact' | 'alias' | 'partial' | 'fuzzy';
  matchScore: number;
}

const findCandidates = async (
  mention: RawMention,
  knownEntities: Entity[]
): Promise<EntityCandidate[]> => {
  const candidates: EntityCandidate[] = [];
  const mentionText = mention.mentionText.toLowerCase().trim();
  
  for (const entity of knownEntities) {
    const entityCandidates = await evaluateEntityMatch(mention, entity);
    candidates.push(...entityCandidates);
  }
  
  // Sort by confidence (highest first)
  candidates.sort((a, b) => b.confidence - a.confidence);
  
  // Filter out very low confidence matches
  return candidates.filter(candidate => candidate.confidence > 0.1);
};

const evaluateEntityMatch = async (
  mention: RawMention,
  entity: Entity
): Promise<EntityCandidate[]> => {
  const candidates: EntityCandidate[] = [];
  const mentionText = mention.mentionText.toLowerCase().trim();
  
  // Check exact name match
  if (entity.name.toLowerCase() === mentionText) {
    candidates.push({
      entity,
      confidence: 1.0,
      matchType: 'exact',
      matchScore: 1.0,
    });
  }
  
  // Check alias matches
  if (entity.aliases) {
    for (const alias of entity.aliases) {
      if (alias.toLowerCase() === mentionText) {
        candidates.push({
          entity,
          confidence: 0.95,
          matchType: 'alias',
          matchScore: 1.0,
        });
      }
    }
  }
  
  // Check partial matches (substring)
  const entityNameLower = entity.name.toLowerCase();
  if (entityNameLower.includes(mentionText) || mentionText.includes(entityNameLower)) {
    const similarity = calculateSimilarity(entityNameLower, mentionText);
    if (similarity > 0.7) {
      candidates.push({
        entity,
        confidence: similarity * 0.8, // Reduce confidence for partial matches
        matchType: 'partial',
        matchScore: similarity,
      });
    }
  }
  
  // Check fuzzy matches (edit distance)
  const nameSimilarity = calculateSimilarity(entityNameLower, mentionText);
  if (nameSimilarity >= PROCESSING_PARAMS.ENTITY_RESOLUTION.SIMILARITY_THRESHOLD) {
    candidates.push({
      entity,
      confidence: nameSimilarity * 0.7, // Reduce confidence for fuzzy matches
      matchType: 'fuzzy',
      matchScore: nameSimilarity,
    });
  }
  
  // Apply contextual boosting
  const contextBoostedCandidates = candidates.map(candidate => ({
    ...candidate,
    confidence: applyContextualBoost(candidate, mention),
  }));
  
  return contextBoostedCandidates;
};

// ============================================================================
// CONTEXTUAL BOOSTING
// ============================================================================

const applyContextualBoost = (
  candidate: EntityCandidate,
  mention: RawMention
): number => {
  let boostedConfidence = candidate.confidence;
  const sentence = mention.sentence.toLowerCase();
  const entity = candidate.entity;
  
  // Boost based on entity type consistency
  if (entity.type === 'character') {
    // Character context indicators
    const characterContexts = [
      /\b(?:said|asked|replied|whispered|shouted|told|spoke|thought|felt|saw|heard|went|came|walked|ran|stood|sat|smiled|laughed|cried|nodded|shook)\b/,
      /\b(?:he|she|they|him|her|them|his|hers|their)\b/,
      /\b(?:eyes|face|hand|voice|hair|heart|mind|body)\b/,
    ];
    
    if (characterContexts.some(pattern => pattern.test(sentence))) {
      boostedConfidence *= 1.2;
    }
  } else if (entity.type === 'location') {
    // Location context indicators
    const locationContexts = [
      /\b(?:in|at|to|from|through|across|near|by|outside|inside|within|entered|left|arrived|departed)\b/,
      /\b(?:room|hall|building|city|town|forest|mountain|river|castle|palace|temple|market|street|road)\b/,
    ];
    
    if (locationContexts.some(pattern => pattern.test(sentence))) {
      boostedConfidence *= 1.2;
    }
  }
  
  // Boost for pronoun consistency
  if (isPronoun(mention.mentionText)) {
    // Pronouns get lower confidence unless context is very clear
    boostedConfidence *= 0.6;
  }
  
  // Boost for proper nouns
  if (isProperNoun(mention.mentionText)) {
    boostedConfidence *= 1.1;
  }
  
  // Clamp to [0, 1]
  return Math.min(Math.max(boostedConfidence, 0), 1);
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const isPronoun = (text: string): boolean => {
  const pronouns = [
    'he', 'she', 'they', 'him', 'her', 'them', 'his', 'hers', 'their', 'theirs',
    'it', 'its', 'this', 'that', 'these', 'those'
  ];
  
  return pronouns.includes(text.toLowerCase().trim());
};

const isProperNoun = (text: string): boolean => {
  // Check if text starts with capital letter and doesn't contain common words
  const firstChar = text.charAt(0);
  const isCapitalized = firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase();
  
  const commonWords = [
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'
  ];
  
  const hasCommonWords = commonWords.some(word => text.toLowerCase().includes(word));
  
  return isCapitalized && !hasCommonWords;
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
    const input = validateResolveMentionsToEntitiesInput(body);
    
    // Execute the core function
    const result = await resolveMentionsToEntities(input.mentions, input.knownEntities);
    
    // Return successful response
    const response: FunctionResponse<EntityLink[]> = {
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
export { resolveMentionsToEntities as coreFunction };