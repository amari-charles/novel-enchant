/**
 * Apply Prompt Modifications Function
 * Applies user modifications to existing prompts while maintaining quality and consistency
 */

import { handleError, ProcessingError, ValidationError } from '../../../shared/errors.ts';
import { 
  Prompt, 
  ModificationRequest, 
  FunctionResponse 
} from '../../../shared/types.ts';
import { validateApplyPromptModificationsInput, validateRequestBody } from '../../utilities/validation/index.ts';
import { STYLE_CONFIGURATIONS, PROCESSING_PARAMS } from '../../../shared/constants.ts';
import { logInfo, logError } from '../../../shared/errors.ts';

// ============================================================================
// CORE FUNCTION
// ============================================================================

export const applyPromptModifications = async (
  originalPrompt: Prompt,
  modifications: ModificationRequest[]
): Promise<Prompt> => {
  const startTime = performance.now();
  
  try {
    logInfo('Starting prompt modifications', { 
      originalPromptId: originalPrompt.id,
      modificationsCount: modifications.length,
      modificationTypes: modifications.map(m => m.type)
    });
    
    // Validate modifications
    await validateModifications(modifications, originalPrompt);
    
    // Apply modifications in order
    let modifiedPrompt = { ...originalPrompt };
    
    for (const modification of modifications) {
      modifiedPrompt = await applyIndividualModification(modifiedPrompt, modification);
    }
    
    // Validate final prompt quality
    const validationResult = await validateModifiedPrompt(modifiedPrompt, originalPrompt);
    
    if (!validationResult.isValid) {
      throw new ProcessingError(
        `Modified prompt failed validation: ${validationResult.issues.join(', ')}`,
        { originalPrompt, modifications, validationIssues: validationResult.issues }
      );
    }
    
    // Update metadata
    modifiedPrompt = {
      ...modifiedPrompt,
      id: crypto.randomUUID(),
      parentPromptId: originalPrompt.id,
      modificationHistory: [
        ...(originalPrompt.modificationHistory || []),
        {
          timestamp: new Date().toISOString(),
          modifications: modifications.map(m => ({
            type: m.type,
            description: m.description || `Applied ${m.type} modification`,
          })),
          previousPromptId: originalPrompt.id,
        },
      ],
    };
    
    const endTime = performance.now();
    logInfo('Prompt modifications completed', {
      processingTime: `${endTime - startTime}ms`,
      originalPromptId: originalPrompt.id,
      newPromptId: modifiedPrompt.id,
      modificationsApplied: modifications.length,
      finalPromptLength: modifiedPrompt.text.length
    });
    
    return modifiedPrompt;
    
  } catch (error) {
    logError(error as Error, { 
      originalPromptId: originalPrompt.id,
      modificationsCount: modifications.length,
      modificationTypes: modifications.map(m => m.type)
    });
    
    throw error;
  }
};

// ============================================================================
// MODIFICATION VALIDATION
// ============================================================================

const validateModifications = async (
  modifications: ModificationRequest[],
  originalPrompt: Prompt
): Promise<void> => {
  // Check for empty modifications
  if (modifications.length === 0) {
    throw new ValidationError('No modifications provided');
  }
  
  // Check for too many modifications
  if (modifications.length > PROCESSING_PARAMS.MAX_MODIFICATIONS_PER_REQUEST) {
    throw new ValidationError(
      `Too many modifications: ${modifications.length}. Maximum allowed: ${PROCESSING_PARAMS.MAX_MODIFICATIONS_PER_REQUEST}`
    );
  }
  
  // Validate each modification
  for (const [index, modification] of modifications.entries()) {
    await validateIndividualModification(modification, originalPrompt, index);
  }
  
  // Check for conflicting modifications
  await detectConflictingModifications(modifications);
};

