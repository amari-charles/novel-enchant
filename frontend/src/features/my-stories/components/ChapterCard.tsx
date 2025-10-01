/**
 * Chapter Card Component
 * Display for individual chapters in story editor
 */

import React, { useState } from 'react';

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
  isEnhancing: boolean;
  progress: number;
  onEdit: () => void;
  onEnhance: () => void;
  onDelete: () => void;
}

export const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  stats,
  isEnhancing,
  progress,
  onEdit,
  onEnhance,
  onDelete
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const previewImage = chapter.scenes?.find(s => s.image_url)?.image_url;

  return (
    <div
      onClick={() => !isEnhancing && onEdit()}
      className="w-full p-6 border border-border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Main container using flexbox */}
      <div className="flex items-center gap-4">

        {/* Left side: Title and stats - takes up remaining space */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {chapter.title || `Chapter ${chapter.order_index + 1}`}
          </h3>

          {isEnhancing ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-primary font-medium">Enhancing...</span>
                <span className="text-xs text-muted-foreground">{progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                {stats.isEnhanced
                  ? `${stats.totalScenes} scenes • ${stats.acceptedScenes} enhanced`
                  : 'Not enhanced yet'
                }
              </span>
              {stats.isEnhanced && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  Enhanced
                </span>
              )}
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
              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
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
              disabled={isEnhancing}
            >
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01" />
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
                    className="w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors"
                  >
                    {stats.isEnhanced ? 'Re-enhance' : 'Auto-enhance'}
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
