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
      className="w-full p-6 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      style={{ borderRadius: '12px' }}
    >
      {/* Main container using flexbox */}
      <div className="flex items-center gap-4">

        {/* Left side: Title and stats - takes up remaining space */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 truncate">
            {chapter.title || `Chapter ${chapter.order_index + 1}`}
          </h3>

          {isEnhancing ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Enhancing...</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>
                {stats.isEnhanced
                  ? `${stats.totalScenes} scenes • ${stats.acceptedScenes} enhanced`
                  : 'Not enhanced yet'
                }
              </span>
              {stats.isEnhanced && (
                <>
                  <span>•</span>
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                    Enhanced
                  </span>
                </>
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
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="More options"
              disabled={isEnhancing}
            >
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
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
                <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-[160px] z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEnhance();
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {stats.isEnhanced ? 'Re-enhance' : 'Auto-enhance'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
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