const validateIndividualModification = async (
  modification: ModificationRequest,
  originalPrompt: Prompt,
  index: number
): Promise<void> => {
  // Check required fields
  if (!modification.type) {
    throw new ValidationError(`Modification ${index}: missing type`);
  }
  
  // Validate modification type
  const validTypes = [
    'add_element',
    'remove_element', 
    'change_style',
    'adjust_lighting',
    'modify_character',
    'add_detail',
    'remove_detail',
    'change_mood',
    'adjust_composition',
    'custom'
  ];
  
  if (!validTypes.includes(modification.type)) {
    throw new ValidationError(
      `Modification ${index}: invalid type '${modification.type}'. Valid types: ${validTypes.join(', ')}`
    );
  }
  
  // Validate type-specific requirements
  switch (modification.type) {
    case 'add_element':
    case 'add_detail':
      if (!modification.value || modification.value.trim().length === 0) {
        throw new ValidationError(`Modification ${index}: '${modification.type}' requires a value`);
      }
      break;
      
    case 'remove_element':
    case 'remove_detail':
      if (!modification.target || modification.target.trim().length === 0) {
        throw new ValidationError(`Modification ${index}: '${modification.type}' requires a target`);
      }
      break;
      
    case 'change_style':
      if (!modification.value) {
        throw new ValidationError(`Modification ${index}: 'change_style' requires a style value`);
      }
      if (!STYLE_CONFIGURATIONS[modification.value as keyof typeof STYLE_CONFIGURATIONS]) {
        throw new ValidationError(
          `Modification ${index}: unknown style '${modification.value}'. ` +
          `Valid styles: ${Object.keys(STYLE_CONFIGURATIONS).join(', ')}`
        );
      }
      break;
      
    case 'custom':
      if (!modification.value || modification.value.trim().length === 0) {
        throw new ValidationError(`Modification ${index}: 'custom' requires a value`);
      }
      if (modification.value.length > 500) {
        throw new ValidationError(`Modification ${index}: custom modification too long (max 500 chars)`);
      }
      break;
  }
};

const detectConflictingModifications = async (modifications: ModificationRequest[]): Promise<void> => {
  const conflicts: string[] = [];
  
  // Check for style conflicts
  const styleChanges = modifications.filter(m => m.type === 'change_style');
  if (styleChanges.length > 1) {
    conflicts.push('Multiple style changes detected - only one style change is allowed per request');
  }
  
  // Check for add/remove conflicts on same element
  const addElements = modifications.filter(m => m.type === 'add_element');
  const removeElements = modifications.filter(m => m.type === 'remove_element');
  
  for (const addMod of addElements) {
    for (const removeMod of removeElements) {
      if (addMod.value && removeMod.target && 
          addMod.value.toLowerCase().includes(removeMod.target.toLowerCase())) {
        conflicts.push(`Conflicting modifications: adding '${addMod.value}' while removing '${removeMod.target}'`);
      }
    }
  }
  
  // Check for mood conflicts
  const moodChanges = modifications.filter(m => m.type === 'change_mood');
  if (moodChanges.length > 1) {
    const moods = moodChanges.map(m => m.value).join(', ');
    conflicts.push(`Multiple mood changes detected: ${moods} - only one mood change is allowed per request`);
  }
  
  if (conflicts.length > 0) {
    throw new ValidationError(`Conflicting modifications detected: ${conflicts.join('; ')}`);
  }
};

// ============================================================================
// INDIVIDUAL MODIFICATION APPLICATION
// ============================================================================

const applyIndividualModification = async (
  prompt: Prompt,
  modification: ModificationRequest
): Promise<Prompt> => {
  logInfo('Applying individual modification', { 
    type: modification.type,
    promptId: prompt.id,
    target: modification.target,
    value: modification.value
  });
  
  let modifiedPrompt = { ...prompt };
  
  switch (modification.type) {
    case 'add_element':
      modifiedPrompt = await addElementToPrompt(modifiedPrompt, modification);
      break;
      
    case 'remove_element':
      modifiedPrompt = await removeElementFromPrompt(modifiedPrompt, modification);
      break;
      
    case 'change_style':
      modifiedPrompt = await changePromptStyle(modifiedPrompt, modification);
      break;
      
    case 'adjust_lighting':
      modifiedPrompt = await adjustPromptLighting(modifiedPrompt, modification);
      break;
      
    case 'modify_character':
      modifiedPrompt = await modifyCharacterInPrompt(modifiedPrompt, modification);
      break;
      
    case 'add_detail':
      modifiedPrompt = await addDetailToPrompt(modifiedPrompt, modification);
      break;
      
    case 'remove_detail':
      modifiedPrompt = await removeDetailFromPrompt(modifiedPrompt, modification);
      break;
      
    case 'change_mood':
      modifiedPrompt = await changeMoodInPrompt(modifiedPrompt, modification);
      break;
      
    case 'adjust_composition':
      modifiedPrompt = await adjustCompositionInPrompt(modifiedPrompt, modification);
      break;
      
    case 'custom':
      modifiedPrompt = await applyCustomModification(modifiedPrompt, modification);
      break;
      
    default:
      throw new ProcessingError(`Unknown modification type: ${modification.type}`);
  }
  
  return modifiedPrompt;
};

// ============================================================================
// SPECIFIC MODIFICATION IMPLEMENTATIONS
// ============================================================================

