/**
 * Story Editor Page
 * Main editor view with chapter list and individual chapter enhancement
 * Reuses ChapterEditor from my-works and adds enhancement functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { ChapterEditor } from '@/features/my-works/components/ChapterEditor';
import { ShelfEnhanceService } from '@/lib/shelf-enhance.service';

interface Story {
  id: string;
  title: string;
  description?: string | null;
  chapters: Chapter[];
  status: 'draft' | 'partial' | 'complete';
  updated_at: string;
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

interface StoryEditorPageProps {
  storyId: string;
  onBack: () => void;
}

type View = 'chapter-list' | 'chapter-editor';

export const StoryEditorPage: React.FC<StoryEditorPageProps> = ({
  storyId,
  onBack
}) => {
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('chapter-list');
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [enhancingChapters, setEnhancingChapters] = useState<Set<string>>(new Set());
  const [enhancementProgress, setEnhancementProgress] = useState<{ [chapterId: string]: number }>({});

  useEffect(() => {
    loadStory();
  }, [storyId, loadStory]);

  const loadStory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: storyData, error: queryError } = await supabase
        .from('enhanced_copies')
        .select('*')
        .eq('id', storyId)
        .eq('user_id', user.id)
        .single();

      if (queryError) {
        throw new Error(`Failed to load story: ${queryError.message}`);
      }

      if (!storyData) {
        throw new Error('Story not found');
      }

      setStory(storyData as Story);
    } catch (error) {
      console.error('Failed to load story:', error);
      setError(error instanceof Error ? error.message : 'Failed to load story');
    } finally {
      setIsLoading(false);
    }
  }, [storyId, user]);

  const handleEditChapter = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setCurrentView('chapter-editor');
  };

  const handleBackToChapterList = () => {
    setCurrentView('chapter-list');
    setSelectedChapterId(null);
    // Reload story to get latest changes
    loadStory();
  };

  const handleEnhanceChapter = async (chapter: Chapter) => {
    if (!story) return;

    try {
      setEnhancingChapters(prev => new Set(prev).add(chapter.id));
      setEnhancementProgress(prev => ({ ...prev, [chapter.id]: 0 }));

      // Use chapter content or title as text for enhancement
      const chapterText = chapter.content || `Chapter: ${chapter.title || 'Untitled'}`;

      console.log(`Enhancing chapter: ${chapter.title}`);

      // Use the shelf enhance service for chapter enhancement
      const result = await ShelfEnhanceService.enhanceChapterFromShelf(
        chapterText,
        chapter.title || `Chapter ${chapter.order_index + 1}`,
        story.title,
        (sceneIndex) => {
          // Update progress based on scene completion
          const baseProgress = 30;
          const sceneProgress = (sceneIndex / 5) * 60; // Assume ~5 scenes
          setEnhancementProgress(prev => ({
            ...prev,
            [chapter.id]: baseProgress + sceneProgress
          }));
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'Enhancement failed');
      }

      setEnhancementProgress(prev => ({ ...prev, [chapter.id]: 95 }));

      // Update the chapter with enhanced scenes
      const updatedChapters = story.chapters.map(ch => {
        if (ch.id === chapter.id) {
          return {
            ...ch,
            scenes: result.updatedScenes || [],
            enhanced: true
          };
        }
        return ch;
      });

      const updatedStory = {
        ...story,
        chapters: updatedChapters,
        updated_at: new Date().toISOString()
      };

      // Save to database
      const { error: updateError } = await supabase
        .from('enhanced_copies')
        .update({
          chapters: updatedChapters,
          updated_at: updatedStory.updated_at
        })
        .eq('id', story.id);

      if (updateError) {
        throw new Error(`Failed to save enhancement: ${updateError.message}`);
      }

      setStory(updatedStory);
      setEnhancementProgress(prev => ({ ...prev, [chapter.id]: 100 }));

      console.log(`Successfully enhanced chapter: ${chapter.title}`);

      // Clean up progress after delay
      setTimeout(() => {
        setEnhancingChapters(prev => {
          const newSet = new Set(prev);
          newSet.delete(chapter.id);
          return newSet;
        });
        setEnhancementProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[chapter.id];
          return newProgress;
        });
      }, 1000);

    } catch (error) {
      console.error('Failed to enhance chapter:', error);
      setError(`Failed to enhance chapter: ${error instanceof Error ? error.message : 'Unknown error'}`);

      // Clean up progress on error
      setEnhancingChapters(prev => {
        const newSet = new Set(prev);
        newSet.delete(chapter.id);
        return newSet;
      });
      setEnhancementProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[chapter.id];
        return newProgress;
      });
    }
  };

  const handleAddChapter = async () => {
    if (!story) return;

    try {
      const newChapter: Chapter = {
        id: crypto.randomUUID(),
        title: `Chapter ${story.chapters.length + 1}`,
        content: '',
        order_index: story.chapters.length,
        scenes: [],
        enhanced: false
      };

      const updatedChapters = [...story.chapters, newChapter];
      const updatedStory = {
        ...story,
        chapters: updatedChapters,
        updated_at: new Date().toISOString()
      };

      // Save to database
      const { error: updateError } = await supabase
        .from('enhanced_copies')
        .update({
          chapters: updatedChapters,
          updated_at: updatedStory.updated_at
        })
        .eq('id', story.id);

      if (updateError) {
        throw new Error(`Failed to add chapter: ${updateError.message}`);
      }

      setStory(updatedStory);

      // Automatically open the new chapter for editing
      handleEditChapter(newChapter.id);
    } catch (error) {
      console.error('Failed to add chapter:', error);
      setError(`Failed to add chapter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getChapterStats = (chapter: Chapter) => {
    const scenes = chapter.scenes || [];
    const acceptedScenes = scenes.filter(s => s.status === 'accepted' || s.accepted);
    return {
      totalScenes: scenes.length,
      acceptedScenes: acceptedScenes.length,
      isEnhanced: chapter.enhanced || scenes.length > 0
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <svg className="animate-spin w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 4.708L4 12z"></path>
            </svg>
          </div>
          <p className="text-muted-foreground">Loading story...</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
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

  // Chapter Editor View
  if (currentView === 'chapter-editor' && selectedChapterId) {
    return (
      <ChapterEditor
        chapterId={selectedChapterId}
        onSave={() => {
          // The ChapterEditor handles saving internally
          handleBackToChapterList();
        }}
        onBack={handleBackToChapterList}
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
              <h1 className="text-2xl font-bold text-foreground">{story.title}</h1>
              <p className="text-muted-foreground">
                {story.chapters.length} chapters • Last updated {new Date(story.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <button
            onClick={handleAddChapter}
            className="btn-primary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Chapter
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Chapters List */}
        <div className="space-y-4">
          {story.chapters.map((chapter) => {
            const stats = getChapterStats(chapter);
            const isEnhancing = enhancingChapters.has(chapter.id);
            const progress = enhancementProgress[chapter.id] || 0;

            return (
              <div
                key={chapter.id}
                className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {chapter.title || `Chapter ${chapter.order_index + 1}`}
                    </h3>

                    {isEnhancing ? (
                      <div className="mb-3">
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
                      <div className="flex items-center gap-3 mb-3">
                        <p className="text-sm text-muted-foreground">
                          {stats.isEnhanced
                            ? `${stats.totalScenes} scenes • ${stats.acceptedScenes} enhanced`
                            : 'Not enhanced yet'
                          }
                        </p>
                        {stats.isEnhanced && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Enhanced
                          </span>
                        )}
                      </div>
                    )}

                    {chapter.content && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {chapter.content.substring(0, 150)}...
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEditChapter(chapter.id)}
                      className="btn-ghost btn-sm"
                      disabled={isEnhancing}
                    >
                      Edit
                    </button>

                    {!stats.isEnhanced && !isEnhancing && (
                      <button
                        onClick={() => handleEnhanceChapter(chapter)}
                        className="btn-primary btn-sm"
                      >
                        Enhance
                      </button>
                    )}

                    {stats.isEnhanced && !isEnhancing && (
                      <button
                        onClick={() => handleEnhanceChapter(chapter)}
                        className="btn-ghost btn-sm text-primary"
                      >
                        Retry Images
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {story.chapters.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No chapters yet</h3>
              <p className="text-muted-foreground mb-4">Add your first chapter to get started</p>
              <button
                onClick={handleAddChapter}
                className="btn-primary"
              >
                Add First Chapter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryEditorPage;