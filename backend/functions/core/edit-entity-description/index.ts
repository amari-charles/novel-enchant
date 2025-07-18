/**
 * Edit Entity Description Function
 * Updates entity descriptions while preserving history
 */

import { handleError, ProcessingError, DatabaseError } from '../../../shared/errors.ts';
import { UpdatedEntity, FunctionResponse } from '../../../shared/types.ts';
import { validateEditEntityDescriptionInput, validateRequestBody } from '../../utilities/validation/index.ts';
import { updateEntityDescription } from '../../utilities/database-helpers/index.ts';
import { logInfo, logError } from '../../../shared/errors.ts';

// ============================================================================
// CORE FUNCTION
// ============================================================================

export const editEntityDescription = async (
  entityId: string,
  newDescription: string,
  preserveHistory: boolean = true
): Promise<UpdatedEntity> => {
  const startTime = performance.now();
  
  try {
    logInfo('Starting entity description edit', { 
      entityId,
      newDescriptionLength: newDescription.length,
      preserveHistory
    });
    
    if (!newDescription || newDescription.trim().length === 0) {
      throw new ProcessingError('New description cannot be empty');
    }
    
    const trimmedDescription = newDescription.trim();
    
    // For now, this is mocked - in production it would use database operations
    // const updatedEntity = await updateEntityDescription(entityId, trimmedDescription);
    
    // Mock implementation for testing
    const mockResult = await mockUpdateEntityDescription(entityId, trimmedDescription, preserveHistory);
    
    const endTime = performance.now();
    logInfo('Entity description edit completed', {
      processingTime: `${endTime - startTime}ms`,
      entityId,
      updated: true,
      preserveHistory
    });
    
    return mockResult;
    
  } catch (error) {
    logError(error as Error, { 
      entityId,
      newDescriptionLength: newDescription.length 
    });
    
    if (error instanceof DatabaseError) {
      throw new ProcessingError(`Database operation failed: ${error.message}`, { originalError: error });
    }
    
    throw error;
  }
};

// ============================================================================
// MOCK DATABASE OPERATIONS (TO BE REPLACED WITH REAL DATABASE)
// ============================================================================

const mockUpdateEntityDescription = async (
  entityId: string,
  newDescription: string,
  preserveHistory: boolean
): Promise<UpdatedEntity> => {
  // This is a mock implementation for testing
  // In production, this would be replaced with actual database operations
  
  logInfo('Mock database update started', { entityId, preserveHistory });
  
  // Simulate database operation
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Mock the previous description (in real implementation, this would come from the database)
  const mockPreviousDescription = `Previous description for entity ${entityId}`;
  
  // Create the updated entity response
  const updatedEntity: UpdatedEntity = {
    id: entityId,
    updatedDescription: newDescription,
    changeTimestamp: new Date().toISOString(),
  };
  
  // Include previous description if preserving history
  if (preserveHistory) {
    updatedEntity.previousDescription = mockPreviousDescription;
  }
  
  return updatedEntity;
};

// ============================================================================
// REAL DATABASE OPERATIONS (COMMENTED OUT - FOR FUTURE USE)
// ============================================================================

/*
const updateEntityDescriptionInDatabase = async (
  entityId: string,
  newDescription: string,
  preserveHistory: boolean
): Promise<UpdatedEntity> => {
  try {
    // Get current entity to preserve history
    const currentEntity = await getEntityById(entityId);
    
    if (!currentEntity) {
      throw new ProcessingError(`Entity not found: ${entityId}`);
    }
    
    const previousDescription = currentEntity.description;
    
    // Update the entity description
    const updatedEntity = await updateEntityDescription(entityId, newDescription);
    
    // Create entity evolution record if preserving history
    if (preserveHistory && previousDescription !== newDescription) {
      await createEntityEvolution(entityId, newDescription, previousDescription);
    }
    
    return {
      id: entityId,
      updatedDescription: newDescription,
      previousDescription: preserveHistory ? previousDescription : undefined,
      changeTimestamp: new Date().toISOString(),
    };
    
  } catch (error) {
    throw new DatabaseError(`Failed to update entity description: ${error.message}`, { error });
  }
};
*/

