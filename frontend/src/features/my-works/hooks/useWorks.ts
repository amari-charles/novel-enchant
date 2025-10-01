import { useState, useEffect, useCallback } from 'react';
import type { Work, WorksQueryParams } from '../types';
import { WorkService } from '../services';
import { getErrorMessage } from '../services/api-client';

export interface UseWorksReturn {
  works: Work[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  updateFilters: (filters: Partial<WorksQueryParams>) => void;
  deleteWork: (workId: string) => Promise<void>;
}

export const useWorks = (initialFilters: WorksQueryParams = {}): UseWorksReturn => {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<WorksQueryParams>(initialFilters);

  const loadWorks = useCallback(async (params: WorksQueryParams = {}, append = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await WorkService.listWorks({ ...filters, ...params });

      if (append) {
        setWorks(prev => [...prev, ...response.works]);
      } else {
        setWorks(response.works);
      }

      setTotal(response.total);
      setHasMore(response.has_more);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const refetch = useCallback(() => {
    return loadWorks();
  }, [loadWorks]);

  const loadMore = useCallback(() => {
    const offset = works.length;
    return loadWorks({ offset }, true);
  }, [works.length, loadWorks]);

  const updateFilters = useCallback((newFilters: Partial<WorksQueryParams>) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 }));
  }, []);

  const deleteWork = useCallback(async (workId: string) => {
    try {
      await WorkService.deleteWork(workId);
      setWorks(prev => prev.filter(work => work.id !== workId));
      setTotal(prev => prev - 1);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    loadWorks();
  }, [loadWorks]);

  return {
    works,
    loading,
    error,
    hasMore,
    total,
    refetch,
    loadMore,
    updateFilters,
    deleteWork,
  };
};