const addElementToPrompt = async (
  prompt: Prompt,
  modification: ModificationRequest
): Promise<Prompt> => {
  const element = modification.value!.trim();
  
  // Check if element already exists
  if (prompt.text.toLowerCase().includes(element.toLowerCase())) {
    logInfo('Element already exists in prompt, skipping addition', { element });
    return prompt;
  }
  
  // Add element appropriately based on context
  let newText = prompt.text;
  
  if (prompt.text.endsWith('.') || prompt.text.endsWith(',')) {
    newText += ` ${element}`;
  } else {
    newText += `, ${element}`;
  }
  
  return {
    ...prompt,
    text: newText,
  };
};

const removeElementFromPrompt = async (
  prompt: Prompt,
  modification: ModificationRequest
): Promise<Prompt> => {
  const target = modification.target!.trim();
  let newText = prompt.text;
  
  // Remove exact matches and variations
  const patterns = [
    new RegExp(`\\b${target}\\b`, 'gi'),
    new RegExp(`\\b${target}\\w*\\b`, 'gi'), // Remove variations
    new RegExp(`\\w*${target}\\b`, 'gi'),   // Remove prefixed versions
  ];
  
  for (const pattern of patterns) {
    newText = newText.replace(pattern, '');
  }
  
  // Clean up punctuation and spacing
  newText = newText
    .replace(/,\s*,/g, ',') // Remove double commas
    .replace(/,\s*\./g, '.') // Remove comma before period
    .replace(/\s+/g, ' ')    // Normalize spaces
    .replace(/,\s*$/, '')    // Remove trailing comma
    .trim();
  
  return {
    ...prompt,
    text: newText,
  };
};

