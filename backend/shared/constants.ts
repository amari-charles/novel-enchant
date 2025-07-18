/**
 * Novel Enchant - Shared Constants
 * Configuration constants for all backend functions
 */

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
  OPENAI: 'https://api.openai.com/v1',
  REPLICATE: 'https://api.replicate.com/v1',
  STABILITY: 'https://api.stability.ai/v1',
} as const;

// ============================================================================
// AI MODEL CONFIGURATIONS
// ============================================================================

export const AI_MODELS = {
  OPENAI: {
    SCENE_EXTRACTION: 'gpt-4-turbo-preview',
    ENTITY_EXTRACTION: 'gpt-4-turbo-preview',
    QUALITY_ASSESSMENT: 'gpt-4-turbo-preview',
  },
  REPLICATE: {
    SDXL_BASE: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
    SDXL_REFINER: 'stability-ai/sdxl:2b017d9b67edd2ee1401238df49d75da53c523f36e363881e057f5dc3ed3c5b2',
  },
} as const;

// ============================================================================
// PROCESSING PARAMETERS
// ============================================================================

export const PROCESSING_PARAMS = {
  TEXT_CHUNKING: {
    DEFAULT_CHUNK_SIZE: 2000,
    MAX_CHUNK_SIZE: 4000,
    MIN_CHUNK_SIZE: 500,
    OVERLAP_SIZE: 200,
  },
  SCENE_EXTRACTION: {
    MAX_SCENES_PER_CHUNK: 5,
    MIN_VISUAL_SCORE: 0.6,
    MIN_IMPACT_SCORE: 0.4,
    MAX_RETRIES: 3,
  },
  ENTITY_RESOLUTION: {
    MIN_CONFIDENCE: 0.7,
    MAX_ALTERNATIVES: 3,
    SIMILARITY_THRESHOLD: 0.8,
  },
  IMAGE_GENERATION: {
    DEFAULT_WIDTH: 768,
    DEFAULT_HEIGHT: 1024,
    DEFAULT_STEPS: 25,
    DEFAULT_CFG_SCALE: 7.5,
    DEFAULT_SAMPLER: 'DPM++ 2M Karras',
    MAX_RETRIES: 3,
  },
  QUALITY_ASSESSMENT: {
    MIN_QUALITY_SCORE: 0.6,
    QUALITY_METRICS: ['prompt_adherence', 'technical_quality', 'aesthetic_score'],
  },
} as const;

// ============================================================================
// STYLE PRESETS
// ============================================================================

export const STYLE_CONFIGURATIONS = {
  fantasy: {
    basePrompt: 'fantasy art style, magical atmosphere, ethereal lighting',
    negativePrompt: 'modern, contemporary, realistic photography',
    technicalParams: {
      cfgScale: 8.0,
      steps: 30,
    },
  },
  scifi: {
    basePrompt: 'science fiction, futuristic, high-tech, cyberpunk aesthetic',
    negativePrompt: 'medieval, fantasy, magic, primitive',
    technicalParams: {
      cfgScale: 7.5,
      steps: 25,
    },
  },
  romance: {
    basePrompt: 'romantic, soft lighting, warm colors, intimate atmosphere',
    negativePrompt: 'dark, violent, harsh lighting, cold colors',
    technicalParams: {
      cfgScale: 7.0,
      steps: 28,
    },
  },
  thriller: {
    basePrompt: 'dramatic, suspenseful, high contrast, moody lighting',
    negativePrompt: 'bright, cheerful, lighthearted, comedy',
    technicalParams: {
      cfgScale: 8.5,
      steps: 30,
    },
  },
  historical: {
    basePrompt: 'historical accuracy, period-appropriate clothing and settings',
    negativePrompt: 'modern, contemporary, anachronistic elements',
    technicalParams: {
      cfgScale: 7.5,
      steps: 25,
    },
  },
  contemporary: {
    basePrompt: 'modern, realistic, natural lighting, contemporary setting',
    negativePrompt: 'fantasy, historical, unrealistic, stylized',
    technicalParams: {
      cfgScale: 7.0,
      steps: 25,
    },
  },
  anime: {
    basePrompt: 'anime art style, manga influence, stylized characters',
    negativePrompt: 'realistic, photographic, western art style',
    technicalParams: {
      cfgScale: 8.0,
      steps: 28,
    },
  },
  realistic: {
    basePrompt: 'photorealistic, natural lighting, high detail, documentary style',
    negativePrompt: 'cartoon, anime, stylized, unrealistic',
    technicalParams: {
      cfgScale: 6.5,
      steps: 30,
    },
  },
  painterly: {
    basePrompt: 'oil painting style, brushstrokes visible, artistic interpretation',
    negativePrompt: 'photographic, digital art, sharp details',
    technicalParams: {
      cfgScale: 7.5,
      steps: 35,
    },
  },
  cinematic: {
    basePrompt: 'cinematic composition, dramatic lighting, film-like quality',
    negativePrompt: 'amateur, snapshot, poor composition',
    technicalParams: {
      cfgScale: 8.0,
      steps: 30,
    },
  },
} as const;

