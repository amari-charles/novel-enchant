/**
 * Story Card Component
 * Unified display for stories with status indicators and actions
 */

import React, { useState } from 'react';

interface Story {
  id: string;
  title: string;
  description?: string | null;
  tags?: string[];
  status: 'draft' | 'partial' | 'complete';
  created_at: string;
  updated_at: string;
  preview_image?: string;
}

interface StoryStats {
  totalChapters: number;
  enhancedChapters: number;
  totalScenes: number;
  acceptedScenes: number;
}

interface StatusBadge {
  color: string;
  label: string;
}

interface StoryCardProps {
  story: Story;
  displayMode: 'grid' | 'list';
  stats: StoryStats;
  statusBadge: StatusBadge;
  onEdit: () => void;
  onRead: (chapterIndex?: number) => void;
  onDelete: () => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  displayMode,
  stats,
  statusBadge,
  onEdit,
  onRead,
  onDelete
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgressPercentage = () => {
    if (stats.totalChapters === 0) return 0;
    return Math.round((stats.enhancedChapters / stats.totalChapters) * 100);
  };

  const getProgressText = () => {
    return `${stats.totalChapters} chapter${stats.totalChapters !== 1 ? 's' : ''}`;
  };

  if (displayMode === 'list') {
    const previewImage = story.preview_image;

    return (
      <div
        onClick={onEdit}
        className="group p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        style={{
          backgroundColor: 'var(--card)',
          color: 'var(--card-foreground)',
          border: '1px solid var(--border)',
          borderRadius: '12px'
        }}
      >
        <div className="flex items-center gap-4">
          {/* Story Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground mb-2">
              {story.title}
            </h3>

            <div className="text-sm text-muted-foreground mb-2">
              <span>{getProgressText()}</span>
            </div>

            {story.status !== 'draft' && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                {statusBadge.label}
              </span>
            )}
          </div>

          {/* Right side: Image + Menu */}
          <div className="flex items-center gap-3">
            {previewImage && (
              <img
                src={previewImage}
                alt={story.title}
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
              />
            )}

            <div className="relative flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(!showDropdown);
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="More options"
              >
                <svg className="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>

              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDropdown(false);
                    }}
                  />
                  <div
                    className="absolute right-0 top-10 rounded-lg shadow-lg py-2 min-w-[120px] z-20"
                    style={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      Delete Story
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      onClick={onEdit}
      className="group bg-card rounded-lg border border-border hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
    >
      {/* Preview Image */}
      <div className="aspect-[16/9] bg-gradient-to-r from-primary/10 to-secondary/10 relative">
        {story.preview_image ? (
          <img
            src={story.preview_image}
            alt={`Preview of ${story.title}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}

        {/* Status Badge Overlay */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
            {statusBadge.label}
          </span>
        </div>

        {/* Actions Overlay */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              className="bg-black/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/30 transition-colors"
              aria-label="More options"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01" />
              </svg>
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-10 bg-card border border-border rounded-lg shadow-lg py-2 min-w-[120px] z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  Delete Story
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="mb-3">
          <h3 className="font-semibold text-lg text-foreground mb-2 line-clamp-2">
            {story.title}
          </h3>
          {story.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {story.description}
            </p>
          )}
        </div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {getProgressText()}
          </p>
        </div>

        {/* Tags */}
        {story.tags && story.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {story.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {story.tags.length > 2 && (
              <span className="text-xs text-muted-foreground self-center">
                +{story.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryCard;