/**
 * My Shelf Page Component
 * Displays enhanced copies saved by the user
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { ReadingView } from '@/features/reader-enhance/components/ReadingView';
import { AddChaptersModal } from '@/features/reader-enhance/components/AddChaptersModal';
import { ShelfEnhanceService } from '@/lib/shelf-enhance.service';
// import type { MultiChapterResult } from '@/features/file-upload/services/chapter-fetch.service';
import type { EnhancedCopy, ScenePreview, Chapter } from '@/features/reader-enhance/types';

interface ShelfCopy extends EnhancedCopy {
  preview_image?: string;
  scene_count?: number;
}

// Import route types from app
type Route =
  | { type: 'home' }
  | { type: 'shelf' }
  | { type: 'shelf-story'; storyId: string }
  | { type: 'shelf-reading'; storyId: string; chapterIndex?: number }
  | { type: 'explore' }
  | { type: 'works' }

interface ShelfPageProps {
  onNavigateToEnhance?: () => void;
  currentRoute?: Route;
  onNavigate?: (route: Route) => void;
}

export const ShelfPage: React.FC<ShelfPageProps> = ({ onNavigateToEnhance, onNavigate }) => {
  const { user } = useAuth();
  const [copies, setCopies] = useState<ShelfCopy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCopy, setSelectedCopy] = useState<ShelfCopy | null>(null);
  const [currentView, setCurrentView] = useState<'shelf' | 'story' | 'reading'>('shelf');
  const [selectedStory, setSelectedStory] = useState<ShelfCopy | null>(null);
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');
  const [isAddChaptersModalOpen, setIsAddChaptersModalOpen] = useState(false);
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
  const [enhancementProgress, setEnhancementProgress] = useState<{ [chapterIndex: number]: number }>({});
  const [enhancingChapters, setEnhancingChapters] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (user) {
      loadShelfCopies();
    } else {
      setIsLoading(false);
      setError('Please log in to view your shelf');
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setOpenDropdownIndex(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadShelfCopies = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: copies, error: queryError } = await supabase
        .from('enhanced_copies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (queryError) {
        throw new Error(`Failed to load copies: ${queryError.message}`);
      }

      console.log('Loaded', copies?.length || 0, 'enhanced copies from database');

      // Transform the data to match the expected interface
      const transformedCopies = (copies || []).map(copy => ({
        ...copy,
        content: {
          chapters: copy.chapters || []
        }
      })) as ShelfCopy[];

      setCopies(transformedCopies);
    } catch (error) {
      console.error('Failed to load shelf copies:', error);
      setError(error instanceof Error ? error.message : 'Failed to load shelf copies');
    } finally {
      setIsLoading(false);
    }
  };

  const getSceneStats = (copy: ShelfCopy) => {
    const allScenes = copy.content?.chapters?.flatMap(ch => ch.scenes || []) || [];
    return {
      scenes: allScenes.length,
      accepted: allScenes.filter(s => s.status === 'accepted' || s.status === 'generated').length,
    };
  };

  const handleDeleteCopy = async (copyId: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return;

    try {
      await supabase
        .from('enhanced_copies')
        .delete()
        .eq('id', copyId);

      setCopies(prev => prev.filter(copy => copy.id !== copyId));
    } catch (error) {
      console.error('Failed to delete copy:', error);
      setError('Failed to delete story');
    }
  };

  const handleViewStory = (story: ShelfCopy) => {
    setSelectedStory(story);
    setCurrentView('story');
  };

  const handleReadChapter = (story: ShelfCopy, chapterIndex: number = 0) => {
    setSelectedCopy({
      ...story,
      initialChapterIndex: chapterIndex
    } as ShelfCopy & { initialChapterIndex: number });
    setCurrentView('reading');
  };

  const handleBackToShelf = () => {
    setCurrentView('shelf');
    setSelectedStory(null);
    setSelectedCopy(null);
  };

  const handleEditChapter = async (chapterIndex: number) => {
    if (!selectedStory) return;

    const chapter = selectedStory.content?.chapters?.[chapterIndex];
    if (!chapter) return;

    const newTitle = prompt('Edit chapter title:', chapter.title || `Chapter ${chapterIndex + 1}`);
    if (newTitle === null) return; // User cancelled

    try {
      // Update the chapter title
      const updatedChapters = [...(selectedStory.content?.chapters || [])];
      updatedChapters[chapterIndex] = {
        ...chapter,
        title: newTitle
      };

      const updatedStory = {
        ...selectedStory,
        content: {
          ...selectedStory.content,
          chapters: updatedChapters
        },
        updated_at: new Date().toISOString()
      };

      // Update in database
      const { error } = await supabase
        .from('enhanced_copies')
        .update(updatedStory)
        .eq('id', selectedStory.id);

      if (error) {
        console.error('Failed to update chapter:', error);
        setError('Failed to update chapter title');
        return;
      }

      // Update local state
      setSelectedStory(updatedStory);
      setCopies(prevCopies =>
        prevCopies.map(copy =>
          copy.id === selectedStory.id ? updatedStory : copy
        )
      );

    } catch (error) {
      console.error('Failed to edit chapter:', error);
      setError('Failed to edit chapter');
    }
  };

  const handleDeleteChapter = async (chapterIndex: number) => {
    if (!selectedStory) return;

    const chapter = selectedStory.content?.chapters?.[chapterIndex];
    if (!chapter) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${chapter.title || `Chapter ${chapterIndex + 1}`}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      // Remove the chapter from the array
      const updatedChapters = [...(selectedStory.content?.chapters || [])];
      updatedChapters.splice(chapterIndex, 1);

      // Update order indices for remaining chapters
      const reorderedChapters = updatedChapters.map((ch, idx) => ({
        ...ch,
        order_index: idx
      }));

      const updatedStory = {
        ...selectedStory,
        content: {
          ...selectedStory.content,
          chapters: reorderedChapters
        },
        updated_at: new Date().toISOString()
      };

      // Update in database
      const { error } = await supabase
        .from('enhanced_copies')
        .update(updatedStory)
        .eq('id', selectedStory.id);

      if (error) {
        console.error('Failed to delete chapter:', error);
        setError('Failed to delete chapter');
        return;
      }

      // Update local state
      setSelectedStory(updatedStory);
      setCopies(prevCopies =>
        prevCopies.map(copy =>
          copy.id === selectedStory.id ? updatedStory : copy
        )
      );

    } catch (error) {
      console.error('Failed to delete chapter:', error);
      setError('Failed to delete chapter');
    }
  };

  const handleEnhanceChapter = async (chapterIndex: number) => {
    console.log('handleEnhanceChapter called:', { chapterIndex, selectedStory: !!selectedStory });

    if (!selectedStory) {
      console.error('No selected story');
      return;
    }

    const chapter = selectedStory.content?.chapters?.[chapterIndex];
    console.log('Chapter found:', { chapter: !!chapter, hasContent: !!chapter?.content });

    if (!chapter) {
      console.error('Chapter not found');
      return;
    }

    // Extract text from scenes since chapters store content in scenes
    let chapterText = '';
    if (chapter.scenes && chapter.scenes.length > 0) {
      chapterText = chapter.scenes.map((scene: ScenePreview) => scene.excerpt || '').join(' ');
    }

    // If no text from scenes, use a default placeholder for re-enhancement
    if (!chapterText) {
      chapterText = `Chapter ${chapterIndex + 1}: ${chapter.title || 'Untitled Chapter'}. This chapter contains ${chapter.scenes?.length || 0} scenes that need re-enhancement.`;
    }

    console.log('Chapter text found:', { hasChapterText: !!chapterText, textLength: chapterText?.length, fromScenes: chapter.scenes?.length });

    try {
      // Start enhancement process
      setEnhancingChapters(prev => new Set(prev).add(chapterIndex));
      setEnhancementProgress(prev => ({ ...prev, [chapterIndex]: 0 }));
      setOpenDropdownIndex(null);

      console.log(`Enhancing chapter: ${chapter.title}`);

      // Use the new shelf enhance service
      const result = await ShelfEnhanceService.enhanceChapterFromShelf(
        chapterText,
        chapter.title || `Chapter ${chapterIndex + 1}`,
        selectedStory.title,
        (sceneIndex, progress) => {
          // Update progress based on scene completion
          const baseProgress = 30;
          const sceneProgress = (sceneIndex / (chapter.scenes?.length || 5)) * 60;
          setEnhancementProgress(prev => ({
            ...prev,
            [chapterIndex]: baseProgress + sceneProgress
          }));

          console.log(`Scene ${sceneIndex + 1} progress:`, progress);
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'Enhancement failed');
      }

      if (!result.updatedScenes) {
        throw new Error('No updated scenes returned from enhancement');
      }

      // Update scenes with new data from enhancement
      const updatedScenes = chapter.scenes?.map((scene: ScenePreview, index: number) => {
        const newSceneData = result.updatedScenes![index];
        return newSceneData ? {
          ...scene,
          ...newSceneData
        } : scene;
      }) || result.updatedScenes.map((sceneData, index) => ({
        excerpt: `Scene ${index + 1}`,
        ...sceneData
      }));

      setEnhancementProgress(prev => ({ ...prev, [chapterIndex]: 85 }));

      // Update the chapter with new scenes
      const updatedChapters = [...(selectedStory.content?.chapters || [])];
      updatedChapters[chapterIndex] = {
        ...chapter,
        scenes: updatedScenes,
        enhanced: true
      };

      const updatedStory = {
        ...selectedStory,
        chapters: updatedChapters, // Use chapters directly, not nested in content
        updated_at: new Date().toISOString()
      };

      setEnhancementProgress(prev => ({ ...prev, [chapterIndex]: 95 }));

      // Update in database - only update the chapters field
      const { error } = await supabase
        .from('enhanced_copies')
        .update({
          chapters: updatedChapters,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedStory.id);

      if (error) {
        console.error('Failed to enhance chapter:', error);
        setError('Failed to enhance chapter');
        return;
      }

      // Update local state (maintain content.chapters for UI compatibility)
      const storyForUI = {
        ...updatedStory,
        content: {
          chapters: updatedChapters
        }
      };
      setSelectedStory(storyForUI);
      setCopies(prevCopies =>
        prevCopies.map(copy =>
          copy.id === selectedStory.id ? storyForUI : copy
        )
      );

      setEnhancementProgress(prev => ({ ...prev, [chapterIndex]: 100 }));
      console.log(`Successfully enhanced chapter: ${chapter.title}`);

      // Clean up progress state after a brief delay
      setTimeout(() => {
        setEnhancingChapters(prev => {
          const newSet = new Set(prev);
          newSet.delete(chapterIndex);
          return newSet;
        });
        setEnhancementProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[chapterIndex];
          return newProgress;
        });
      }, 1000);

    } catch (error) {
      console.error('Failed to enhance chapter:', error);
      setError('Failed to enhance chapter. Please try again.');

      // Clean up progress state on error
      setEnhancingChapters(prev => {
        const newSet = new Set(prev);
        newSet.delete(chapterIndex);
        return newSet;
      });
      setEnhancementProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[chapterIndex];
        return newProgress;
      });
    }
  };

  const handleAddChapters = () => {
    setIsAddChaptersModalOpen(true);
  };

  const toggleDropdown = (index: number) => {
    setOpenDropdownIndex(openDropdownIndex === index ? null : index);
  };


  const handleChaptersAdded = async (result: { chapters: { title: string; content: string }[]; totalFetched: number; errors: string[] }) => {
    if (!selectedStory || result.chapters.length === 0) return;

    try {
      // Convert fetched chapters to the format expected by our story structure
      const newChapters = result.chapters.map((chapterData: { title: string; content: string }, index: number) => {
        const chapterId = `chapter_${Date.now()}_${index}`;

        return {
          id: chapterId,
          title: chapterData.title,
          order_index: (selectedStory.content?.chapters?.length || 0) + index,
          content: chapterData.content, // Store the full chapter content
          scenes: [], // Start with no scenes - user will enhance manually
          enhanced: false // Track enhancement status
        };
      });

      // Update the selected story with new chapters
      const updatedStory = {
        ...selectedStory,
        content: {
          ...selectedStory.content,
          chapters: [...(selectedStory.content?.chapters || []), ...newChapters]
        },
        updated_at: new Date().toISOString()
      };

      // Save to localStorage via supabase mock
      await supabase
        .from('enhanced_copies')
        .update(updatedStory)
        .eq('id', selectedStory.id);

      // Update local state
      setSelectedStory(updatedStory);
      setCopies(prevCopies =>
        prevCopies.map(copy =>
          copy.id === selectedStory.id ? updatedStory : copy
        )
      );

      console.log(`Successfully added ${result.chapters.length} chapters to story`);
      if (result.errors.length > 0) {
        console.warn('Some chapters failed to fetch:', result.errors);
      }

      // Auto-enhancement workflow: automatically enhance newly added chapters
      const startingChapterIndex = (selectedStory.content?.chapters?.length || 0);
      for (let i = 0; i < newChapters.length; i++) {
        const chapterIndex = startingChapterIndex + i;
        const chapter = newChapters[i];

        // Only auto-enhance if chapter has content
        if (chapter.content && chapter.content.trim().length > 0) {
          console.log(`Auto-enhancing newly added chapter: ${chapter.title}`);

          // Start enhancement for this chapter with a slight delay between chapters
          setTimeout(() => {
            handleEnhanceChapter(chapterIndex);
          }, i * 1000); // 1 second delay between each chapter enhancement
        }
      }

    } catch (error) {
      console.error('Failed to save new chapters:', error);
      setError('Failed to add chapters to story');
    }
  };

  // Render modal at top level, outside conditional views
  const renderModal = () => (
    <>
      {/* Add Chapters Modal */}
      {selectedStory && (
        <AddChaptersModal
          isOpen={isAddChaptersModalOpen}
          onClose={() => {
            setIsAddChaptersModalOpen(false);
          }}
          story={selectedStory}
          onChaptersAdded={handleChaptersAdded}
        />
      )}
    </>
  );

  if (currentView === 'reading' && selectedCopy) {
    return (
      <>
        <ReadingView
          copy={selectedCopy}
          onBack={handleBackToShelf}
        />
        {renderModal()}
      </>
    );
  }

  if (currentView === 'story' && selectedStory) {
    return (
      <>
        <div className="min-h-screen bg-background">
          {/* Story Header */}
          <div className="bg-card border-b border-border">
            <div className="max-w-4xl mx-auto px-6 py-6">
              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={handleBackToShelf}
                  className="btn-ghost btn-sm"
                  aria-label="Back to shelf"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-foreground">{selectedStory.title}</h1>
                  <p className="text-muted-foreground">
                    {selectedStory.content?.chapters?.length || 0} chapters • {getSceneStats(selectedStory).accepted} enhanced scenes
                  </p>
                </div>

                <button
                  onClick={handleAddChapters}
                  className="btn-primary"
                >
                  + Add More Chapters
                </button>
              </div>
            </div>
          </div>

          {/* Chapters List */}
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="space-y-4">
              {(selectedStory.content?.chapters || []).map((chapter: Chapter, index: number) => {
                const chapterScenes = chapter.scenes || [];
                const acceptedScenes = chapterScenes.filter((s: ScenePreview) => s.status === 'accepted' || s.status === 'generated');
                const isEnhanced = (chapter.enhanced === true || chapterScenes.length > 0) && acceptedScenes.length > 0;

                // Debug logging to see what's happening
                if (index === 0) {
                  console.log('Chapter 1 debug:', {
                    enhanced: chapter.enhanced,
                    chapterScenes: chapterScenes.length,
                    acceptedScenes: acceptedScenes.length,
                    isEnhanced,
                    firstScene: chapterScenes[0],
                    firstAcceptedScene: acceptedScenes[0]
                  });
                }


                return (
                  <div
                    key={chapter.id}
                    className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow relative cursor-pointer"
                    onClick={() => handleReadChapter(selectedStory, index)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Chapter Info - Left side */}
                      <div className="flex-1 min-w-0">
                        <div className="mb-3">
                          <h3 className="text-lg font-semibold text-foreground">
                            {chapter.title || `Chapter ${index + 1}`}
                          </h3>
                        </div>

                        <div className="flex items-center gap-3 mb-3">
                          {enhancingChapters.has(index) ? (
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm text-primary font-medium">Enhancing...</span>
                                  <span className="text-xs text-muted-foreground">{enhancementProgress[index] || 0}%</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div
                                    className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${enhancementProgress[index] || 0}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm text-muted-foreground">
                                {chapterScenes.length > 0
                                  ? `${chapterScenes.length} scenes • ${acceptedScenes.length} enhanced`
                                  : 'Not enhanced yet'
                                }
                              </p>
                              {chapterScenes.length > 0 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                  Enhanced
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {chapterScenes[0] && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {chapterScenes[0].excerpt.substring(0, 150)}...
                          </p>
                        )}
                      </div>

                      {/* Preview Image - Center right */}
                      {(acceptedScenes[0]?.image_url || chapterScenes[0]?.image_url) && (
                        <div className="flex-shrink-0">
                          <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                            <img
                              src={acceptedScenes[0]?.image_url || chapterScenes[0]?.image_url}
                              alt="Chapter preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Show placeholder for expired/broken images
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `
                                    <svg class="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                    </svg>
                                    <span class="sr-only">Enhanced image (expired)</span>
                                  `;
                                }
                              }}
                              onLoad={() => {
                                console.log('Image loaded successfully');
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions Menu - Absolutely positioned to right center of card */}
                    <div
                      className="absolute right-6 top-1/2 transform -translate-y-1/2 dropdown-container"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDropdown(index);
                        }}
                        className="btn-ghost btn-sm p-2"
                        aria-label="Chapter actions"
                        title="More options"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01" />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      {openDropdownIndex === index && (
                        <div className="absolute right-0 top-8 bg-card border border-border rounded-lg shadow-lg py-2 min-w-[160px] z-10">
                          {!isEnhanced && !enhancingChapters.has(index) && (
                            <button
                              onClick={() => {
                                handleEnhanceChapter(index);
                                setOpenDropdownIndex(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                            >
                              Enhance Chapter
                            </button>
                          )}
                          {isEnhanced && !enhancingChapters.has(index) && (
                            <button
                              onClick={() => {
                                handleEnhanceChapter(index);
                                setOpenDropdownIndex(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-primary/10 transition-colors"
                            >
                              Retry Images
                            </button>
                          )}
                          {enhancingChapters.has(index) && (
                            <div className="px-4 py-2 text-sm text-muted-foreground">
                              Enhancement in progress...
                            </div>
                          )}
                          <button
                            onClick={() => {
                              handleEditChapter(index);
                              setOpenDropdownIndex(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                            disabled={enhancingChapters.has(index)}
                          >
                            Edit Details
                          </button>
                          <button
                            onClick={() => {
                              handleDeleteChapter(index);
                              setOpenDropdownIndex(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                            disabled={enhancingChapters.has(index)}
                          >
                            Delete Chapter
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {renderModal()}
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Shelf</h1>
              <p className="text-muted-foreground mt-1">Your enhanced story collection</p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Upload New Story Button */}
              <button
                onClick={() => {
                  if (onNavigateToEnhance) {
                    onNavigateToEnhance();
                  } else if (onNavigate) {
                    onNavigate({ type: 'home' });
                  } else {
                    // Fallback navigation
                    window.location.href = '/';
                  }
                }}
                className="btn-primary"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Upload New Story
              </button>

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

          {/* Empty State */}
          {!isLoading && copies.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No enhanced stories yet</h3>
              <p className="text-muted-foreground mb-6">Upload a story to get started with AI-enhanced scenes and images!</p>
              <button
                onClick={() => {
                  if (onNavigateToEnhance) {
                    onNavigateToEnhance();
                  } else if (onNavigate) {
                    onNavigate({ type: 'home' });
                  } else {
                    // Fallback navigation
                    window.location.href = '/';
                  }
                }}
                className="btn-primary"
              >
                Upload Your First Story
              </button>
            </div>
          )}

          {/* Stories Grid/List */}
          {!isLoading && copies.length > 0 && (
            <div className={displayMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {copies.map((copy) => {
                const stats = getSceneStats(copy);
                return (
                  <div
                    key={copy.id}
                    className={`group bg-card rounded-lg border border-border hover:shadow-md transition-shadow ${
                      displayMode === 'list' ? 'flex items-center p-6' : 'overflow-hidden'
                    }`}
                  >
                    {displayMode === 'grid' ? (
                      <>
                        {/* Preview Image */}
                        <div className="aspect-[16/9] bg-gradient-to-r from-primary/10 to-secondary/10 relative">
                          {copy.preview_image ? (
                            <img
                              src={copy.preview_image}
                              alt={`Preview of ${copy.title}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-6">
                          <h3 className="font-semibold text-lg text-foreground mb-2 line-clamp-2">
                            {copy.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {stats.scenes} scenes • {stats.accepted} enhanced
                          </p>
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => handleViewStory(copy)}
                              className="btn-primary btn-sm"
                            >
                              View Story
                            </button>
                            <button
                              onClick={() => handleDeleteCopy(copy.id)}
                              className="btn-ghost btn-sm"
                              aria-label="Delete copy"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9 2a1 1 0 0 0 0 2h2a1 1 0 1 0 0-2H9zM4 5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5zm3 4a1 1 0 1 1 2 0v4a1 1 0 1 1-2 0V9zm4 0a1 1 0 1 1 2 0v4a1 1 0 1 1-2 0V9z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-foreground mb-1">
                            {copy.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Created {new Date(copy.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {stats.scenes} scenes • {stats.accepted} enhanced
                          </p>
                        </div>
                        <div className="flex items-center space-x-3 ml-6">
                          <button
                            onClick={() => handleViewStory(copy)}
                            className="btn-primary btn-sm"
                          >
                            View Story
                          </button>
                          <button
                            onClick={() => handleDeleteCopy(copy.id)}
                            className="btn-ghost btn-sm"
                            aria-label="Delete copy"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 0 0 0 2h2a1 1 0 1 0 0-2H9zM4 5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5zm3 4a1 1 0 1 1 2 0v4a1 1 0 1 1-2 0V9zm4 0a1 1 0 1 1 2 0v4a1 1 0 1 1-2 0V9z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
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
              <p className="text-muted-foreground">Loading your enhanced stories...</p>
            </div>
          )}
        </div>
      </div>
      {renderModal()}
    </>
  );
};

export default ShelfPage;