// ============================================================================
// ERROR CODES
// ============================================================================

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PROCESSING_ERROR: 'PROCESSING_ERROR',
  AI_API_ERROR: 'AI_API_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
} as const;

// ============================================================================
// FILE HANDLING
// ============================================================================

export const FILE_LIMITS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  SUPPORTED_TEXT_FORMATS: ['.txt', '.pdf', '.docx', '.epub'],
  SUPPORTED_IMAGE_FORMATS: ['.jpg', '.jpeg', '.png', '.webp'],
  MAX_TEXT_LENGTH: 1000000, // 1M characters
} as const;

// ============================================================================
// RATE LIMITING
// ============================================================================

export const RATE_LIMITS = {
  OPENAI_REQUESTS_PER_MINUTE: 60,
  REPLICATE_REQUESTS_PER_MINUTE: 30,
  STORAGE_UPLOADS_PER_HOUR: 100,
  PROCESSING_JOBS_PER_USER_PER_HOUR: 50,
} as const;

// ============================================================================
// RETRY CONFIGURATIONS
// ============================================================================

export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000, // 1 second
  BACKOFF_MULTIPLIER: 2,
  MAX_DELAY: 10000, // 10 seconds
} as const;

// ============================================================================
// LOGGING LEVELS
// ============================================================================

export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
} as const;

// ============================================================================
// WEBHOOK EVENTS
// ============================================================================

export const WEBHOOK_EVENTS = {
  STORY_PROCESSING_STARTED: 'story.processing.started',
  STORY_PROCESSING_COMPLETED: 'story.processing.completed',
  STORY_PROCESSING_FAILED: 'story.processing.failed',
  SCENE_EXTRACTED: 'scene.extracted',
  ENTITY_IDENTIFIED: 'entity.identified',
  IMAGE_GENERATED: 'image.generated',
  IMAGE_GENERATION_FAILED: 'image.generation.failed',
  QUALITY_ASSESSMENT_COMPLETED: 'quality.assessment.completed',
} as const;

// ============================================================================
// SUPABASE CONFIGURATIONS
// ============================================================================

export const SUPABASE_CONFIG = {
  STORAGE_BUCKETS: {
    GENERATED_IMAGES: 'generated-images',
    REFERENCE_IMAGES: 'reference-images',
    STORY_UPLOADS: 'story-uploads',
    THUMBNAILS: 'thumbnails',
  },
  TABLE_NAMES: {
    STORIES: 'stories',
    CHAPTERS: 'chapters',
    SCENES: 'scenes',
    ENTITIES: 'story_entities',
    ENTITY_EVOLUTION: 'entity_evolution',
    SCENE_IMAGES: 'scene_images',
    PROCESSING_JOBS: 'processing_jobs',
  },
} as const;

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

export const ENV_VARS = {
  OPENAI_API_KEY: 'OPENAI_API_KEY',
  REPLICATE_API_TOKEN: 'REPLICATE_API_TOKEN',
  SUPABASE_URL: 'SUPABASE_URL',
  SUPABASE_SERVICE_ROLE_KEY: 'SUPABASE_SERVICE_ROLE_KEY',
  SUPABASE_ANON_KEY: 'SUPABASE_ANON_KEY',
} as const;