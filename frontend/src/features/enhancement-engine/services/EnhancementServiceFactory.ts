/**
 * Factory for creating the appropriate EnhancementService implementation
 * Switches between MockEnhancementService and SupabaseEnhancementService based on authentication
 */

import type { EnhancementService } from '../types';
import { MockEnhancementService } from './MockEnhancementService';

export class EnhancementServiceFactory {
  private static mockService: MockEnhancementService | null = null;
  private static supabaseService: EnhancementService | null = null;

  /**
   * Get the appropriate service based on authentication status and environment variables
   */
  static async getService(isAuthenticated: boolean): Promise<EnhancementService> {
    const isDevelopment = import.meta.env.VITE_APP_ENV === 'development';
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Check if we have real Supabase credentials
    const hasRealSupabaseCredentials = supabaseUrl && supabaseKey &&
                                     supabaseUrl !== 'your-supabase-project-url' &&
                                     supabaseKey !== 'your-supabase-anon-key';

    // If user is authenticated and we have real credentials, use Supabase service (even in development)
    if (isAuthenticated && hasRealSupabaseCredentials &&
        openaiApiKey && openaiApiKey !== 'your-openai-api-key-here') {
      if (!this.supabaseService) {
        // Dynamically import to avoid issues when env vars aren't available
        const { SupabaseEnhancementService } = await import('./SupabaseEnhancementService');
        this.supabaseService = new SupabaseEnhancementService({
          apiKey: openaiApiKey,
          useRealImageGeneration: true, // Enable real OpenAI image generation
          enableModeration: true
        });
        console.log('Using SupabaseEnhancementService with real OpenAI integration');
      }
      return this.supabaseService;
    }

    // Fallback to mock service (for development without credentials or unauthenticated users)
    if (!this.mockService) {
      this.mockService = new MockEnhancementService();
      console.log(isDevelopment ?
        'Development mode: Using MockEnhancementService (no real credentials)' :
        'Using MockEnhancementService (unauthenticated)');
    }
    return this.mockService;
  }

  /**
   * Create a new Supabase service instance with custom configuration
   */
  static async createSupabaseService(config: {
    apiKey: string;
    useRealImageGeneration?: boolean;
    enableModeration?: boolean;
  }): Promise<EnhancementService> {
    const { SupabaseEnhancementService } = await import('./SupabaseEnhancementService');
    return new SupabaseEnhancementService(config);
  }

  /**
   * Create a new mock service instance
   */
  static createMockService(): MockEnhancementService {
    return new MockEnhancementService();
  }

  /**
   * Reset singleton instances (useful for testing)
   */
  static reset(): void {
    this.mockService = null;
    this.supabaseService = null;
  }
}