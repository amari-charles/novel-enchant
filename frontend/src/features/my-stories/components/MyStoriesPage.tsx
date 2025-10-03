/**
 * My Stories Page
 * Unified view for all user stories (merges Shelf + My Works functionality)
 * Shows both authored drafts and enhanced stories with status indicators
 */

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { StoryCard } from './StoryCard';
import { ChapterListPage } from './ChapterListPage';
import { ReadingView } from './ReadingView';
import { StoryRepository } from '@/services/enhancement/repositories/StoryRepository';
import { ChapterRepository } from '@/services/enhancement/repositories/ChapterRepository';
import { AnchorRepository } from '@/services/enhancement/repositories/AnchorRepository';
import { EnhancementRepository } from '@/services/enhancement/repositories/EnhancementRepository';
import type { Story as DBStory } from '@/services/enhancement/repositories/IStoryRepository';
import type { Chapter as DBChapter } from '@/services/enhancement/repositories/IChapterRepository';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List, Plus } from 'lucide-react';

// UI types (extends DB types)
interface StoryStats {
  totalChapters: number;
  enhancedChapters: number;
  totalScenes: number;
  acceptedScenes: number;
}

interface Story extends Omit<DBStory, 'style_preferences'> {
  status: 'draft' | 'partial' | 'complete';
  chapters: Chapter[];
  tags?: string[];
  preview_image?: string;
  scene_count?: number;
  stats: StoryStats;
}

interface Chapter extends DBChapter {
  enhanced?: boolean;
}

type Route =
  | { type: 'stories' }
  | { type: 'story-editor'; storyId: string }
  | { type: 'chapter-editor'; storyId: string; chapterId: string }
  | { type: 'story-reading'; storyId: string; chapterIndex?: number }

interface MyStoriesPageProps {
  onNavigateToUpload?: () => void;
  onNavigate?: (route: Route | { type: string; storyId?: string; chapterId?: string }) => void;
  currentRoute?: Route;
}