// ============================================================================
// VALIDATION & SANITIZATION
// ============================================================================

const validateDescriptionContent = (description: string): string => {
  // Sanitize the description
  const sanitized = description
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s.,!?;:()\-'"]/g, ''); // Remove potentially problematic characters
  
  // Validate length
  if (sanitized.length < 10) {
    throw new ProcessingError('Description must be at least 10 characters long');
  }
  
  if (sanitized.length > 5000) {
    throw new ProcessingError('Description cannot exceed 5000 characters');
  }
  
  return sanitized;
};

const detectDescriptionChanges = (oldDescription: string, newDescription: string): {
  hasChanges: boolean;
  changeType: 'minor' | 'major' | 'complete';
  similarity: number;
} => {
  // Calculate similarity between descriptions
  const similarity = calculateDescriptionSimilarity(oldDescription, newDescription);
  
  let changeType: 'minor' | 'major' | 'complete';
  
  if (similarity > 0.9) {
    changeType = 'minor';
  } else if (similarity > 0.5) {
    changeType = 'major';
  } else {
    changeType = 'complete';
  }
  
  return {
    hasChanges: similarity < 0.99,
    changeType,
    similarity,
  };
};

const calculateDescriptionSimilarity = (desc1: string, desc2: string): number => {
  // Simple similarity calculation based on common words
  const words1 = new Set(desc1.toLowerCase().split(/\s+/));
  const words2 = new Set(desc2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
};

// ============================================================================
// HISTORY MANAGEMENT
// ============================================================================

const createEntityEvolutionRecord = async (
  entityId: string,
  newDescription: string,
  previousDescription: string,
  chapterNumber?: number
): Promise<void> => {
  // This would create a record in the entity_evolution table
  // For now, just log the operation
  
  logInfo('Creating entity evolution record', {
    entityId,
    chapterNumber,
    changeType: 'description_update',
    hasChanges: newDescription !== previousDescription
  });
  
  // In production, this would insert into the database:
  /*
  await createEntityEvolution(entityId, chapterNumber || 0, newDescription, [
    `Description updated from: "${previousDescription}" to: "${newDescription}"`
  ]);
  */
};

// ============================================================================
// ADVANCED FEATURES
// ============================================================================

const suggestDescriptionImprovements = (description: string): string[] => {
  const suggestions: string[] = [];
  
  // Check for common issues
  if (description.length < 50) {
    suggestions.push('Consider adding more detail to make the description more vivid');
  }
  
  if (!description.includes('appearance') && !description.includes('look')) {
    suggestions.push('Consider adding physical appearance details');
  }
  
  if (description.split('.').length < 2) {
    suggestions.push('Consider breaking the description into multiple sentences');
  }
  
  // Check for repetitive words
  const words = description.toLowerCase().split(/\s+/);
  const wordCount = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const repetitiveWords = Object.entries(wordCount)
    .filter(([word, count]) => count > 3 && word.length > 3)
    .map(([word]) => word);
  
  if (repetitiveWords.length > 0) {
    suggestions.push(`Consider varying the use of these repeated words: ${repetitiveWords.join(', ')}`);
  }
  
  return suggestions;
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
    const input = validateEditEntityDescriptionInput(body);
    
    // Validate and sanitize the description
    const sanitizedDescription = validateDescriptionContent(input.newDescription);
    
    // Execute the core function
    const result = await editEntityDescription(
      input.entityId,
      sanitizedDescription,
      input.preserveHistory
    );
    
    // Generate improvement suggestions
    const suggestions = suggestDescriptionImprovements(sanitizedDescription);
    
    // Return successful response with suggestions
    const response: FunctionResponse<UpdatedEntity & { suggestions?: string[] }> = {
      success: true,
      data: {
        ...result,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      },
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
export { editEntityDescription as coreFunction };