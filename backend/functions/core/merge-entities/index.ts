/**
 * Merge Entities Function
 * Combines new entities with existing ones, handling duplicates and conflicts
 */

import { handleError, ProcessingError } from '../../../shared/errors.ts';
import { Entity, FunctionResponse } from '../../../shared/types.ts';
import { validateMergeEntitiesInput, validateRequestBody } from '../../utilities/validation/index.ts';
import { calculateSimilarity, generateUUID } from '../../../shared/utils.ts';
import { logInfo, logError } from '../../../shared/errors.ts';

// ============================================================================
// CORE FUNCTION
// ============================================================================

export const mergeEntities = async (
  newEntities: Entity[],
  existingEntities: Entity[]
): Promise<Entity[]> => {
  const startTime = performance.now();
  
  try {
    logInfo('Starting entity merging', { 
      newEntitiesCount: newEntities.length,
      existingEntitiesCount: existingEntities.length
    });
    
    if (newEntities.length === 0) {
      return existingEntities;
    }
    
    if (existingEntities.length === 0) {
      return newEntities;
    }
    
    // Start with existing entities
    const mergedEntities = [...existingEntities];
    const mergeResults = {
      added: 0,
      merged: 0,
      skipped: 0,
      conflicts: 0,
    };
    
    // Process each new entity
    for (const newEntity of newEntities) {
      const mergeResult = await mergeEntityIntoList(newEntity, mergedEntities);
      
      switch (mergeResult.action) {
        case 'add':
          mergedEntities.push(mergeResult.entity);
          mergeResults.added++;
          break;
        case 'merge':
          const existingIndex = mergedEntities.findIndex(e => e.id === mergeResult.targetId);
          if (existingIndex !== -1) {
            mergedEntities[existingIndex] = mergeResult.entity;
            mergeResults.merged++;
          }
          break;
        case 'skip':
          mergeResults.skipped++;
          break;
        case 'conflict':
          // For conflicts, we add the new entity with a modified name
          const conflictEntity = {
            ...newEntity,
            name: `${newEntity.name} (variant)`,
            id: generateUUID(),
          };
          mergedEntities.push(conflictEntity);
          mergeResults.conflicts++;
          break;
      }
    }
    
    const endTime = performance.now();
    logInfo('Entity merging completed', {
      processingTime: `${endTime - startTime}ms`,
      finalCount: mergedEntities.length,
      ...mergeResults
    });
    
    return mergedEntities;
    
  } catch (error) {
    logError(error as Error, { 
      newEntitiesCount: newEntities.length,
      existingEntitiesCount: existingEntities.length 
    });
    throw error;
  }
};

// ============================================================================
// SINGLE ENTITY MERGING
// ============================================================================

interface MergeResult {
  action: 'add' | 'merge' | 'skip' | 'conflict';
  entity: Entity;
  targetId?: string;
  reason?: string;
}

const mergeEntityIntoList = async (
  newEntity: Entity,
  existingEntities: Entity[]
): Promise<MergeResult> => {
  // Find potential matches
  const matches = findMatches(newEntity, existingEntities);
  
  if (matches.length === 0) {
    // No matches, add as new entity
    return {
      action: 'add',
      entity: newEntity,
      reason: 'No similar entities found',
    };
  }
  
  // Get the best match
  const bestMatch = matches[0];
  
  if (bestMatch.similarity > 0.95) {
    // Very high similarity - likely the same entity
    if (bestMatch.entity.type === newEntity.type) {
      // Same type - merge them
      const mergedEntity = await mergeEntityData(bestMatch.entity, newEntity);
      return {
        action: 'merge',
        entity: mergedEntity,
        targetId: bestMatch.entity.id,
        reason: `High similarity (${Math.round(bestMatch.similarity * 100)}%) - merged`,
      };
    } else {
      // Different types - conflict
      return {
        action: 'conflict',
        entity: newEntity,
        reason: `High similarity but different types (${bestMatch.entity.type} vs ${newEntity.type})`,
      };
    }
  } else if (bestMatch.similarity > 0.8) {
    // Moderate similarity - check for exact name match
    if (bestMatch.entity.name.toLowerCase() === newEntity.name.toLowerCase()) {
      if (bestMatch.entity.type === newEntity.type) {
        // Same name and type - merge
        const mergedEntity = await mergeEntityData(bestMatch.entity, newEntity);
        return {
          action: 'merge',
          entity: mergedEntity,
          targetId: bestMatch.entity.id,
          reason: 'Exact name match - merged',
        };
      } else {
        // Same name but different type - conflict
        return {
          action: 'conflict',
          entity: newEntity,
          reason: `Same name but different types (${bestMatch.entity.type} vs ${newEntity.type})`,
        };
      }
    } else {
      // Similar but not exact - add as new entity
      return {
        action: 'add',
        entity: newEntity,
        reason: `Similar to existing entity but not exact match (${Math.round(bestMatch.similarity * 100)}%)`,
      };
    }
  } else {
    // Low similarity - add as new entity
    return {
      action: 'add',
      entity: newEntity,
      reason: `Low similarity to existing entities (${Math.round(bestMatch.similarity * 100)}%)`,
    };
  }
};

