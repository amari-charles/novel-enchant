/**
 * Chapter Card Component
 * Display for individual chapters in story editor
 */

import React, { useState, useEffect } from 'react';

interface Chapter {
  id: string;
  title?: string;
  content?: string;
  order_index: number;
  scenes?: Scene[];
  enhanced?: boolean;
}

interface Scene {
  id: string;
  excerpt: string;
  image_url?: string;
  status: 'pending' | 'generating' | 'generated' | 'accepted' | 'failed';
  accepted?: boolean;
  order_index?: number;
}

interface ChapterStats {
  totalScenes: number;
  acceptedScenes: number;
  isEnhanced: boolean;
}

interface ChapterCardProps {
  chapter: Chapter;
  stats: ChapterStats;
  onEdit: () => void;
  onEnhance: () => void;
  onDelete: () => void;
}

export const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  stats,
  onEdit,
  onEnhance,
  onDelete
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const isComplete = stats.isEnhanced && stats.totalScenes > 0 && stats.acceptedScenes === stats.totalScenes;

  // Initialize progress state - if already complete on mount, start hidden
  const [progressState, setProgressState] = useState<'showing' | 'celebrating' | 'hidden'>(() => {
    return isComplete ? 'hidden' : 'showing';
  });

  const [previousAcceptedScenes, setPreviousAcceptedScenes] = useState(stats.acceptedScenes);
  const previewImage = chapter.scenes?.find(s => s.image_url)?.image_url;

  // Handle completion animation - only trigger when completion happens during this session
  useEffect(() => {
    // Check if we just completed (acceptedScenes increased and now equals totalScenes)
    const justCompleted =
      stats.acceptedScenes > previousAcceptedScenes &&
      isComplete &&
      progressState === 'showing';

    if (justCompleted) {
      // Start celebrating
      setProgressState('celebrating');

      // After 2 seconds, hide the progress bar
      const timer = setTimeout(() => {
        setProgressState('hidden');
      }, 2000);

      return () => clearTimeout(timer);
    }

    // Update previous count
    setPreviousAcceptedScenes(stats.acceptedScenes);
  }, [stats.acceptedScenes, isComplete, previousAcceptedScenes, progressState]);

  return (
    <div
      onClick={onEdit}
      className="w-full p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      style={{
        backgroundColor: 'var(--card)',
        color: 'var(--card-foreground)',
        border: '1px solid var(--border)',
        borderRadius: '12px'
      }}
    >
      {/* Main container using flexbox */}
      <div className="flex items-center gap-4">

        {/* Left side: Title and stats - takes up remaining space */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground mb-1 truncate">
            {chapter.title || `Chapter ${chapter.order_index + 1}`}
          </h3>

          <div className="text-sm text-muted-foreground mb-2">
            <span>
              {stats.isEnhanced
                ? `${stats.totalScenes} scenes • ${stats.acceptedScenes} enhanced`
                : 'Not enhanced yet'
              }
            </span>
            {stats.isEnhanced && (
              <>
                <span className="mx-2">•</span>
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  Enhanced
                </span>
              </>
            )}
          </div>

          {/* Scene Enhancement Progress Bar */}
          {stats.isEnhanced && stats.totalScenes > 0 && progressState !== 'hidden' && (
            <div
              className={`transition-all duration-500 ${
                progressState === 'celebrating' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                {progressState === 'celebrating' ? (
                  <div className="flex items-center gap-1 text-green-600 font-medium animate-in fade-in zoom-in duration-300">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Complete!</span>
                  </div>
                ) : (
                  <>
                    <span>Scene Progress</span>
                    <span>{Math.round((stats.acceptedScenes / stats.totalScenes) * 100)}%</span>
                  </>
                )}
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(stats.acceptedScenes / stats.totalScenes) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right side: Image and menu button - stays together */}
        <div className="flex items-center gap-3">
          {/* Image preview */}
          {previewImage && (
            <img
              src={previewImage}
              alt={chapter.title || 'Scene preview'}
              className="w-20 h-20 rounded-md object-cover flex-shrink-0"
            />
          )}

          {/* Three-dots menu button */}
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
                <div className="absolute right-0 top-10 bg-card border border-border rounded-lg shadow-lg py-2 min-w-[160px] z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEnhance();
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                  >
                    {stats.isEnhanced ? 'Re-Enhance' : 'Auto-Enhance'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChapterCard;