const changePromptStyle = async (
  prompt: Prompt,
  modification: ModificationRequest
): Promise<Prompt> => {
  const newStyle = modification.value!;
  const styleConfig = STYLE_CONFIGURATIONS[newStyle as keyof typeof STYLE_CONFIGURATIONS];
  
  if (!styleConfig) {
    throw new ProcessingError(`Unknown style: ${newStyle}`);
  }
  
  // Remove old style markers
  let newText = prompt.text;
  
  // Remove existing style keywords
  const styleKeywords = Object.values(STYLE_CONFIGURATIONS)
    .flatMap(config => config.basePrompt.split(', '));
  
  for (const keyword of styleKeywords) {
    const pattern = new RegExp(`\\b${keyword}\\b`, 'gi');
    newText = newText.replace(pattern, '');
  }
  
  // Add new style
  newText = `${styleConfig.basePrompt}, ${newText}`;
  
  // Clean up text
  newText = newText
    .replace(/,\s*,/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
  
  return {
    ...prompt,
    text: newText,
    style: newStyle,
  };
};

const adjustPromptLighting = async (
  prompt: Prompt,
  modification: ModificationRequest
): Promise<Prompt> => {
  const lightingValue = modification.value || 'natural lighting';
  
  // Remove existing lighting terms
  const lightingTerms = [
    'natural lighting', 'dramatic lighting', 'soft lighting', 'harsh lighting',
    'golden hour', 'blue hour', 'sunset', 'sunrise', 'midday', 'twilight',
    'artificial lighting', 'neon lighting', 'candlelight', 'moonlight', 'sunlight'
  ];
  
  let newText = prompt.text;
  for (const term of lightingTerms) {
    const pattern = new RegExp(`\\b${term}\\b`, 'gi');
    newText = newText.replace(pattern, '');
  }
  
  // Add new lighting
  newText += `, ${lightingValue}`;
  
  // Clean up
  newText = newText
    .replace(/,\s*,/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
  
  return {
    ...prompt,
    text: newText,
  };
};

const modifyCharacterInPrompt = async (
  prompt: Prompt,
  modification: ModificationRequest
): Promise<Prompt> => {
  // This is a simplified implementation
  // In production, this would use more sophisticated character detection and modification
  
  const characterModification = modification.value!;
  
  return {
    ...prompt,
    text: `${prompt.text}, ${characterModification}`,
  };
};

const addDetailToPrompt = async (
  prompt: Prompt,
  modification: ModificationRequest
): Promise<Prompt> => {
  const detail = modification.value!.trim();
  
  return {
    ...prompt,
    text: `${prompt.text}, ${detail}`,
  };
};

const removeDetailFromPrompt = async (
  prompt: Prompt,
  modification: ModificationRequest
): Promise<Prompt> => {
  // Similar to removeElementFromPrompt but more targeted
  return await removeElementFromPrompt(prompt, modification);
};

const changeMoodInPrompt = async (
  prompt: Prompt,
  modification: ModificationRequest
): Promise<Prompt> => {
  const newMood = modification.value!;
  
  // Remove existing mood terms
  const moodTerms = [
    'happy', 'sad', 'dark', 'bright', 'mysterious', 'cheerful',
    'somber', 'dramatic', 'peaceful', 'chaotic', 'serene', 'intense'
  ];
  
  let newText = prompt.text;
  for (const term of moodTerms) {
    const pattern = new RegExp(`\\b${term}\\b`, 'gi');
    newText = newText.replace(pattern, '');
  }
  
  // Add new mood
  newText += `, ${newMood} atmosphere`;
  
  // Clean up
  newText = newText
    .replace(/,\s*,/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
  
  return {
    ...prompt,
    text: newText,
  };
};

const adjustCompositionInPrompt = async (
  prompt: Prompt,
  modification: ModificationRequest
): Promise<Prompt> => {
  const composition = modification.value || 'centered composition';
  
  // Remove existing composition terms
  const compositionTerms = [
    'centered', 'off-center', 'rule of thirds', 'symmetrical', 'asymmetrical',
    'close-up', 'wide shot', 'medium shot', 'bird\'s eye view', 'worm\'s eye view'
  ];
  
  let newText = prompt.text;
  for (const term of compositionTerms) {
    const pattern = new RegExp(`\\b${term}\\b`, 'gi');
    newText = newText.replace(pattern, '');
  }
  
  // Add new composition
  newText += `, ${composition}`;
  
  // Clean up
  newText = newText
    .replace(/,\s*,/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
  
  return {
    ...prompt,
    text: newText,
  };
};

const applyCustomModification = async (
  prompt: Prompt,
  modification: ModificationRequest
): Promise<Prompt> => {
  const customText = modification.value!.trim();
  
  // Apply custom modification based on description
  if (modification.description?.includes('replace')) {
    // This is a replacement operation
    if (modification.target) {
      const newText = prompt.text.replace(
        new RegExp(modification.target, 'gi'),
        customText
      );
      return { ...prompt, text: newText };
    }
  }
  
  // Default: append the custom text
  return {
    ...prompt,
    text: `${prompt.text}, ${customText}`,
  };
};

// ============================================================================
// PROMPT VALIDATION
// ============================================================================

const validateModifiedPrompt = async (
  modifiedPrompt: Prompt,
  originalPrompt: Prompt
): Promise<{ isValid: boolean; issues: string[]; suggestions: string[] }> => {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check prompt length
  if (modifiedPrompt.text.length > PROCESSING_PARAMS.MAX_PROMPT_LENGTH) {
    issues.push(`Prompt too long: ${modifiedPrompt.text.length} chars (max: ${PROCESSING_PARAMS.MAX_PROMPT_LENGTH})`);
  }
  
  if (modifiedPrompt.text.length < 10) {
    issues.push('Prompt too short (minimum 10 characters)');
  }
  
  // Check for coherence
  const words = modifiedPrompt.text.split(/\s+/);
  if (words.length < 3) {
    issues.push('Prompt needs at least 3 words');
  }
  
  // Check for excessive repetition
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const repetitionRatio = uniqueWords.size / words.length;
  
  if (repetitionRatio < 0.5) {
    issues.push('Prompt has too much repetition');
    suggestions.push('Remove duplicate words and phrases');
  }
  
  // Check for problematic content
  const problematicWords = ['nsfw', 'explicit', 'inappropriate'];
  const hasProblematicContent = problematicWords.some(word => 
    modifiedPrompt.text.toLowerCase().includes(word)
  );
  
  if (hasProblematicContent) {
    issues.push('Prompt contains potentially inappropriate content');
  }
  
  // Check for style consistency
  if (modifiedPrompt.style && originalPrompt.style && modifiedPrompt.style !== originalPrompt.style) {
    suggestions.push('Style was changed - ensure consistency with other prompts in the scene');
  }
  
  // Suggest improvements
  if (modifiedPrompt.text.length > originalPrompt.text.length * 2) {
    suggestions.push('Consider simplifying the prompt to avoid overcomplexity');
  }
  
  if (!modifiedPrompt.text.includes(',')) {
    suggestions.push('Consider adding descriptive details separated by commas');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
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
    const input = validateApplyPromptModificationsInput(body);
    
    // Execute the core function
    const result = await applyPromptModifications(
      input.originalPrompt,
      input.modifications
    );
    
    // Return successful response
    const response: FunctionResponse<Prompt> = {
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
export { applyPromptModifications as coreFunction };