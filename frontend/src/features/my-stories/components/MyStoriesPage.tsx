/**
 * My Stories Page
 * Unified view for all user stories (merges Shelf + My Works functionality)
 * Shows both authored drafts and enhanced stories with status indicators
 */

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { StoryCard } from './StoryCard';
import { StoryEditorPage } from './StoryEditorPage';
import { ReadingView } from './ReadingView';

// Story types from both old systems
interface Story {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  tags?: string[];
  status: 'draft' | 'partial' | 'complete';
  chapters: Chapter[];
  created_at: string;
  updated_at: string;
  preview_image?: string;
  scene_count?: number;
}

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

type Route =
  | { type: 'stories' }
  | { type: 'story-editor'; storyId: string; chapterId?: string }
  | { type: 'story-reading'; storyId: string; chapterIndex?: number }

interface MyStoriesPageProps {
  onNavigateToUpload?: () => void;
  onNavigate?: (route: Route | { type: string; storyId?: string; chapterId?: string }) => void;
  currentRoute?: Route;
}

type View = 'list' | 'story-editor' | 'reading';

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

      // Load from both enhanced_copies (shelf) and works tables
      // For now, we'll use enhanced_copies as the unified table
      const { data: enhancedCopies, error: queryError } = await supabase
        .from('enhanced_copies')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (queryError) {
        throw new Error(`Failed to load stories: ${queryError.message}`);
      }

      // Transform and determine status for each story
      const transformedStories = (enhancedCopies || []).map(story => {
        const chapters = story.chapters || [];
        const enhancedChapters = chapters.filter((ch: Chapter) =>
          ch.enhanced || (ch.scenes && ch.scenes.length > 0)
        );

        let status: 'draft' | 'partial' | 'complete' = 'draft';
        if (enhancedChapters.length > 0) {
          status = enhancedChapters.length === chapters.length ? 'complete' : 'partial';
        }

        return {
          ...story,
          status,
          chapters,
          tags: story.tags || []
        } as Story;
      });

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

  const getStoryStats = (story: Story) => {
    const chapters = story.chapters || [];
    const enhancedChapters = chapters.filter(ch => ch.enhanced || (ch.scenes && ch.scenes.length > 0));
    const totalScenes = chapters.flatMap(ch => ch.scenes || []).length;
    const acceptedScenes = chapters.flatMap(ch => ch.scenes || [])
      .filter(s => s.status === 'accepted' || s.accepted).length;

    return {
      totalChapters: chapters.length,
      enhancedChapters: enhancedChapters.length,
      totalScenes,
      acceptedScenes
    };
  };

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
        .from('enhanced_copies')
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
      <StoryEditorPage
        storyId={currentRoute.storyId}
        chapterId={currentRoute.chapterId}
        onBack={handleBackToList}
        onNavigate={(chapterId) => {
          if (onNavigate) {
            onNavigate({ type: 'story-editor', storyId: currentRoute.storyId, chapterId });
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
          story={story}
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
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Upload New Story
            </button>

            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'draft' | 'partial' | 'complete')}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">All Stories</option>
              <option value="draft">Drafts</option>
              <option value="partial">Partially Enhanced</option>
              <option value="complete">Fully Enhanced</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex bg-muted rounded-lg p-1">
              <button
                onClick={() => setDisplayMode('grid')}
                className={displayMode === 'grid' ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'}
              >
                Grid
              </button>
              <button
                onClick={() => setDisplayMode('list')}
                className={displayMode === 'list' ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'}
              >
                List
              </button>
            </div>
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

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <svg className="animate-spin w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 4.708L4 12z"></path>
              </svg>
            </div>
            <p className="text-muted-foreground">Loading your stories...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredStories.length === 0 && (
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
        {!isLoading && filteredStories.length > 0 && (
          <div className={displayMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                displayMode={displayMode}
                stats={getStoryStats(story)}
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