export const MyStoriesPage: React.FC<MyStoriesPageProps> = ({
  onNavigateToUpload,
  onNavigate,
  currentRoute
}) => {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'partial' | 'complete'>('all');

  const loadStories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Instantiate repositories
      const storyRepository = new StoryRepository();
      const chapterRepository = new ChapterRepository();
      const anchorRepository = new AnchorRepository();
      const enhancementRepository = new EnhancementRepository();

      // Load all user stories
      const dbStories = await storyRepository.getByUserId(user.id);

      // Load chapters for each story and calculate status
      const transformedStories: Story[] = await Promise.all(
        dbStories.map(async (dbStory) => {
          const dbChapters = await chapterRepository.getByStoryId(dbStory.id);

          // Check enhancements for each chapter and count stats
          let totalAnchors = 0;
          let completedEnhancements = 0;

          const chaptersWithEnhancementStatus = await Promise.all(
            dbChapters.map(async (ch) => {
              const enhancements = await enhancementRepository.getByChapterId(ch.id);
              const anchors = await anchorRepository.getByChapterId(ch.id);

              const completed = enhancements.filter(e => e.status === 'completed');
              const hasCompletedEnhancements = completed.length > 0;

              totalAnchors += anchors.length;
              completedEnhancements += completed.length;

              return {
                ...ch,
                enhanced: hasCompletedEnhancements
              };
            })
          );

          // Calculate status based on enhanced chapters
          const enhancedChapters = chaptersWithEnhancementStatus.filter(ch => ch.enhanced);
          let status: 'draft' | 'partial' | 'complete' = 'draft';
          if (enhancedChapters.length > 0) {
            status = enhancedChapters.length === chaptersWithEnhancementStatus.length ? 'complete' : 'partial';
          }

          return {
            ...dbStory,
            status,
            chapters: chaptersWithEnhancementStatus,
            tags: [],
            scene_count: totalAnchors,
            stats: {
              totalChapters: chaptersWithEnhancementStatus.length,
              enhancedChapters: enhancedChapters.length,
              totalScenes: totalAnchors,
              acceptedScenes: completedEnhancements
            }
          } as Story;
        })
      );

      setStories(transformedStories);
    } catch (error) {
      console.error('Failed to load stories:', error);
      setError(error instanceof Error ? error.message : 'Failed to load stories');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadStories();
    } else {
      setIsLoading(false);
      setError('Please log in to view your stories');
    }
  }, [user, loadStories]);

  const handleEditStory = (storyId: string) => {
    if (onNavigate) {
      onNavigate({ type: 'story-editor', storyId });
    }
  };

  const handleReadStory = (story: Story, chapterIndex: number = 0) => {
    if (onNavigate) {
      onNavigate({ type: 'story-reading', storyId: story.id, chapterIndex });
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', storyId);

      if (error) {
        throw new Error(`Failed to delete story: ${error.message}`);
      }

      setStories(prev => prev.filter(story => story.id !== storyId));
    } catch (error) {
      console.error('Failed to delete story:', error);
      setError('Failed to delete story');
    }
  };

  const handleBackToList = () => {
    if (onNavigate) {
      onNavigate({ type: 'stories' });
    }
    // Reload stories to get latest data
    loadStories();
  };

  const filteredStories = stories.filter(story => {
    if (filterStatus === 'all') return true;
    return story.status === filterStatus;
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', label: 'Draft' },
      partial: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', label: 'Partially Enhanced' },
      complete: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', label: 'Fully Enhanced' }
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  // Render sub-views based on currentRoute
  if (currentRoute?.type === 'story-editor') {
    return (
      <ChapterListPage
        storyId={currentRoute.storyId}
        onBack={handleBackToList}
        onNavigateToChapter={(chapterId) => {
          if (onNavigate) {
            onNavigate({ type: 'chapter-editor', storyId: currentRoute.storyId, chapterId });
          }
        }}
      />
    );
  }

  if (currentRoute?.type === 'chapter-editor') {
    return (
      <ChapterListPage
        storyId={currentRoute.storyId}
        chapterId={currentRoute.chapterId}
        onBack={() => {
          if (onNavigate) {
            onNavigate({ type: 'story-editor', storyId: currentRoute.storyId });
          }
        }}
        onNavigateToChapter={(chapterId) => {
          if (onNavigate) {
            onNavigate({ type: 'chapter-editor', storyId: currentRoute.storyId, chapterId });
          }
        }}
      />
    );
  }

  if (currentRoute?.type === 'story-reading') {
    const story = stories.find(s => s.id === currentRoute.storyId);
    if (story) {
      return (
        <ReadingView
          story={story as any}
          onBack={handleBackToList}
        />
      );
    }
  }

  // Main stories list view
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Stories</h1>
            <p className="text-muted-foreground mt-1">Your complete story collection</p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Upload New Story Button */}
            <Button
              variant="secondary"
              onClick={() => {
                if (onNavigateToUpload) {
                  onNavigateToUpload();
                } else if (onNavigate) {
                  onNavigate({ type: 'upload' });
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload New Story
            </Button>

            {/* Filter */}
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'all' | 'draft' | 'partial' | 'complete')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter stories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stories</SelectItem>
                <SelectItem value="draft">Drafts</SelectItem>
                <SelectItem value="partial">Partially Enhanced</SelectItem>
                <SelectItem value="complete">Fully Enhanced</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <ToggleGroup type="single" value={displayMode} onValueChange={(value) => value && setDisplayMode(value as 'grid' | 'list')}>
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-destructive mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-destructive">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredStories.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {filterStatus === 'all' ? 'No stories yet' : `No ${filterStatus} stories`}
            </h3>
            <p className="text-muted-foreground mb-6">
              {filterStatus === 'all'
                ? 'Upload your first story to get started with AI-enhanced scenes and images!'
                : `Try changing the filter or upload a new story.`
              }
            </p>
            {filterStatus === 'all' && (
              <button
                onClick={() => {
                  if (onNavigateToUpload) {
                    onNavigateToUpload();
                  } else if (onNavigate) {
                    onNavigate({ type: 'upload' });
                  }
                }}
                className="btn-primary"
              >
                Upload Your First Story
              </button>
            )}
          </div>
        )}

        {/* Stories Grid/List */}
        {filteredStories.length > 0 && (
          <div className={displayMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                displayMode={displayMode}
                stats={story.stats}
                statusBadge={getStatusBadge(story.status)}
                onEdit={() => handleEditStory(story.id)}
                onRead={(chapterIndex) => handleReadStory(story, chapterIndex)}
                onDelete={() => handleDeleteStory(story.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyStoriesPage;