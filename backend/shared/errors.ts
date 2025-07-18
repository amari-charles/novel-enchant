/**
 * Novel Enchant - Error Handling Utilities
 * Standardized error handling for all backend functions
 */

import { ERROR_CODES } from './constants.ts';
import { FunctionResponse } from './types.ts';

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

export class NovelEnchantError extends Error {
  public readonly code: string;
  public readonly details: Record<string, any>;
  public readonly timestamp: string;
  public readonly retryable: boolean;

  constructor(
    code: string,
    message: string,
    details: Record<string, any> = {},
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'NovelEnchantError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.retryable = retryable;
  }
}

export class ValidationError extends NovelEnchantError {
  constructor(message: string, fieldErrors: Record<string, string[]> = {}) {
    super(ERROR_CODES.VALIDATION_ERROR, message, { fieldErrors }, false);
    this.name = 'ValidationError';
  }
}

export class ProcessingError extends NovelEnchantError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(ERROR_CODES.PROCESSING_ERROR, message, details, true);
    this.name = 'ProcessingError';
  }
}

export class AIAPIError extends NovelEnchantError {
  constructor(message: string, apiResponse?: any, retryable: boolean = true) {
    super(ERROR_CODES.AI_API_ERROR, message, { apiResponse }, retryable);
    this.name = 'AIAPIError';
  }
}

export class StorageError extends NovelEnchantError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(ERROR_CODES.STORAGE_ERROR, message, details, true);
    this.name = 'StorageError';
  }
}

export class DatabaseError extends NovelEnchantError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(ERROR_CODES.DATABASE_ERROR, message, details, true);
    this.name = 'DatabaseError';
  }
}

export class AuthenticationError extends NovelEnchantError {
  constructor(message: string = 'Authentication failed') {
    super(ERROR_CODES.AUTHENTICATION_ERROR, message, {}, false);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends NovelEnchantError {
  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(ERROR_CODES.RATE_LIMIT_ERROR, message, { retryAfter }, true);
    this.name = 'RateLimitError';
  }
}

export class InsufficientCreditsError extends NovelEnchantError {
  constructor(required: number, available: number) {
    super(
      ERROR_CODES.INSUFFICIENT_CREDITS,
      `Insufficient credits. Required: ${required}, Available: ${available}`,
      { required, available },
      false
    );
    this.name = 'InsufficientCreditsError';
  }
}

export class TimeoutError extends NovelEnchantError {
  constructor(operation: string, timeoutMs: number) {
    super(
      ERROR_CODES.TIMEOUT_ERROR,
      `Operation '${operation}' timed out after ${timeoutMs}ms`,
      { operation, timeoutMs },
      true
    );
    this.name = 'TimeoutError';
  }
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

export const handleError = (error: unknown): FunctionResponse<null> => {
  // Log the error for debugging
  console.error('Function error:', error);

  if (error instanceof NovelEnchantError) {
    return {
      success: false,
      data: null,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      timestamp: error.timestamp,
    };
  }

  // Handle standard JavaScript errors
  if (error instanceof Error) {
    return {
      success: false,
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error.message,
        details: { stack: error.stack },
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Handle unknown error types
  return {
    success: false,
    data: null,
    error: {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      details: { originalError: error },
    },
    timestamp: new Date().toISOString(),
  };
};

export const wrapAsyncFunction = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<FunctionResponse<R>> => {
    try {
      const result = await fn(...args);
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return handleError(error);
    }
  };
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export const validateRequired = (value: any, fieldName: string): void => {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`, {
      [fieldName]: ['This field is required'],
    });
  }
};

export const validateType = (value: any, expectedType: string, fieldName: string): void => {
  if (typeof value !== expectedType) {
    throw new ValidationError(`${fieldName} must be of type ${expectedType}`, {
      [fieldName]: [`Expected ${expectedType}, got ${typeof value}`],
    });
  }
};

export const validateUUID = (value: string, fieldName: string): void => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new ValidationError(`${fieldName} must be a valid UUID`, {
      [fieldName]: ['Invalid UUID format'],
    });
  }
};

export const validateEnum = <T extends string>(
  value: string,
  enumValues: readonly T[],
  fieldName: string
): void => {
  if (!enumValues.includes(value as T)) {
    throw new ValidationError(`${fieldName} must be one of: ${enumValues.join(', ')}`, {
      [fieldName]: [`Invalid value. Allowed values: ${enumValues.join(', ')}`],
    });
  }
};

export const validateArrayNotEmpty = (value: any[], fieldName: string): void => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ValidationError(`${fieldName} must be a non-empty array`, {
      [fieldName]: ['Array cannot be empty'],
    });
  }
};

export const validateStringLength = (
  value: string,
  min: number,
  max: number,
  fieldName: string
): void => {
  if (value.length < min || value.length > max) {
    throw new ValidationError(
      `${fieldName} must be between ${min} and ${max} characters`,
      {
        [fieldName]: [`Length must be between ${min} and ${max} characters`],
      }
    );
  }
};

export const validateNumberRange = (
  value: number,
  min: number,
  max: number,
  fieldName: string
): void => {
  if (value < min || value > max) {
    throw new ValidationError(`${fieldName} must be between ${min} and ${max}`, {
      [fieldName]: [`Value must be between ${min} and ${max}`],
    });
  }
};

// ============================================================================
// RETRY LOGIC
// ============================================================================

export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  backoffMultiplier: number = 2,
  maxDelay: number = 10000
): Promise<T> => {
  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry non-retryable errors
      if (error instanceof NovelEnchantError && !error.retryable) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError!;
};

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

export const logError = (error: Error, context?: Record<string, any>): void => {
  console.error('Error occurred:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
};

export const logInfo = (message: string, data?: Record<string, any>): void => {
  console.log('Info:', {
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

export const logDebug = (message: string, data?: Record<string, any>): void => {
  console.debug('Debug:', {
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};