/**
 * Validation - Input validation schemas and utilities
 */

import { 
  ValidationError, 
  validateRequired, 
  validateType, 
  validateUUID, 
  validateEnum, 
  validateStringLength, 
  validateNumberRange 
} from '../../../shared/errors.ts';
import { 
  STYLE_PRESETS, 
  FILE_LIMITS, 
  PROCESSING_PARAMS 
} from '../../../shared/constants.ts';
import {
  ParseUploadedTextInput,
  ChunkTextIntoSectionsInput,
  ExtractVisualScenesInput,
  IdentifySceneMentionsInput,
  ResolveMentionsToEntitiesInput,
  ExtractNewEntitiesFromSceneInput,
  MergeEntitiesInput,
  TrackEntityEvolutionInput,
  GenerateReferenceImageInput,
  GenerateRefImageFromUploadInput,
  ConstructImagePromptInput,
  GenerateImageFromPromptInput,
  AssessImageQualityInput,
  ApplyPromptModificationsInput,
  EditEntityDescriptionInput,
  StylePreset,
} from '../../../shared/types.ts';

// ============================================================================
// CORE FUNCTION VALIDATORS
// ============================================================================

export const validateParseUploadedTextInput = (input: any): ParseUploadedTextInput => {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Input must be an object');
  }
  
  validateRequired(input.file, 'file');
  
  // Validate file type
  if (!(input.file instanceof File)) {
    throw new ValidationError('file must be a File object');
  }
  
  // Validate file size
  if (input.file.size > FILE_LIMITS.MAX_FILE_SIZE) {
    throw new ValidationError(
      `File size exceeds maximum limit of ${FILE_LIMITS.MAX_FILE_SIZE} bytes`
    );
  }
  
  // Validate file extension
  const extension = input.file.name.split('.').pop()?.toLowerCase();
  if (!extension || !FILE_LIMITS.SUPPORTED_TEXT_FORMATS.includes(`.${extension}`)) {
    throw new ValidationError(
      `Unsupported file format. Supported formats: ${FILE_LIMITS.SUPPORTED_TEXT_FORMATS.join(', ')}`
    );
  }
  
  return { file: input.file };
};

export const validateChunkTextIntoSectionsInput = (input: any): ChunkTextIntoSectionsInput => {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Input must be an object');
  }
  
  validateRequired(input.text, 'text');
  validateType(input.text, 'string', 'text');
  validateStringLength(input.text, 10, FILE_LIMITS.MAX_TEXT_LENGTH, 'text');
  
  const validated: ChunkTextIntoSectionsInput = { text: input.text };
  
  if (input.chunkStrategy) {
    validateEnum(input.chunkStrategy, ['paragraph', 'semantic', 'fixed'], 'chunkStrategy');
    validated.chunkStrategy = input.chunkStrategy;
  }
  
  if (input.maxChunkSize) {
    validateType(input.maxChunkSize, 'number', 'maxChunkSize');
    validateNumberRange(
      input.maxChunkSize,
      PROCESSING_PARAMS.TEXT_CHUNKING.MIN_CHUNK_SIZE,
      PROCESSING_PARAMS.TEXT_CHUNKING.MAX_CHUNK_SIZE,
      'maxChunkSize'
    );
    validated.maxChunkSize = input.maxChunkSize;
  }
  
  return validated;
};

export const validateExtractVisualScenesInput = (input: any): ExtractVisualScenesInput => {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Input must be an object');
  }
  
  validateRequired(input.chunk, 'chunk');
  validateRequired(input.context, 'context');
  
  // Validate chunk object
  if (!input.chunk.id || !input.chunk.text) {
    throw new ValidationError('chunk must have id and text properties');
  }
  
  validateType(input.chunk.id, 'string', 'chunk.id');
  validateType(input.chunk.text, 'string', 'chunk.text');
  validateType(input.chunk.index, 'number', 'chunk.index');
  
  // Validate context object
  validateRequired(input.context.storyId, 'context.storyId');
  validateRequired(input.context.title, 'context.title');
  validateRequired(input.context.stylePreset, 'context.stylePreset');
  validateRequired(input.context.existingCharacters, 'context.existingCharacters');
  validateRequired(input.context.existingLocations, 'context.existingLocations');
  
  validateUUID(input.context.storyId, 'context.storyId');
  validateType(input.context.title, 'string', 'context.title');
  validateEnum(input.context.stylePreset, STYLE_PRESETS, 'context.stylePreset');
  
  if (!Array.isArray(input.context.existingCharacters)) {
    throw new ValidationError('context.existingCharacters must be an array');
  }
  
  if (!Array.isArray(input.context.existingLocations)) {
    throw new ValidationError('context.existingLocations must be an array');
  }
  
  return {
    chunk: input.chunk,
    context: input.context,
  };
};

