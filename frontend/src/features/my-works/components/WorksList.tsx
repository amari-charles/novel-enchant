import React, { useState, useEffect, useCallback } from 'react';
import type { Work, WorksQueryParams } from '../types';
import { WorkService } from '../services';
import { getErrorMessage } from '../services/api-client';

interface WorksListProps {
  onCreateWork: () => void;
  onEditWork: (workId: string) => void;
}

export const WorksList: React.FC<WorksListProps> = ({ onCreateWork, onEditWork }) => {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<WorksQueryParams>({});

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

  useEffect(() => {
    loadWorks();
  }, [loadWorks]);

  const handleFilterChange = (newFilters: Partial<WorksQueryParams>) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 }));
  };

  const handleLoadMore = () => {
    const offset = works.length;
    loadWorks({ offset }, true);
  };

  const handleDeleteWork = async (workId: string) => {
    if (!confirm('Are you sure you want to delete this work? This action cannot be undone.')) {
      return;
    }

    try {
      await WorkService.deleteWork(workId);
      setWorks(prev => prev.filter(work => work.id !== workId));
      setTotal(prev => prev - 1);
    } catch (err) {
      alert(`Failed to delete work: ${getErrorMessage(err)}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatWordCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toLocaleString();
  };

  if (loading && works.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" role="progressbar"></div>
          <p className="text-muted-foreground">Loading your works...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
        <h3 className="text-destructive font-semibold mb-2">Failed to load works</h3>
        <p className="text-destructive/80 mb-4">{error}</p>
        <button
          onClick={() => loadWorks()}
          className="bg-destructive text-destructive-foreground px-4 py-2 rounded hover:bg-destructive/90"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (works.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No works yet</h3>
        <p className="text-muted-foreground mb-6">Start your first creative project</p>
        <button
          onClick={onCreateWork}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 font-medium"
        >
          Create Your First Work
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleFilterChange({ status: undefined })}
            className={`px-4 py-2 rounded-lg ${
              !filters.status
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border'
            }`}
          >
            All ({total})
          </button>
          <button
            onClick={() => handleFilterChange({ status: 'draft' })}
            className={`px-4 py-2 rounded-lg ${
              filters.status === 'draft'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border'
            }`}
          >
            Draft
          </button>
          <button
            onClick={() => handleFilterChange({ status: 'published' })}
            className={`px-4 py-2 rounded-lg ${
              filters.status === 'published'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border'
            }`}
          >
            Published
          </button>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={filters.sort || 'updated_desc'}
            onChange={(e) => handleFilterChange({ sort: e.target.value })}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
            aria-label="Sort by"
          >
            <option value="updated_desc">Recently Updated</option>
            <option value="created_desc">Recently Created</option>
            <option value="title_asc">Title A-Z</option>
          </select>

          <button
            onClick={onCreateWork}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 font-medium"
          >
            New Work
          </button>
        </div>
      </div>

      {/* Works grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {works.map((work) => (
          <div
            key={work.id}
            className="bg-card rounded-lg shadow-sm border border-border hover:shadow-md transition-shadow"
          >
            {work.cover_image_url && (
              <img
                src={work.cover_image_url}
                alt={`Cover for ${work.title}`}
                className="w-full h-48 object-cover rounded-t-lg"
              />
            )}

            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-foreground text-lg line-clamp-2">
                  {work.title}
                </h3>
                <div className="flex items-center gap-2 ml-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      work.status === 'published'
                        ? 'bg-success/10 text-success'
                        : work.status === 'draft'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {work.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>

              {work.description && (
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {work.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span>
                  {work.chapter_count} chapters • {formatWordCount(work.word_count)} words
                </span>
                {work.publication_status === 'published' && work.read_count > 0 && (
                  <span>{work.read_count} reads</span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                <span>Updated {formatDate(work.updated_at)}</span>
                <span>{work.enhancement_count} enhancements</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEditWork(work.id)}
                  className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteWork(work.id)}
                  className="p-2 text-muted-foreground hover:text-destructive"
                  aria-label="Delete work"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg hover:bg-secondary/80 disabled:opacity-50 border border-border"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};