/**
 * Chapter Workspace
 * Combined editor and viewer for chapters with enhancement support
 */

import React, { useCallback,useEffect, useRef, useState } from 'react';

import { AnchorRepository } from '@/lib/repositories/anchor.repository';
import type { Anchor } from '@/lib/repositories/anchor.repository.interface';
import { ChapterRepository } from '@/lib/repositories/chapter.repository';
import type { Chapter } from '@/lib/repositories/chapter.repository.interface';
import { EnhancementRepository } from '@/lib/repositories/enhancement.repository';
import type { Enhancement } from '@/lib/repositories/enhancement.repository.interface';
import { MediaRepository } from '@/lib/repositories/media.repository';

import { EnhancedTextEditor } from './EnhancedTextEditor';
import { EnhancedTextViewer } from './EnhancedTextViewer';

interface ChapterWorkspaceProps {
  chapterId: string;
  onBack: () => void;
}

type FontPreference = 'sans' | 'serif';
type ViewMode = 'edit' | 'view';

interface EnhancementWithMedia extends Enhancement {
  mediaUrl: string;
}

export const ChapterWorkspace: React.FC<ChapterWorkspaceProps> = ({
  chapterId,
  onBack
}) => {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [enhancements, setEnhancements] = useState<EnhancementWithMedia[]>([]);
  const [, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [fontPref, setFontPref] = useState<FontPreference>(() => {
    const saved = localStorage.getItem('editor-font-preference');
    return (saved === 'serif' || saved === 'sans') ? saved : 'sans';
  });
  const [showFontMenu, setShowFontMenu] = useState(false);

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastSavedContentRef = useRef({ title: '', content: '' });

  // Load chapter, anchors, and enhancements on mount
  useEffect(() => {
    const loadChapterData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const chapterRepository = new ChapterRepository();
        const anchorRepository = new AnchorRepository();
        const enhancementRepository = new EnhancementRepository();
        const mediaRepository = new MediaRepository();

        // Load chapter
        const loadedChapter = await chapterRepository.get(chapterId);
        if (!loadedChapter) {
          throw new Error('Chapter not found');
        }

        // Load anchors
        const loadedAnchors = await anchorRepository.getByChapterId(chapterId);

        // Load enhancements
        const loadedEnhancements = await enhancementRepository.getByChapterId(chapterId);

        // Load media URLs for enhancements
        const enhancementsWithMedia: EnhancementWithMedia[] = await Promise.all(
          loadedEnhancements.map(async (enhancement) => {
            if (enhancement.media_id) {
              const media = await mediaRepository.get(enhancement.media_id);
              return {
                ...enhancement,
                mediaUrl: media?.url || ''
              };
            }
            return {
              ...enhancement,
              mediaUrl: ''
            };
          })
        );

        setChapter(loadedChapter);
        setAnchors(loadedAnchors);
        setEnhancements(enhancementsWithMedia);
        setTitle(loadedChapter.title || '');
        setContent(loadedChapter.text_content || '');
        lastSavedContentRef.current = {
          title: loadedChapter.title || '',
          content: loadedChapter.text_content || ''
        };
      } catch (err) {
        console.error('Failed to load chapter data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chapter');
      } finally {
        setIsLoading(false);
      }
    };

    loadChapterData();
  }, [chapterId]);

  useEffect(() => {
    if (!chapter) return;
    const hasChanges = title !== (chapter.title || '') || content !== (chapter.text_content || '');
    setIsDirty(hasChanges);
  }, [title, content, chapter]);

  // Auto-save functionality
  const performSave = useCallback(async () => {
    if (!isDirty || !chapter) return;

    try {
      setSaveStatus('saving');

      const chapterRepository = new ChapterRepository();
      const updated = await chapterRepository.update(chapter.id, {
        title: title.trim(),
        text_content: content.trim()
      });

      setChapter(updated);
      lastSavedContentRef.current = { title, content };
      setSaveStatus('saved');
      setIsDirty(false);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('unsaved');
    }
  }, [chapter, title, content, isDirty]);

  // Debounced auto-save
  useEffect(() => {
    if (!isDirty) return;

    setSaveStatus('unsaved');

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(() => {
      performSave();
    }, 3000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [title, content, isDirty, performSave]);

  // Manual save handler
  const handleManualSave = async () => {
    if (!isDirty) return;

    setIsSaving(true);
    try {
      await performSave();
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+S or Ctrl+S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
   
  }, [handleManualSave]);

  // Font preference handler
  const handleFontChange = (newFont: FontPreference) => {
    setFontPref(newFont);
    localStorage.setItem('editor-font-preference', newFont);
    setShowFontMenu(false);
  };

  // Enhancement interaction handlers
  const handleRetryEnhancement = async (enhancementId: string) => {
    // TODO: Implement retry logic
    console.log('Retry enhancement:', enhancementId);
  };

  const handleDeleteEnhancement = async (enhancementId: string) => {
    try {
      const enhancementRepository = new EnhancementRepository();
      const anchorRepository = new AnchorRepository();
      const mediaRepository = new MediaRepository();

      // Find the enhancement to get its anchor_id and media_id
      const enhancement = enhancements.find(e => e.id === enhancementId);
      if (!enhancement) {
        console.error('Enhancement not found:', enhancementId);
        return;
      }

      // Delete media file if it exists
      if (enhancement.media_id) {
        await mediaRepository.delete(enhancement.media_id);
      }

      // Delete the enhancement record
      await enhancementRepository.delete(enhancementId);

      // Delete the associated anchor
      await anchorRepository.delete(enhancement.anchor_id);

      // Update local state
      setEnhancements(prev => prev.filter(e => e.id !== enhancementId));
      setAnchors(prev => prev.filter(a => a.id !== enhancement.anchor_id));
    } catch (error) {
      console.error('Failed to delete enhancement:', error);
    }
  };

  const handleParagraphCountChange = async (newCount: number, oldCount: number) => {
    // Only reindex if paragraphs were deleted
    if (newCount >= oldCount) return;

    try {
      const anchorRepository = new AnchorRepository();

      // Get current paragraph count from content
      // const paragraphs = content.split('\n');

      // Update anchors that are now beyond the paragraph count
      const updatedAnchors = await Promise.all(
        anchors.map(async (anchor) => {
          // If anchor is beyond the new paragraph count, move it to the last paragraph
          if (anchor.after_paragraph_index >= newCount) {
            const updated = await anchorRepository.update(anchor.id, {
              after_paragraph_index: Math.max(0, newCount - 1),
            });
            return updated;
          }
          return anchor;
        })
      );

      setAnchors(updatedAnchors);
    } catch (error) {
      console.error('Failed to reindex anchors:', error);
    }
  };

  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

  const fontClass = fontPref === 'serif'
    ? 'font-serif'
    : 'font-sans';

  if (error && !chapter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error || 'Chapter not found'}</p>
          <button onClick={onBack} className="btn-primary">
            Back
          </button>
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground transition-colors p-2"
              aria-label="Back to chapters"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading chapter...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground transition-colors p-2"
              aria-label="Back to chapters"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Save Status (only in edit mode) */}
            {viewMode === 'edit' && (
              <div className="flex items-center gap-2 text-sm">
                {saveStatus === 'saving' && (
                  <span className="text-muted-foreground">Saving...</span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-green-600">Saved</span>
                )}
                {saveStatus === 'unsaved' && (
                  <span className="text-amber-600">Unsaved changes</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <div className="flex bg-secondary rounded-lg p-1">
              <button
                onClick={() => setViewMode('edit')}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  viewMode === 'edit'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Edit
              </button>
              <button
                onClick={() => setViewMode('view')}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  viewMode === 'view'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                View
              </button>
            </div>

            {/* Font Preference */}
            <div className="relative">
              <button
                onClick={() => setShowFontMenu(!showFontMenu)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Font settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>

              {showFontMenu && (
                <div className="absolute right-0 top-10 bg-card border border-border rounded-lg shadow-lg py-2 min-w-[140px] z-10">
                  <button
                    onClick={() => handleFontChange('sans')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors ${
                      fontPref === 'sans' ? 'bg-secondary font-medium' : ''
                    }`}
                  >
                    Sans-serif
                  </button>
                  <button
                    onClick={() => handleFontChange('serif')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors font-serif ${
                      fontPref === 'serif' ? 'bg-secondary font-medium' : ''
                    }`}
                  >
                    Serif
                  </button>
                </div>
              )}
            </div>

            {/* Manual Save Button (only in edit mode) */}
            {viewMode === 'edit' && (
              <button
                onClick={handleManualSave}
                disabled={isSaving || !isDirty}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {viewMode === 'edit' ? (
          <EnhancedTextEditor
            title={title}
            content={content}
            anchors={anchors}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            enhancements={enhancements as any}
            fontClass={fontClass}
            onTitleChange={setTitle}
            onContentChange={setContent}
            onRetryEnhancement={handleRetryEnhancement}
            onDeleteEnhancement={handleDeleteEnhancement}
            onParagraphCountChange={handleParagraphCountChange}
          />
        ) : (
          <EnhancedTextViewer
            title={title}
            content={content}
            anchors={anchors}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            enhancements={enhancements as any}
            fontClass={fontClass}
          />
        )}

        {/* Stats Footer (only in edit mode) */}
        {viewMode === 'edit' && (
          <div className="max-w-[700px] mx-auto">
            <div className="flex items-center justify-between py-4 text-sm text-muted-foreground border-t border-border/50">
              <span>{wordCount} words</span>
              <span className="text-xs">Cmd/Ctrl + S to save</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChapterWorkspace;