export const validateIdentifySceneMentionsInput = (input: any): IdentifySceneMentionsInput => {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Input must be an object');
  }
  
  validateRequired(input.sceneText, 'sceneText');
  validateType(input.sceneText, 'string', 'sceneText');
  validateStringLength(input.sceneText, 1, 50000, 'sceneText');
  
  return { sceneText: input.sceneText };
};

export const validateResolveMentionsToEntitiesInput = (input: any): ResolveMentionsToEntitiesInput => {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Input must be an object');
  }
  
  validateRequired(input.mentions, 'mentions');
  validateRequired(input.knownEntities, 'knownEntities');
  
  if (!Array.isArray(input.mentions)) {
    throw new ValidationError('mentions must be an array');
  }
  
  if (!Array.isArray(input.knownEntities)) {
    throw new ValidationError('knownEntities must be an array');
  }
  
  // Validate mention objects
  for (const mention of input.mentions) {
    if (!mention.mentionText || !mention.sentence) {
      throw new ValidationError('Each mention must have mentionText and sentence properties');
    }
  }
  
  // Validate entity objects
  for (const entity of input.knownEntities) {
    if (!entity.id || !entity.name || !entity.type) {
      throw new ValidationError('Each entity must have id, name, and type properties');
    }
    validateUUID(entity.id, 'entity.id');
    validateEnum(entity.type, ['character', 'location'], 'entity.type');
  }
  
  return {
    mentions: input.mentions,
    knownEntities: input.knownEntities,
  };
};

export const validateExtractNewEntitiesFromSceneInput = (input: any): ExtractNewEntitiesFromSceneInput => {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Input must be an object');
  }
  
  validateRequired(input.sceneText, 'sceneText');
  validateRequired(input.resolvedLinks, 'resolvedLinks');
  
  validateType(input.sceneText, 'string', 'sceneText');
  
  if (!Array.isArray(input.resolvedLinks)) {
    throw new ValidationError('resolvedLinks must be an array');
  }
  
  return {
    sceneText: input.sceneText,
    resolvedLinks: input.resolvedLinks,
  };
};

export const validateMergeEntitiesInput = (input: any): MergeEntitiesInput => {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Input must be an object');
  }
  
  validateRequired(input.newEntities, 'newEntities');
  validateRequired(input.existingEntities, 'existingEntities');
  
  if (!Array.isArray(input.newEntities)) {
    throw new ValidationError('newEntities must be an array');
  }
  
  if (!Array.isArray(input.existingEntities)) {
    throw new ValidationError('existingEntities must be an array');
  }
  
  return {
    newEntities: input.newEntities,
    existingEntities: input.existingEntities,
  };
};

export const validateTrackEntityEvolutionInput = (input: any): TrackEntityEvolutionInput => {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Input must be an object');
  }
  
  validateRequired(input.entity, 'entity');
  validateRequired(input.newDescription, 'newDescription');
  
  if (!input.entity.id || !input.entity.name || !input.entity.type) {
    throw new ValidationError('entity must have id, name, and type properties');
  }
  
  validateUUID(input.entity.id, 'entity.id');
  validateType(input.newDescription, 'string', 'newDescription');
  validateStringLength(input.newDescription, 1, 5000, 'newDescription');
  
  const validated: TrackEntityEvolutionInput = {
    entity: input.entity,
    newDescription: input.newDescription,
  };
  
  if (input.chapterNumber) {
    validateType(input.chapterNumber, 'number', 'chapterNumber');
    validateNumberRange(input.chapterNumber, 1, 1000, 'chapterNumber');
    validated.chapterNumber = input.chapterNumber;
  }
  
  return validated;
};

