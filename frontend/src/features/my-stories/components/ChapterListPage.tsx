/**
 * Chapter List Page
 * Shows all chapters in a story with management capabilities
 * Allows adding, editing, deleting, and enhancing chapters
 */

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { SimpleChapterEditor } from './SimpleChapterEditor';
import { ShelfEnhanceService } from '@/lib/shelf-enhance.service';
import { ChapterCard } from './ChapterCard';

interface Story {
  id: string;
  user_id: string;
  title: string;
  enhanced_content: {
    author?: string | null;
    description?: string | null;
    chapters: Chapter[];
  };
  status?: 'draft' | 'partial' | 'complete';
  updated_at: string;
  created_at: string;
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

interface ChapterListPageProps {
  storyId: string;
  chapterId?: string;
  onBack: () => void;
  onNavigate?: (chapterId: string) => void;
}

type View = 'chapter-list' | 'chapter-editor';

export const ChapterListPage: React.FC<ChapterListPageProps> = ({
  storyId,
  chapterId,
  onBack,
  onNavigate
}) => {
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('chapter-list');
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [enhancingChapters, setEnhancingChapters] = useState<Set<string>>(new Set());
  const [enhancementProgress, setEnhancementProgress] = useState<{ [chapterId: string]: number }>({});

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

      // Transform the data to match our interface
      const transformedStory: Story = {
        ...storyData,
        enhanced_content: {
          author: storyData.enhanced_content?.author || null,
          description: storyData.enhanced_content?.description || null,
          chapters: storyData.enhanced_content?.chapters || []
        },
        status: storyData.status || 'draft'
      };

      setStory(transformedStory);
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
      const updatedChapters = story.enhanced_content.chapters.map(ch => {
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
        enhanced_content: {
          ...story.enhanced_content,
          chapters: updatedChapters
        },
        updated_at: new Date().toISOString()
      };

      // Save to database - exclude status field which doesn't exist in DB
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { status: _status, ...storyDataForDb } = updatedStory;
      const { error: updateError } = await supabase
        .from('enhanced_copies')
        .update(storyDataForDb)
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
        title: `Chapter ${story.enhanced_content.chapters.length + 1}`,
        content: '',
        order_index: story.enhanced_content.chapters.length,
        scenes: [],
        enhanced: false
      };

      const updatedChapters = [...story.enhanced_content.chapters, newChapter];
      const updatedStory = {
        ...story,
        enhanced_content: {
          ...story.enhanced_content,
          chapters: updatedChapters
        },
        updated_at: new Date().toISOString()
      };

      // Save to database - exclude status field which doesn't exist in DB
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { status: _status2, ...storyDataForDb } = updatedStory;
      const { error: updateError } = await supabase
        .from('enhanced_copies')
        .update(storyDataForDb)
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

  const handleDeleteChapter = async (chapterId: string) => {
    if (!story) return;
    if (!confirm('Are you sure you want to delete this chapter? This action cannot be undone.')) {
      return;
    }

    try {
      const updatedChapters = story.enhanced_content.chapters
        .filter(ch => ch.id !== chapterId)
        .map((ch, idx) => ({ ...ch, order_index: idx }));

      const updatedStory = {
        ...story,
        enhanced_content: {
          ...story.enhanced_content,
          chapters: updatedChapters
        },
        updated_at: new Date().toISOString()
      };

      // Save to database - exclude status field which doesn't exist in DB
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { status: _status, ...storyDataForDb } = updatedStory;
      const { error: updateError } = await supabase
        .from('enhanced_copies')
        .update(storyDataForDb)
        .eq('id', story.id);

      if (updateError) {
        throw new Error(`Failed to delete chapter: ${updateError.message}`);
      }

      setStory(updatedStory);
    } catch (error) {
      console.error('Failed to delete chapter:', error);
      setError(`Failed to delete chapter: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  if (currentView === 'chapter-editor' && selectedChapterId && story) {
    const selectedChapter = story.enhanced_content.chapters.find(ch => ch.id === selectedChapterId);

    if (!selectedChapter) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Chapter not found</h2>
            <button onClick={handleBackToChapterList} className="btn-primary">
              Back to Chapters
            </button>
          </div>
        </div>
      );
    }

    return (
      <SimpleChapterEditor
        chapter={selectedChapter}
        onSave={async (updatedChapter) => {
          // Update the chapter in the story
          const updatedChapters = story.enhanced_content.chapters.map(ch =>
            ch.id === updatedChapter.id ? updatedChapter : ch
          );

          const updatedStory = {
            ...story,
            enhanced_content: {
              ...story.enhanced_content,
              chapters: updatedChapters
            },
            updated_at: new Date().toISOString()
          };

          // Save to database - exclude status field which doesn't exist in DB
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { status: _status, ...storyDataForDb } = updatedStory;
          const { error: updateError } = await supabase
            .from('enhanced_copies')
            .update(storyDataForDb)
            .eq('id', story.id);

          if (updateError) {
            throw new Error(`Failed to save chapter: ${updateError.message}`);
          }

          // Update local state
          setStory(updatedStory);
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
                {story.enhanced_content.chapters.length} chapters • Last updated {new Date(story.updated_at).toLocaleDateString()}
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
          {story.enhanced_content.chapters.map((chapter) => {
            const stats = getChapterStats(chapter);
            const isEnhancing = enhancingChapters.has(chapter.id);
            const progress = enhancementProgress[chapter.id] || 0;

            return (
              <ChapterCard
                key={chapter.id}
                chapter={chapter}
                stats={stats}
                isEnhancing={isEnhancing}
                progress={progress}
                onEdit={() => handleEditChapter(chapter.id)}
                onEnhance={() => handleEnhanceChapter(chapter)}
                onDelete={() => handleDeleteChapter(chapter.id)}
              />
            );
          })}

          {story.enhanced_content.chapters.length === 0 && (
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

export default ChapterListPage;