// ============================================================================
// ENTITY MATCHING
// ============================================================================

interface EntityMatch {
  entity: Entity;
  similarity: number;
  matchType: 'name' | 'alias' | 'description';
}

const findMatches = (newEntity: Entity, existingEntities: Entity[]): EntityMatch[] => {
  const matches: EntityMatch[] = [];
  
  for (const existingEntity of existingEntities) {
    const match = calculateEntitySimilarity(newEntity, existingEntity);
    if (match.similarity > 0.3) { // Only consider matches above 30%
      matches.push(match);
    }
  }
  
  // Sort by similarity (highest first)
  matches.sort((a, b) => b.similarity - a.similarity);
  
  return matches;
};

const calculateEntitySimilarity = (entity1: Entity, entity2: Entity): EntityMatch => {
  let maxSimilarity = 0;
  let matchType: 'name' | 'alias' | 'description' = 'name';
  
  // Compare names
  const nameSimilarity = calculateSimilarity(
    entity1.name.toLowerCase(),
    entity2.name.toLowerCase()
  );
  
  if (nameSimilarity > maxSimilarity) {
    maxSimilarity = nameSimilarity;
    matchType = 'name';
  }
  
  // Compare aliases
  const allAliases1 = [entity1.name, ...(entity1.aliases || [])];
  const allAliases2 = [entity2.name, ...(entity2.aliases || [])];
  
  for (const alias1 of allAliases1) {
    for (const alias2 of allAliases2) {
      const aliasSimilarity = calculateSimilarity(
        alias1.toLowerCase(),
        alias2.toLowerCase()
      );
      
      if (aliasSimilarity > maxSimilarity) {
        maxSimilarity = aliasSimilarity;
        matchType = 'alias';
      }
    }
  }
  
  // Compare descriptions (with lower weight)
  const descriptionSimilarity = calculateSimilarity(
    entity1.description.toLowerCase(),
    entity2.description.toLowerCase()
  ) * 0.7; // Reduce weight for description matches
  
  if (descriptionSimilarity > maxSimilarity) {
    maxSimilarity = descriptionSimilarity;
    matchType = 'description';
  }
  
  return {
    entity: entity2,
    similarity: maxSimilarity,
    matchType,
  };
};

// ============================================================================
// ENTITY DATA MERGING
// ============================================================================

const mergeEntityData = async (existingEntity: Entity, newEntity: Entity): Promise<Entity> => {
  // Start with existing entity as base
  const mergedEntity: Entity = {
    ...existingEntity,
    // Keep the original ID
    id: existingEntity.id,
    // Use the more detailed description
    description: chooseBetterDescription(existingEntity.description, newEntity.description),
    // Merge aliases
    aliases: mergeAliases(existingEntity.aliases || [], newEntity.aliases || []),
    // Keep first appearance if it exists
    firstAppearance: existingEntity.firstAppearance || newEntity.firstAppearance,
  };
  
  // If new entity has a better name (longer, more descriptive), use it
  if (newEntity.name.length > existingEntity.name.length && 
      newEntity.name.toLowerCase().includes(existingEntity.name.toLowerCase())) {
    mergedEntity.name = newEntity.name;
  }
  
  return mergedEntity;
};

const chooseBetterDescription = (existing: string, newDesc: string): string => {
  // Choose the longer, more descriptive description
  if (newDesc.length > existing.length * 1.5) {
    return newDesc;
  }
  
  // If new description adds significant new information, combine them
  const existingWords = new Set(existing.toLowerCase().split(/\s+/));
  const newWords = new Set(newDesc.toLowerCase().split(/\s+/));
  
  const uniqueNewWords = [...newWords].filter(word => !existingWords.has(word));
  
  if (uniqueNewWords.length > 3) {
    return `${existing} ${newDesc}`;
  }
  
  return existing;
};

const mergeAliases = (existing: string[], newAliases: string[]): string[] => {
  // Combine and deduplicate aliases
  const combined = [...existing, ...newAliases];
  const uniqueAliases = [...new Set(combined.map(alias => alias.toLowerCase()))]
    .map(alias => {
      // Find the original case version
      return combined.find(original => original.toLowerCase() === alias) || alias;
    });
  
  return uniqueAliases;
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
    const input = validateMergeEntitiesInput(body);
    
    // Execute the core function
    const result = await mergeEntities(input.newEntities, input.existingEntities);
    
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
export { mergeEntities as coreFunction };