export const validateGenerateReferenceImageInput = (input: any): GenerateReferenceImageInput => {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Input must be an object');
  }
  
  validateRequired(input.entity, 'entity');
  
  if (!input.entity.id || !input.entity.name || !input.entity.type || !input.entity.description) {
    throw new ValidationError('entity must have id, name, type, and description properties');
  }
  
  validateUUID(input.entity.id, 'entity.id');
  validateEnum(input.entity.type, ['character', 'location'], 'entity.type');
  
  const validated: GenerateReferenceImageInput = { entity: input.entity };
  
  if (input.stylePreset) {
    validateEnum(input.stylePreset, STYLE_PRESETS, 'stylePreset');
    validated.stylePreset = input.stylePreset;
  }
  
  return validated;
};

export const validateGenerateRefImageFromUploadInput = (input: any): GenerateRefImageFromUploadInput => {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Input must be an object');
  }
  
  validateRequired(input.image, 'image');
  
  if (!(input.image instanceof File)) {
    throw new ValidationError('image must be a File object');
  }
  
  // Validate file size
  if (input.image.size > FILE_LIMITS.MAX_FILE_SIZE) {
    throw new ValidationError(
      `Image size exceeds maximum limit of ${FILE_LIMITS.MAX_FILE_SIZE} bytes`
    );
  }
  
  // Validate file extension
  const extension = input.image.name.split('.').pop()?.toLowerCase();
  if (!extension || !FILE_LIMITS.SUPPORTED_IMAGE_FORMATS.includes(`.${extension}`)) {
    throw new ValidationError(
      `Unsupported image format. Supported formats: ${FILE_LIMITS.SUPPORTED_IMAGE_FORMATS.join(', ')}`
    );
  }
  
  const validated: GenerateRefImageFromUploadInput = { image: input.image };
  
  if (input.entityId) {
    validateUUID(input.entityId, 'entityId');
    validated.entityId = input.entityId;
  }
  
  return validated;
};

export const validateConstructImagePromptInput = (input: any): ConstructImagePromptInput => {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Input must be an object');
  }
  
  validateRequired(input.scene, 'scene');
  validateRequired(input.entityLinks, 'entityLinks');
  validateRequired(input.style, 'style');
  
  // Validate scene object
  if (!input.scene.id || !input.scene.text || !input.scene.description) {
    throw new ValidationError('scene must have id, text, and description properties');
  }
  
  validateUUID(input.scene.id, 'scene.id');
  validateEnum(input.style, STYLE_PRESETS, 'style');
  
  if (!Array.isArray(input.entityLinks)) {
    throw new ValidationError('entityLinks must be an array');
  }
  
  const validated: ConstructImagePromptInput = {
    scene: input.scene,
    entityLinks: input.entityLinks,
    style: input.style,
  };
  
  if (input.customStylePrompt) {
    validateType(input.customStylePrompt, 'string', 'customStylePrompt');
    validateStringLength(input.customStylePrompt, 1, 1000, 'customStylePrompt');
    validated.customStylePrompt = input.customStylePrompt;
  }
  
  if (input.artisticDirection) {
    validateType(input.artisticDirection, 'string', 'artisticDirection');
    validateStringLength(input.artisticDirection, 1, 500, 'artisticDirection');
    validated.artisticDirection = input.artisticDirection;
  }
  
  return validated;
};

export const validateGenerateImageFromPromptInput = (input: any): GenerateImageFromPromptInput => {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Input must be an object');
  }
  
  validateRequired(input.prompt, 'prompt');
  
  // Validate prompt object
  if (!input.prompt.id || !input.prompt.text || !input.prompt.technicalParams) {
    throw new ValidationError('prompt must have id, text, and technicalParams properties');
  }
  
  validateUUID(input.prompt.id, 'prompt.id');
  validateType(input.prompt.text, 'string', 'prompt.text');
  validateStringLength(input.prompt.text, 1, 5000, 'prompt.text');
  
  // Validate technical parameters
  const params = input.prompt.technicalParams;
  if (params.width) {
    validateNumberRange(params.width, 256, 2048, 'technicalParams.width');
  }
  if (params.height) {
    validateNumberRange(params.height, 256, 2048, 'technicalParams.height');
  }
  if (params.steps) {
    validateNumberRange(params.steps, 1, 100, 'technicalParams.steps');
  }
  if (params.cfgScale) {
    validateNumberRange(params.cfgScale, 1, 20, 'technicalParams.cfgScale');
  }
  
  const validated: GenerateImageFromPromptInput = { prompt: input.prompt };
  
  if (input.priority) {
    validateType(input.priority, 'number', 'priority');
    validateNumberRange(input.priority, 1, 10, 'priority');
    validated.priority = input.priority;
  }
  
  return validated;
};

