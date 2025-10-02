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
  onEdit: () => void;
  onDelete: () => void;
}

export const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  stats,
  onEdit,
  onDelete
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const previewImage = chapter.scenes?.find(s => s.image_url)?.image_url;

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

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {stats.isEnhanced
                ? `${stats.totalScenes} scenes • ${stats.acceptedScenes} enhanced`
                : 'Not enhanced yet'
              }
            </span>
            {stats.isEnhanced && (
              <>
                <span>•</span>
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  Enhanced
                </span>
              </>
            )}
          </div>
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
                <div className="absolute right-0 top-10 bg-card border-border rounded-lg shadow-lg py-2 min-w-[160px] z-20">
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
