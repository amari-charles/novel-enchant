/**
 * Enhancement Progress Hook
 * Manages enhancement job state and polling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { EnhancementServiceFactory } from '@/features/enhancement-engine/services/EnhancementServiceFactory';
import type {
  EnhanceJob,
  CreateEnhancementRequest,
  UseEnhanceProgressState,
} from '@/features/reader-enhance/types';

interface UseEnhanceProgressOptions {
  pollInterval?: number;
  maxRetries?: number;
  onComplete?: (job: EnhanceJob) => void;
  onError?: (error: Error) => void;
}

export function useEnhanceProgress(options: UseEnhanceProgressOptions = {}) {
  const { user } = useAuth();
  const {
    pollInterval = 2000,
    maxRetries = 30,
    onComplete,
    onError,
  } = options;

  const [state, setState] = useState<UseEnhanceProgressState>({
    job: null,
    isLoading: false,
    error: null,
  });

  const pollTimeoutRef = useRef<NodeJS.Timeout | undefined>();
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | undefined>();

  /**
   * Start a new enhancement job
   */
  const startEnhancement = useCallback(async (request: CreateEnhancementRequest): Promise<string> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Create job
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Use real Supabase - auth.uid() will work with properly authenticated user
      const { data: jobData, error: jobError } = await supabase
        .from('enhance_jobs')
        .insert({
          user_id: user.id,
          source_type: request.source,
          title: request.title,
          text_content: request.text,
          file_url: request.fileId ? `uploads/${request.fileId}` : null,
          status: 'queued',
          progress: 0,
        })
        .select()
        .single();

      if (jobError) {
        throw new Error(`Failed to create job: ${jobError.message}`);
      }

      const job = jobData;

      const enhanceJob: EnhanceJob = {
        id: job.id,
        user_id: job.user_id,
        source_type: job.source_type,
        title: job.title,
        text_content: job.text_content,
        file_url: job.file_url,
        status: job.status,
        progress: job.progress,
        scenes: [],
        created_at: job.created_at,
        updated_at: job.updated_at,
      };

      setState(prev => ({
        ...prev,
        job: enhanceJob,
        isLoading: true,
      }));

      // Start processing pipeline
      await processEnhancementPipeline(job.id, request);
      startPolling(job.id);

      return job.id;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      setState(prev => ({
        ...prev,
        error: { code: 'START_ERROR', message: errorObj.message },
        isLoading: false,
      }));
      onError?.(errorObj);
      throw errorObj;
    }
  }, [user, onError]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Process the enhancement pipeline using the EnhancementService
   */
  const processEnhancementPipeline = async (jobId: string, request: CreateEnhancementRequest) => {
    try {
      // Get the appropriate enhancement service
      const enhancementService = await EnhancementServiceFactory.getService(!!user);

      setState(prev => prev.job ? {
        ...prev,
        job: { ...prev.job, status: 'running', progress: 20 }
      } : prev);

      // Use the autoEnhance service method instead of calling edge functions
      const response = await enhancementService.autoEnhance({
        chapterId: jobId, // Use jobId as chapterId for now
        text: request.text,
        existingCharacters: [], // No existing characters for new enhancement
        stylePreferences: {
          artStyle: 'realistic',
          mood: 'dramatic'
        }
      });

      setState(prev => prev.job ? {
        ...prev,
        job: { ...prev.job, progress: 80 }
      } : prev);

      // Convert anchors to scenes format for compatibility
      const scenes = await Promise.all(response.anchors.map(async (anchor, index) => {
        // Extract full scene content based on intelligent boundaries
        const extractSceneContent = (text: string, position: number, sceneIndex: number, totalScenes: number): string => {
          // Split text into paragraphs for better boundary detection
          const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

          if (paragraphs.length === 0) {
            return text; // Return full text if no paragraph breaks
          }

          // Calculate approximate scene boundaries
          const textLength = text.length;
          const averageSceneLength = textLength / totalScenes;
          const sceneStart = sceneIndex * averageSceneLength;
          const sceneEnd = (sceneIndex + 1) * averageSceneLength;

          // Find paragraphs that fall within or near this scene's boundaries
          let currentPos = 0;
          let startParagraph = 0;
          let endParagraph = paragraphs.length - 1;

          // Find starting paragraph
          for (let i = 0; i < paragraphs.length; i++) {
            const paragraphEnd = currentPos + paragraphs[i].length + 2; // +2 for \n\n
            if (paragraphEnd >= sceneStart) {
              startParagraph = Math.max(0, i - 1); // Include previous paragraph for context
              break;
            }
            currentPos = paragraphEnd;
          }

          // Find ending paragraph
          currentPos = 0;
          for (let i = 0; i < paragraphs.length; i++) {
            const paragraphEnd = currentPos + paragraphs[i].length + 2;
            if (paragraphEnd >= sceneEnd) {
              endParagraph = Math.min(paragraphs.length - 1, i + 1); // Include next paragraph for context
              break;
            }
            currentPos = paragraphEnd;
          }

          // Extract scene content with natural boundaries
          const sceneContent = paragraphs.slice(startParagraph, endParagraph + 1).join('\n\n');

          // Return full content - no arbitrary truncation
          return sceneContent.trim();
        };

        // Get image URL - either directly from anchor or fetch from database
        let imageUrl: string | undefined;
        if (anchor.imageUrl) {
          // For reader-enhance flow, use direct URL
          imageUrl = anchor.imageUrl;
        } else if (anchor.activeImageId) {
          // For regular chapters, fetch from database
          try {
            const { data: imageData, error: imageError } = await supabase
              .from('images')
              .select('url')
              .eq('id', anchor.activeImageId)
              .single();

            if (!imageError && imageData) {
              imageUrl = imageData.url;
            }
          } catch (error) {
            console.error('Failed to fetch image URL:', error);
          }
        }

        return {
          id: `scene_${anchor.id}`,
          chapter_id: jobId,
          excerpt: extractSceneContent(request.text, anchor.position, index, response.anchors.length),
          order_index: index,
          image_url: imageUrl,
          status: 'generated' as const
        };
      }));

      // Update job with scenes and mark as completed
      const { error: updateError } = await supabase
        .from('enhance_jobs')
        .update({
          result_json: {
            chapters: [{
              id: 'chapter_1',
              order_index: 0,
              scenes: scenes
            }]
          },
          status: 'completed',
          progress: 100,
          updated_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (updateError) {
        throw new Error(`Failed to update job: ${updateError.message}`);
      }

      setState(prev => prev.job ? {
        ...prev,
        job: { ...prev.job, progress: 100, status: 'completed' }
      } : prev);

    } catch (error) {
      console.error('Pipeline error:', error);
      throw error;
    }
  };

  /**
   * Start polling for job updates
   */
  const startPolling = useCallback((jobId: string) => {
    retryCountRef.current = 0;
    abortControllerRef.current = new AbortController();

    const poll = async () => {
      try {
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        // Use real Supabase - properly authenticated user will have access
        const { data: job, error } = await supabase
          .from('enhance_jobs')
          .select('*')
          .eq('id', jobId)
          .single();

        if (error) {
          throw new Error(`Failed to fetch job: ${error.message}`);
        }

        const enhanceJob: EnhanceJob = {
          id: job.id,
          user_id: job.user_id,
          source_type: job.source_type,
          title: job.title,
          text_content: job.text_content,
          file_url: job.file_url,
          status: job.status,
          progress: job.progress,
          scenes: job.result_json?.chapters?.flatMap((ch: { scenes: unknown[] }) => ch.scenes) || [],
          error_message: job.error_message,
          created_at: job.created_at,
          updated_at: job.updated_at,
        };

        setState(prev => ({
          ...prev,
          job: enhanceJob,
          isLoading: enhanceJob.status === 'running' || enhanceJob.status === 'queued',
          error: job.error_message ? {
            code: 'JOB_ERROR',
            message: job.error_message,
          } : null,
        }));

        // Handle completion
        if (enhanceJob.status === 'completed') {
          console.log('Job completed, calling onComplete callback:', enhanceJob);
          clearTimeout(pollTimeoutRef.current);
          onComplete?.(enhanceJob);
          return;
        }

        // Handle failure
        if (enhanceJob.status === 'failed') {
          clearTimeout(pollTimeoutRef.current);
          const error = new Error(job.error_message || 'Enhancement failed');
          onError?.(error);
          return;
        }

        // Continue polling for running jobs
        if (enhanceJob.status === 'running' || enhanceJob.status === 'queued') {
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current++;
            pollTimeoutRef.current = setTimeout(poll, pollInterval);
          } else {
            const error = new Error('Enhancement timed out');
            setState(prev => ({
              ...prev,
              error: { code: 'TIMEOUT', message: 'Enhancement timed out' },
              isLoading: false,
            }));
            onError?.(error);
          }
        }

      } catch (error) {
        console.error('Polling error:', error);
        if (retryCountRef.current < 5) {
          retryCountRef.current++;
          pollTimeoutRef.current = setTimeout(poll, pollInterval * 2);
        } else {
          const errorObj = error instanceof Error ? error : new Error('Polling failed');
          setState(prev => ({
            ...prev,
            error: { code: 'POLL_ERROR', message: errorObj.message },
            isLoading: false,
          }));
          onError?.(errorObj);
        }
      }
    };

    pollTimeoutRef.current = setTimeout(poll, pollInterval);
  }, [pollInterval, maxRetries, onComplete, onError]);

  /**
   * Accept an image for a scene
   */
  const acceptImage = useCallback(async (sceneId: string, takeId: string) => {
    if (!state.job) return;

    try {
      const response = await fetch('/api/enhance/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: state.job.id,
          sceneId,
          takeId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to accept image');
      }

      // Update local state
      setState(prev => {
        if (!prev.job) return prev;

        const updatedScenes = prev.job.scenes?.map(scene =>
          scene.id === sceneId
            ? { ...scene, status: 'accepted' as const }
            : scene
        );

        return {
          ...prev,
          job: {
            ...prev.job,
            scenes: updatedScenes,
          },
        };
      });

    } catch (error) {
      console.error('Accept image error:', error);
      const errorObj = error instanceof Error ? error : new Error('Failed to accept image');
      setState(prev => ({
        ...prev,
        error: { code: 'ACCEPT_ERROR', message: errorObj.message },
      }));
    }
  }, [state.job]);

  /**
   * Retry image generation for a scene
   */
  const retryImage = useCallback(async (sceneId: string) => {
    if (!state.job) return;

    try {
      const response = await fetch('/api/enhance/retry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: state.job.id,
          sceneId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to retry image');
      }

      // Update local state to show generating
      setState(prev => {
        if (!prev.job) return prev;

        const updatedScenes = prev.job.scenes?.map(scene =>
          scene.id === sceneId
            ? { ...scene, status: 'generating' as const }
            : scene
        );

        return {
          ...prev,
          job: {
            ...prev.job,
            scenes: updatedScenes,
          },
        };
      });

    } catch (error) {
      console.error('Retry image error:', error);
      const errorObj = error instanceof Error ? error : new Error('Failed to retry image');
      setState(prev => ({
        ...prev,
        error: { code: 'RETRY_ERROR', message: errorObj.message },
      }));
    }
  }, [state.job]);

  /**
   * Save enhanced copy to shelf
   */
  const saveToShelf = useCallback(async (title?: string, job?: EnhanceJob) => {
    const jobToUse = job || state.job;
    console.log('saveToShelf called with job:', jobToUse);

    if (!jobToUse) {
      console.log('No job found, returning early');
      return;
    }

    try {
      // Save to real Supabase database
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Build chapters with scenes from the job
      const chapters = jobToUse.scenes && jobToUse.scenes.length > 0
        ? [{
            id: 'chapter_1',
            title: 'Chapter 1',
            order_index: 0,
            scenes: jobToUse.scenes
          }]
        : [];

      const enhancedCopy = {
        user_id: user.id,
        title: title || jobToUse.title,
        source_type: jobToUse.source_type,
        chapters: chapters
      };

      console.log('Saving enhanced copy to shelf:', enhancedCopy);
      console.log('Number of scenes:', jobToUse.scenes?.length || 0);

      const { data, error } = await supabase
        .from('enhanced_copies')
        .insert(enhancedCopy)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save to shelf: ${error.message}`);
      }

      console.log('Enhanced copy saved successfully:', data);
      return data.id;

    } catch (error) {
      console.error('Save to shelf error:', error);
      const errorObj = error instanceof Error ? error : new Error('Failed to save to shelf');
      setState(prev => ({
        ...prev,
        error: { code: 'SAVE_ERROR', message: errorObj.message },
      }));
      throw errorObj;
    }
  }, [state.job, user]);

  /**
   * Load existing job by ID
   */
  const loadJob = useCallback(async (jobId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data: job, error } = await supabase
        .from('enhance_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        throw new Error(`Job not found: ${error.message}`);
      }

      const enhanceJob: EnhanceJob = {
        id: job.id,
        user_id: job.user_id,
        source_type: job.source_type,
        title: job.title,
        text_content: job.text_content,
        file_url: job.file_url,
        status: job.status,
        progress: job.progress,
        scenes: job.result_json?.chapters?.flatMap((ch: { scenes: unknown[] }) => ch.scenes) || [],
        error_message: job.error_message,
        created_at: job.created_at,
        updated_at: job.updated_at,
      };

      setState({
        job: enhanceJob,
        isLoading: job.status === 'running' || job.status === 'queued',
        error: null,
      });

      // Resume polling if still processing
      if (job.status === 'running' || job.status === 'queued') {
        startPolling(jobId);
      }

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Failed to load job');
      setState({
        job: null,
        isLoading: false,
        error: { code: 'LOAD_ERROR', message: errorObj.message },
      });
      onError?.(errorObj);
    }
  }, [startPolling, onError]);

  /**
   * Stop polling and cleanup
   */
  const stopPolling = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState(prev => ({ ...prev, isLoading: false }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    ...state,
    startEnhancement,
    acceptImage,
    retryImage,
    saveToShelf,
    loadJob,
    stopPolling,
  };
}