export const validateAssessImageQualityInput = (input: any): AssessImageQualityInput => {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Input must be an object');
  }
  
  validateRequired(input.imageUrl, 'imageUrl');
  validateRequired(input.prompt, 'prompt');
  
  validateType(input.imageUrl, 'string', 'imageUrl');
  
  // Basic URL validation
  try {
    new URL(input.imageUrl);
  } catch {
    throw new ValidationError('imageUrl must be a valid URL');
  }
  
  // Validate prompt object
  if (!input.prompt.id || !input.prompt.text) {
    throw new ValidationError('prompt must have id and text properties');
  }
  
  const validated: AssessImageQualityInput = {
    imageUrl: input.imageUrl,
    prompt: input.prompt,
  };
  
  if (input.sceneContext) {
    validated.sceneContext = input.sceneContext;
  }
  
  return validated;
};

export const validateApplyPromptModificationsInput = (input: any): ApplyPromptModificationsInput => {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Input must be an object');
  }
  
  validateRequired(input.originalPrompt, 'originalPrompt');
  validateRequired(input.edits, 'edits');
  
  // Validate original prompt
  if (!input.originalPrompt.id || !input.originalPrompt.text) {
    throw new ValidationError('originalPrompt must have id and text properties');
  }
  
  validateUUID(input.originalPrompt.id, 'originalPrompt.id');
  
  // Validate edits object
  if (typeof input.edits !== 'object') {
    throw new ValidationError('edits must be an object');
  }
  
  return {
    originalPrompt: input.originalPrompt,
    edits: input.edits,
  };
};

export const validateEditEntityDescriptionInput = (input: any): EditEntityDescriptionInput => {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Input must be an object');
  }
  
  validateRequired(input.entityId, 'entityId');
  validateRequired(input.newDescription, 'newDescription');
  
  validateUUID(input.entityId, 'entityId');
  validateType(input.newDescription, 'string', 'newDescription');
  validateStringLength(input.newDescription, 1, 5000, 'newDescription');
  
  const validated: EditEntityDescriptionInput = {
    entityId: input.entityId,
    newDescription: input.newDescription,
  };
  
  if (input.preserveHistory !== undefined) {
    validateType(input.preserveHistory, 'boolean', 'preserveHistory');
    validated.preserveHistory = input.preserveHistory;
  }
  
  return validated;
};

// ============================================================================
// COMMON VALIDATION UTILITIES
// ============================================================================

export const validateRequestBody = async (request: Request): Promise<any> => {
  const contentType = request.headers.get('content-type');
  
  if (!contentType) {
    throw new ValidationError('Content-Type header is required');
  }
  
  if (contentType.includes('application/json')) {
    try {
      const body = await request.json();
      if (!body || typeof body !== 'object') {
        throw new ValidationError('Request body must be a valid JSON object');
      }
      return body;
    } catch (error) {
      throw new ValidationError('Invalid JSON in request body');
    }
  }
  
  if (contentType.includes('multipart/form-data')) {
    try {
      const formData = await request.formData();
      const body: any = {};
      
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          body[key] = value;
        } else {
          // Try to parse as JSON if it looks like JSON
          try {
            body[key] = JSON.parse(value as string);
          } catch {
            body[key] = value;
          }
        }
      }
      
      return body;
    } catch (error) {
      throw new ValidationError('Invalid form data in request body');
    }
  }
  
  throw new ValidationError('Unsupported Content-Type. Use application/json or multipart/form-data');
};

export const validateAuthToken = (request: Request): string => {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    throw new ValidationError('Authorization header is required');
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  if (!token) {
    throw new ValidationError('Bearer token is required');
  }
  
  return token;
};