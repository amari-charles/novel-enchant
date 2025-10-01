/**
 * Hook to get the appropriate EnhancementService based on authentication status
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/auth-context';
import type { EnhancementService } from '../types';
import { EnhancementServiceFactory } from '../services/EnhancementServiceFactory';

export const useEnhancementService = (): EnhancementService | null => {
  const { user } = useAuth();
  const [service, setService] = useState<EnhancementService | null>(null);

  useEffect(() => {
    const initService = async () => {
      const isAuthenticated = !!user;
      const enhancementService = await EnhancementServiceFactory.getService(isAuthenticated);
      setService(enhancementService);
    };

    initService();
  }, [user]);

  return service;
};

/**
 * Hook to get enhancement service with custom configuration
 */
export const useCustomEnhancementService = (config?: {
  forceMode?: 'mock' | 'supabase';
  useRealImageGeneration?: boolean;
  enableModeration?: boolean;
}): EnhancementService | null => {
  const { user } = useAuth();
  const [service, setService] = useState<EnhancementService | null>(null);

  useEffect(() => {
    const initService = async () => {
      const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

      if (config?.forceMode === 'mock') {
        setService(EnhancementServiceFactory.createMockService());
        return;
      }

      if (config?.forceMode === 'supabase' && openaiApiKey && openaiApiKey !== 'your-openai-api-key-here') {
        const supabaseService = await EnhancementServiceFactory.createSupabaseService({
          apiKey: openaiApiKey,
          useRealImageGeneration: config.useRealImageGeneration ?? false,
          enableModeration: config.enableModeration ?? true
        });
        setService(supabaseService);
        return;
      }

      // Default behavior
      const isAuthenticated = !!user;
      const enhancementService = await EnhancementServiceFactory.getService(isAuthenticated);
      setService(enhancementService);
    };

    initService();
  }, [user, config]);

  return service;
};