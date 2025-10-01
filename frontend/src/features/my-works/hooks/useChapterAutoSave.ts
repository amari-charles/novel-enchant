import { useState, useEffect, useRef, useCallback } from 'react';
import type { AutoSaveRequest, AutoSaveResponse } from '../types';
import { ChapterService } from '../services';

export interface UseChapterAutoSaveOptions {
  chapterId: string;
  enabled?: boolean;
  interval?: number; // milliseconds
  onConflict?: (serverVersion: AutoSaveResponse['server_version']) => void;
  onSaveSuccess?: (response: AutoSaveResponse) => void;
  onSaveError?: (error: Error) => void;
}

export interface UseChapterAutoSaveReturn {
  isSaving: boolean;
  lastSaved: string | null;
  hasConflict: boolean;
  triggerSave: () => void;
  clearConflict: () => void;
  scheduleAutoSave: (data: AutoSaveRequest) => void;
}

export const useChapterAutoSave = ({
  chapterId,
  enabled = true,
  interval = 5000,
  onConflict,
  onSaveSuccess,
  onSaveError,
}: UseChapterAutoSaveOptions): UseChapterAutoSaveReturn => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [hasConflict, setHasConflict] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const pendingDataRef = useRef<AutoSaveRequest | null>(null);
  const isActiveRef = useRef(true);

  const performSave = useCallback(async () => {
    if (!pendingDataRef.current || !enabled || !isActiveRef.current) {
      return;
    }

    try {
      setIsSaving(true);

      const response = await ChapterService.autoSave(chapterId, pendingDataRef.current);

      if (!isActiveRef.current) return;

      if (response.conflict && response.server_version) {
        setHasConflict(true);
        onConflict?.(response.server_version);
      } else {
        setLastSaved(response.saved_at);
        setHasConflict(false);
        onSaveSuccess?.(response);
      }

      pendingDataRef.current = null;
    } catch (error) {
      if (!isActiveRef.current) return;

      const err = error instanceof Error ? error : new Error('Auto-save failed');
      onSaveError?.(err);
    } finally {
      if (isActiveRef.current) {
        setIsSaving(false);
      }
    }
  }, [chapterId, enabled, onConflict, onSaveSuccess, onSaveError]);

  const scheduleAutoSave = useCallback((data: AutoSaveRequest) => {
    if (!enabled) return;

    pendingDataRef.current = data;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      performSave();
    }, interval);
  }, [enabled, interval, performSave]);

  const triggerSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    performSave();
  }, [performSave]);

  const clearConflict = useCallback(() => {
    setHasConflict(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isSaving,
    lastSaved,
    hasConflict,
    triggerSave,
    clearConflict,
    scheduleAutoSave,
  };
};