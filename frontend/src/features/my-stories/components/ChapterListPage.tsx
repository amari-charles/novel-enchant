/**
 * Chapter List Page
 * Shows all chapters in a story with management capabilities
 * Allows adding, editing, deleting, and enhancing chapters
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ChapterWorkspace } from './ChapterWorkspace';
import { ChapterCard } from './ChapterCard';
import { StoryRepository } from '@/services/enhancement/repositories/StoryRepository';
import { ChapterRepository } from '@/services/enhancement/repositories/ChapterRepository';
import { EnhancementRepository } from '@/services/enhancement/repositories/EnhancementRepository';
import { AnchorRepository } from '@/services/enhancement/repositories/AnchorRepository';
import { MediaRepository } from '@/services/enhancement/repositories/MediaRepository';
import { createEnhancementOrchestrator } from '@/services/enhancement/createEnhancementOrchestrator';
import type { Story as DBStory } from '@/services/enhancement/repositories/IStoryRepository';
import type { Chapter as DBChapter } from '@/services/enhancement/repositories/IChapterRepository';

interface Story extends DBStory {
  status: 'draft' | 'partial' | 'complete';
}

interface Scene {
  id: string;
  image_url?: string;
}

interface Chapter extends DBChapter {
  enhanced: boolean;
  stats: ChapterStats;
  scenes?: Scene[];
}

interface ChapterStats {
  totalScenes: number;
  acceptedScenes: number;
  isEnhanced: boolean;
}

interface ChapterListPageProps {
  storyId: string;
  chapterId?: string;
  onBack: () => void;
  onNavigateToChapter?: (chapterId: string) => void;
}

type View = 'chapter-list' | 'chapter-editor';

export const ChapterListPage: React.FC<ChapterListPageProps> = ({
  storyId,
  chapterId,
  onBack,
  onNavigateToChapter,
}) => {
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('chapter-list');
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [enhancingChapterId, setEnhancingChapterId] = useState<string | null>(null);

  const loadStory = useCallback(async () => {
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
      const mediaRepository = new MediaRepository();

      // Load story
      const dbStory = await storyRepository.get(storyId);

      if (!dbStory) {
        throw new Error('Story not found');
      }

      // Verify ownership
      if (dbStory.user_id !== user.id) {
        throw new Error('Unauthorized');
      }

      // Load chapters for this story
      const dbChapters = await chapterRepository.getByStoryId(storyId);

      // Compute stats for each chapter
      const chaptersWithStats: Chapter[] = await Promise.all(
        dbChapters.map(async (dbChapter) => {
          const anchors = await anchorRepository.getByChapterId(dbChapter.id);
          const enhancements = await enhancementRepository.getByChapterId(dbChapter.id);

          const completedEnhancements = enhancements.filter(e => e.status === 'completed');
          const hasEnhancements = completedEnhancements.length > 0;

          // Get first enhancement's media URL for preview
          const scenes: Scene[] = [];
          if (completedEnhancements.length > 0 && completedEnhancements[0].media_id) {
            const media = await mediaRepository.get(completedEnhancements[0].media_id);
            if (media) {
              scenes.push({
                id: completedEnhancements[0].id,
                image_url: media.url
              });
            }
          }

          return {
            ...dbChapter,
            enhanced: hasEnhancements,
            scenes,
            stats: {
              totalScenes: anchors.length,
              acceptedScenes: completedEnhancements.length,
              isEnhanced: hasEnhancements
            }
          };
        })
      );

      // Calculate story status based on chapters
      const enhancedChapters = chaptersWithStats.filter(ch => ch.enhanced);
      let status: 'draft' | 'partial' | 'complete' = 'draft';
      if (enhancedChapters.length > 0) {
        status = enhancedChapters.length === chaptersWithStats.length ? 'complete' : 'partial';
      }

      setStory({ ...dbStory, status });
      setChapters(chaptersWithStats);
    } catch (error) {
      console.error('Failed to load story:', error);
      setError(error instanceof Error ? error.message : 'Failed to load story');
    } finally {
      setIsLoading(false);
    }
  }, [storyId, user]);

  useEffect(() => {
    loadStory();
  }, [loadStory]);

  const handleEditChapter = (chapterId: string) => {
    if (onNavigateToChapter) {
      // Use routing if available
      onNavigateToChapter(chapterId);
    } else {
      // Fallback to internal state
      setSelectedChapterId(chapterId);
      setCurrentView('chapter-editor');
    }
  };

  const handleBackToChapterList = () => {
    setCurrentView('chapter-list');
    setSelectedChapterId(null);
    // Reload story to get latest changes
    loadStory();
  };


  const handleAddChapter = async () => {
    if (!story) return;

    try {
      const chapterRepository = new ChapterRepository();

      // Create new chapter in database
      const newChapter = await chapterRepository.create({
        story_id: storyId,
        title: `Chapter ${chapters.length + 1}`,
        text_content: '',
        order_index: chapters.length
      });

      // Reload story to get updated chapter list
      await loadStory();

      // Automatically open the new chapter for editing
      handleEditChapter(newChapter.id);
    } catch (error) {
      console.error('Failed to add chapter:', error);
      setError(`Failed to add chapter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEnhanceChapter = async (chapterId: string) => {
    if (!story || !user) {
      console.log('handleEnhanceChapter: Missing story or user', { story, user });
      return;
    }

    // Check if chapter is already enhanced
    const chapter = chapters.find(ch => ch.id === chapterId);
    const isReEnhancement = chapter?.stats.isEnhanced;

    console.log(`Starting ${isReEnhancement ? 're-' : ''}enhancement for chapter:`, chapterId);

    try {
      setError(null);
      setEnhancingChapterId(chapterId);

      // Create the enhancement orchestrator with all dependencies
      console.log('Creating enhancement orchestrator...');
      const orchestrator = createEnhancementOrchestrator(user.id);

      // Start the enhancement process
      if (isReEnhancement) {
        console.log('Starting re-enhancement process...');
        await orchestrator.reEnhanceChapter(chapterId);
      } else {
        console.log('Starting enhancement process...');
        await orchestrator.enhanceChapter(chapterId);
      }

      console.log('Enhancement completed, reloading story...');
      // Reload story to show updated enhancement status
      await loadStory();

      console.log('Story reloaded successfully');
    } catch (error) {
      console.error(`Failed to ${isReEnhancement ? 're-' : ''}enhance chapter:`, error);
      setError(`Failed to ${isReEnhancement ? 're-' : ''}enhance chapter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setEnhancingChapterId(null);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!story) return;
    if (!confirm('Are you sure you want to delete this chapter? This action cannot be undone.')) {
      return;
    }

    try {
      const chapterRepository = new ChapterRepository();

      // Delete chapter from database
      await chapterRepository.delete(chapterId);

      // Reload story to get updated chapter list
      await loadStory();
    } catch (error) {
      console.error('Failed to delete chapter:', error);
      setError(`Failed to delete chapter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (error && !story) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error || 'Story not found'}</p>
          <button onClick={onBack} className="btn-primary">
            Back to Stories
          </button>
        </div>
      </div>
    );
  }

  // Chapter Editor View - check both route param and internal state
  const activeChapterId = chapterId || selectedChapterId;
  if ((currentView === 'chapter-editor' || chapterId) && activeChapterId && story) {
    const selectedChapter = chapters.find(ch => ch.id === activeChapterId);

    if (!selectedChapter) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Chapter not found</h2>
            <button onClick={chapterId ? onBack : handleBackToChapterList} className="btn-primary">
              Back to Chapters
            </button>
          </div>
        </div>
      );
    }

    return (
      <ChapterWorkspace
        chapterId={selectedChapter.id}
        onBack={chapterId ? onBack : handleBackToChapterList}
      />
    );
  }

  // Chapter List View
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="btn-ghost btn-sm"
              aria-label="Back to stories"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{story?.title || 'Loading...'}</h1>
              {story && (
                <p className="text-muted-foreground">
                  {chapters.length} chapters • Last updated {new Date(story.updated_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {story && (
            <button
              onClick={handleAddChapter}
              className="btn-primary"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Chapter
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Enhancement Progress Overlay */}
        {enhancingChapterId && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-3">
              <svg className="animate-spin w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 4.708L4 12z"></path>
              </svg>
              <div>
                <p className="text-sm font-medium text-primary">Enhancing chapter...</p>
                <p className="text-xs text-muted-foreground">Analyzing scenes and generating images. This may take a minute.</p>
              </div>
            </div>
          </div>
        )}

        {/* Chapters List */}
        <div className="space-y-4">
          {chapters.map((chapter) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter as any}
              stats={chapter.stats}
              onEdit={() => handleEditChapter(chapter.id)}
              onEnhance={() => handleEnhanceChapter(chapter.id)}
              onDelete={() => handleDeleteChapter(chapter.id)}
            />
          ))}

          {!isLoading && chapters.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No chapters yet</h3>
              <p className="text-muted-foreground mb-4">Add your first chapter to get started</p>
              {story && (
                <button
                  onClick={handleAddChapter}
                  className="btn-primary"
                >
                  Add First Chapter
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChapterListPage;