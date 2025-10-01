import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Chapter, AutoSaveResponse, Enhancement } from '../types';
import { ChapterService } from '../services';
import { EnhancementService } from '../services/enhancement-service';
import { getErrorMessage } from '../services/api-client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ChapterEditorProps {
  chapterId: string;
  onSave: (chapter: Chapter) => void;
  onBack: () => void;
  isPublished?: boolean;
}

export const ChapterEditor: React.FC<ChapterEditorProps> = ({
  chapterId,
  onSave,
  onBack,
  isPublished = false,
}) => {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [conflict, setConflict] = useState<AutoSaveResponse['server_version'] | null>(null);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [autoEnhancing, setAutoEnhancing] = useState(false);
  const [enhancements, setEnhancements] = useState<Enhancement[]>([]);
  const [showManualInsert, setShowManualInsert] = useState(false);
  const [manualInsertPosition, setManualInsertPosition] = useState<number>(0);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showEditMode, setShowEditMode] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const originalContentRef = useRef('');
  const originalTitleRef = useRef('');

  // Load chapter data
  useEffect(() => {
    const loadChapter = async () => {
      try {
        setLoading(true);
        setError(null);

        const chapterData = await ChapterService.getChapter(chapterId);
        setChapter(chapterData);
        setTitle(chapterData.title || '');
        setContent(chapterData.content);
        originalTitleRef.current = chapterData.title || '';
        originalContentRef.current = chapterData.content;
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    loadChapter();
  }, [chapterId]);

  // Auto-save functionality
  const performAutoSave = useCallback(async () => {
    if (!chapter || isPublished) return;

    try {
      setAutoSaving(true);

      const response = await ChapterService.autoSave(chapterId, {
        content,
        cursor_position: 0, // Would be actual cursor position in real implementation
        last_save_time: lastSaved || chapter.updated_at,
      });

      if (response.conflict) {
        setConflict(response.server_version || null);
      } else {
        setLastSaved(response.saved_at);
        setIsDirty(false);
        originalContentRef.current = content;
        originalTitleRef.current = title;
      }
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      setAutoSaving(false);
    }
  }, [chapter, chapterId, content, title, lastSaved, isPublished]);

  // Set up auto-save timer
  useEffect(() => {
    if (isDirty && !isPublished) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        performAutoSave();
      }, 5000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [isDirty, performAutoSave, isPublished]);

  // Handle content changes
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setIsDirty(newContent !== originalContentRef.current || title !== originalTitleRef.current);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setIsDirty(content !== originalContentRef.current || newTitle !== originalTitleRef.current);
  };

  // Calculate word count (available for future features)
  // const wordCount = ChapterService.calculateWordCount(content);

  // Calculate reading time (currently unused, but available for future features)
  // const readingTime = ChapterService.calculateReadingTime(wordCount);

  // Handle save
  const handleSave = async () => {
    if (!chapter) return;

    try {
      setSaving(true);

      const updatedChapter = await ChapterService.updateChapter(chapterId, {
        title: title || undefined,
        content,
      });

      setChapter(updatedChapter);
      setIsDirty(false);
      originalContentRef.current = content;
      originalTitleRef.current = title;
      onSave(updatedChapter);
    } catch (err) {
      alert(`Failed to save chapter: ${getErrorMessage(err)}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle back navigation with unsaved changes check
  const handleBack = () => {
    if (isDirty) {
      setShowUnsavedWarning(true);
    } else {
      onBack();
    }
  };

  const handleDiscardChanges = () => {
    setContent(originalContentRef.current);
    setTitle(originalTitleRef.current);
    setIsDirty(false);
    setShowUnsavedWarning(false);
    onBack();
  };

  const handleSaveAndBack = async () => {
    await handleSave();
    setShowUnsavedWarning(false);
    onBack();
  };

  const handleAutoEnhance = async () => {
    if (!chapter || !content.trim()) return;

    try {
      setAutoEnhancing(true);
      console.log('🎨 Auto enhancing chapter:', { chapterId: chapter.id, contentLength: content.length });

      // Use the enhancement service for auto-enhance
      const response = await EnhancementService.autoEnhance({
        chapter_id: chapter.id,
        target_count: Math.floor(content.length / 500) + 1, // ~1 per 500 characters
        style_preferences: ['fantasy', 'detailed', 'atmospheric'],
        character_context: [],
      });

      console.log('✅ Auto enhance job started:', response);

      // For demo purposes, immediately show mock results
      // In real implementation, this would poll for job completion
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockEnhancements: Enhancement[] = generateMockEnhancements(chapter.id, content);
      setEnhancements(mockEnhancements);
      console.log('✅ Auto enhance completed:', mockEnhancements);

    } catch (err) {
      console.error('❌ Auto enhance failed:', err);
      alert(`Failed to enhance chapter: ${getErrorMessage(err)}`);
    } finally {
      setAutoEnhancing(false);
    }
  };

  const handleRetryEnhancement = async (enhancementId: string) => {
    try {
      console.log('🔄 Retrying enhancement:', enhancementId);

      const response = await EnhancementService.retryEnhancement(enhancementId, {
        modify_prompt: false,
      });

      console.log('✅ Retry started:', response);

      // Simulate the new version being ready
      setTimeout(() => {
        setEnhancements(prev => prev.map(enhancement => {
          if (enhancement.id === enhancementId && enhancement.active_version) {
            const newVersion = {
              ...enhancement.active_version,
              id: response.version_id,
              version_number: response.version_number,
              image_url: getRandomImageUrl(),
              thumbnail_url: getRandomImageUrl(200),
              quality_score: Math.random() * 0.3 + 0.7,
              created_at: new Date().toISOString(),
            };

            return {
              ...enhancement,
              active_version: newVersion,
              versions: [...enhancement.versions, newVersion],
            };
          }
          return enhancement;
        }));
      }, 2000);

    } catch (err) {
      console.error('❌ Retry failed:', err);
      alert(`Failed to retry enhancement: ${getErrorMessage(err)}`);
    }
  };

  const handleAcceptEnhancement = async (enhancementId: string) => {
    try {
      console.log('✅ Accepting enhancement:', enhancementId);

      // In a real implementation, this would update the enhancement status
      // For now, we'll just show a visual confirmation
      const enhancement = enhancements.find(e => e.id === enhancementId);
      if (enhancement) {
        console.log('✅ Enhancement accepted:', enhancement.prompt_text);
        // Could show a toast notification here
      }

    } catch (err) {
      console.error('❌ Accept failed:', err);
      alert(`Failed to accept enhancement: ${getErrorMessage(err)}`);
    }
  };

  const handleManualInsert = () => {
    setManualInsertPosition(cursorPosition);
    setShowManualInsert(true);
    setShowContextMenu(false);
  };

  const handleCreateManualEnhancement = async () => {
    if (!chapter || !customPrompt.trim()) return;

    try {
      console.log('🎨 Creating manual enhancement:', { prompt: customPrompt, position: manualInsertPosition });

      const response = await EnhancementService.manualEnhance({
        chapter_id: chapter.id,
        position: manualInsertPosition,
        prompt: customPrompt,
        character_context: [],
        style_preferences: ['detailed', 'atmospheric'],
      });

      console.log('✅ Manual enhancement created:', response);

      // Create mock enhancement
      const newEnhancement: Enhancement = {
        id: `enhancement-manual-${Date.now()}`,
        chapter_id: chapter.id,
        anchor_id: response.anchor_id,
        position_start: manualInsertPosition,
        position_end: manualInsertPosition + 50,
        prompt_text: customPrompt,
        prompt_type: 'manual',
        generation_status: 'completed',
        active_version: {
          id: `version-manual-${Date.now()}`,
          version_number: 1,
          image_url: getRandomImageUrl(),
          thumbnail_url: getRandomImageUrl(200),
          is_active: true,
          quality_score: Math.random() * 0.3 + 0.7,
          created_at: new Date().toISOString(),
        },
        versions: [],
        linked_characters: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setEnhancements(prev => [...prev, newEnhancement]);
      setShowManualInsert(false);
      setCustomPrompt('');

    } catch (err) {
      console.error('❌ Manual enhancement failed:', err);
      alert(`Failed to create enhancement: ${getErrorMessage(err)}`);
    }
  };

  const handleHighlightInsert = async () => {
    if (!textareaRef.current || !chapter) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;

    if (start === end) {
      alert('Please select some text first');
      setShowContextMenu(false);
      return;
    }

    const selectedText = content.substring(start, end);
    setShowContextMenu(false);

    try {
      console.log('🎨 Creating highlight enhancement:', { selectedText, start, end });

      const response = await EnhancementService.highlightEnhance({
        chapter_id: chapter.id,
        position_start: start,
        position_end: end,
        highlighted_text: selectedText,
        enhance_prompt: true,
      });

      console.log('✅ Highlight enhancement created:', response);

      // Create mock enhancement from highlighted text (insert after selection)
      const newEnhancement: Enhancement = {
        id: `enhancement-highlight-${Date.now()}`,
        chapter_id: chapter.id,
        anchor_id: response.anchor_id,
        position_start: end,  // Insert after the selected text
        position_end: end,
        prompt_text: response.final_prompt,
        prompt_type: 'highlight',
        generation_status: 'completed',
        active_version: {
          id: `version-highlight-${Date.now()}`,
          version_number: 1,
          image_url: getRandomImageUrl(),
          thumbnail_url: getRandomImageUrl(200),
          is_active: true,
          quality_score: Math.random() * 0.3 + 0.7,
          created_at: new Date().toISOString(),
        },
        versions: [],
        linked_characters: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setEnhancements(prev => [...prev, newEnhancement]);

    } catch (err) {
      console.error('❌ Highlight enhancement failed:', err);
      alert(`Failed to create enhancement: ${getErrorMessage(err)}`);
    }
  };

  // Helper function to generate mock enhancements
  const generateMockEnhancements = (chapterId: string, content: string): Enhancement[] => {
    const wordCount = content.trim().split(/\s+/).length;
    const numEnhancements = Math.min(4, Math.max(2, Math.floor(wordCount / 250)));

    const mockPrompts = [
      'A magical scene with glowing elements and mystical atmosphere',
      'Epic fantasy action sequence with dramatic lighting',
      'Enchanted forest setting with ancient trees and mysterious fog',
      'Medieval castle courtyard with stone architecture',
    ];

    return Array.from({ length: numEnhancements }, (_, i) => {
      const progress = (i + 1) / (numEnhancements + 1);
      const position = Math.floor(content.length * progress);

      return {
        id: `enhancement-${Date.now()}-${i}`,
        chapter_id: chapterId,
        anchor_id: `anchor-${Date.now()}-${i}`,
        position_start: position,
        position_end: position + 50,
        prompt_text: mockPrompts[i % mockPrompts.length],
        prompt_type: 'auto',
        generation_status: 'completed',
        active_version: {
          id: `version-${Date.now()}-${i}`,
          version_number: 1,
          image_url: getRandomImageUrl(),
          thumbnail_url: getRandomImageUrl(200),
          is_active: true,
          quality_score: Math.random() * 0.3 + 0.7,
          created_at: new Date().toISOString(),
        },
        versions: [],
        linked_characters: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });
  };

  // Helper function for random images
  const getRandomImageUrl = (size: number = 500): string => {
    const imageIds = [
      '1518709268805-4e9042af2176',
      '1578662996442-48f60103fc96',
      '1506905925346-21bea7d5d447',
      '1571019613454-1cb2f99b2d8b',
      '1569163139394-de4dce0e7a4e',
      '1540979388789-6cee28a1cdc9',
    ];

    const randomId = imageIds[Math.floor(Math.random() * imageIds.length)];
    return `https://images.unsplash.com/photo-${randomId}?w=${size}&h=${size}`;
  };

  // Render content with inline images (view mode)
  const renderContentWithInlineImages = () => {
    if (!content) return null;

    // Sort enhancements by position
    const sortedEnhancements = [...enhancements].sort((a, b) => a.position_start - b.position_start);

    const elements: React.ReactElement[] = [];
    let currentPosition = 0;

    // Process content character by character, inserting images at their exact positions
    sortedEnhancements.forEach((enhancement) => {
      // Add text content before this enhancement
      if (currentPosition < enhancement.position_start) {
        const textBeforeEnhancement = content.slice(currentPosition, enhancement.position_start);

        if (textBeforeEnhancement.trim()) {
          // Split into paragraphs and render
          const paragraphs = textBeforeEnhancement.split('\n\n').filter(p => p.trim());

          paragraphs.forEach((paragraph, paragraphIndex) => {
            elements.push(
              <div key={`text-${currentPosition}-${paragraphIndex}`}>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {paragraph}
                </p>
              </div>
            );
          });
        }
      }

      // Add the enhancement image (no border in view mode)
      if (enhancement.active_version?.image_url) {
        elements.push(
          <div key={`enhancement-${enhancement.id}`} className="my-8">
            <img
              src={enhancement.active_version.image_url}
              alt=""
              className="w-full h-64 object-cover rounded-lg shadow-lg"
            />
          </div>
        );
      }

      currentPosition = Math.max(currentPosition, enhancement.position_start);
    });

    // Add any remaining text after the last enhancement
    if (currentPosition < content.length) {
      const remainingText = content.slice(currentPosition);

      if (remainingText.trim()) {
        const paragraphs = remainingText.split('\n\n').filter(p => p.trim());

        paragraphs.forEach((paragraph, paragraphIndex) => {
          elements.push(
            <div key={`text-remaining-${paragraphIndex}`}>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {paragraph}
              </p>
            </div>
          );
        });
      }
    }

    return (
      <div className="space-y-4">
        {elements}
      </div>
    );
  };

  // Render content with inline images (edit mode with controls)
  const renderContentWithInlineImagesEditMode = () => {
    if (!content) return null;

    // Sort enhancements by position
    const sortedEnhancements = [...enhancements].sort((a, b) => a.position_start - b.position_start);

    const elements: React.ReactElement[] = [];
    let currentPosition = 0;

    // Process content character by character, inserting images at their exact positions
    sortedEnhancements.forEach((enhancement) => {
      // Add text content before this enhancement
      if (currentPosition < enhancement.position_start) {
        const textBeforeEnhancement = content.slice(currentPosition, enhancement.position_start);

        if (textBeforeEnhancement.trim()) {
          // Split into paragraphs and render
          const paragraphs = textBeforeEnhancement.split('\n\n').filter(p => p.trim());

          paragraphs.forEach((paragraph, paragraphIndex) => {
            elements.push(
              <div key={`text-${currentPosition}-${paragraphIndex}`} className="relative group">
                <div className="border border-dashed border-transparent group-hover:border-border rounded p-2 -m-2">
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {paragraph}
                  </p>
                </div>
              </div>
            );
          });
        }
      }

      // Add the enhancement image
      if (enhancement.active_version?.image_url) {
        elements.push(
          <div key={`enhancement-${enhancement.id}`} className="my-8">
            <div className="bg-card rounded-lg border border-border p-4">
              <img
                src={enhancement.active_version.image_url}
                alt={enhancement.prompt_text}
                className="w-full h-64 object-cover rounded-lg mb-3"
              />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    "{enhancement.prompt_text}"
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Quality: {Math.round((enhancement.active_version.quality_score || 0) * 100)}% • Position: {enhancement.position_start}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRetryEnhancement(enhancement.id)}
                    className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-xs hover:bg-secondary/80 border border-border"
                  >
                    🔄 Retry
                  </button>
                  <button
                    onClick={() => handleAcceptEnhancement(enhancement.id)}
                    className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90"
                  >
                    ✅ Accept
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      currentPosition = Math.max(currentPosition, enhancement.position_start);
    });

    // Add any remaining text after the last enhancement
    if (currentPosition < content.length) {
      const remainingText = content.slice(currentPosition);

      if (remainingText.trim()) {
        const paragraphs = remainingText.split('\n\n').filter(p => p.trim());

        paragraphs.forEach((paragraph, paragraphIndex) => {
          elements.push(
            <div key={`text-remaining-${paragraphIndex}`} className="relative group">
              <div className="border border-dashed border-transparent group-hover:border-border rounded p-2 -m-2">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {paragraph}
                </p>
              </div>
            </div>
          );
        });
      }
    }

    return (
      <div className="min-h-[24rem] border border-border rounded-lg p-4 bg-background">
        <div className="space-y-4">
          {elements}
        </div>

        {/* Edit Controls */}
        <div className="mt-6 pt-4 border-t border-border">
          <button
            onClick={() => {
              const textarea = document.createElement('textarea');
              textarea.value = content;
              textarea.style.position = 'fixed';
              textarea.style.opacity = '0';
              document.body.appendChild(textarea);
              textarea.focus();
              textarea.select();
              document.body.removeChild(textarea);
              // This would open a proper text editor in a real implementation
              alert('Click on any paragraph to edit that section (feature coming soon)');
            }}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Text Content
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chapter...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
        <h3 className="text-destructive font-semibold mb-2">Failed to load chapter</h3>
        <p className="text-destructive/80">{error}</p>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Chapter not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 text-muted-foreground hover:text-foreground"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-foreground">
            Chapter {chapter.order_index + 1}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Save status */}
          <div className="text-sm text-muted-foreground">
            {autoSaving && <span>Saving...</span>}
            {lastSaved && !autoSaving && (
              <span>Last saved: {new Date(lastSaved).toLocaleTimeString()}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {showEditMode && (
              <div className="text-sm text-muted-foreground">
                💡 Right-click in text to insert images
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !isDirty || isPublished}
              className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-50 font-medium"
            >
              {saving ? 'Saving...' : 'Save Chapter'}
            </button>
          </div>
        </div>
      </div>

      {/* Published notice */}
      {isPublished && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6">
          <p className="text-warning">
            📚 This chapter is from a published work and cannot be edited.
          </p>
        </div>
      )}

      {/* Conflict warning */}
      {conflict && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
          <h3 className="text-destructive font-semibold mb-2">Conflict detected</h3>
          <p className="text-destructive/80 mb-4">
            Someone else has modified this chapter. Please resolve the conflict before continuing.
          </p>
          <button
            onClick={() => setConflict(null)}
            className="bg-destructive text-destructive-foreground px-4 py-2 rounded hover:bg-destructive/90 text-sm"
          >
            Resolve Conflict
          </button>
        </div>
      )}

      {/* Editor */}
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <div className="p-6">
          {/* Title input */}
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Chapter title (optional)"
            disabled={isPublished}
            className="w-full text-xl font-semibold border-none outline-none placeholder-muted-foreground mb-4 disabled:bg-muted text-foreground bg-transparent"
            aria-label="Chapter title"
          />

          {/* View/Edit Mode Toggle */}
          {content && (
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => setShowEditMode(!showEditMode)}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 font-medium border border-border transition-colors"
              >
                {showEditMode ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Switch to View
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Switch to Edit
                  </>
                )}
              </button>
              <span className="text-xs text-muted-foreground">
                {enhancements.length} enhancement{enhancements.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Content with inline enhancements */}
          <div className="space-y-6">
            {/* Toggle between view and edit mode */}
            {showEditMode || !content ? (
              content && enhancements.length > 0 ? renderContentWithInlineImagesEditMode() : (
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setCursorPosition(e.currentTarget.selectionStart);
                      setContextMenuPosition({ x: e.clientX, y: e.clientY });
                      setShowContextMenu(true);
                    }}
                    onSelect={(e) => {
                      setCursorPosition(e.currentTarget.selectionStart);
                    }}
                    onClick={() => setShowContextMenu(false)}
                    placeholder="Write your chapter content here..."
                    disabled={isPublished}
                    className="w-full h-96 border border-border rounded-lg p-4 text-foreground placeholder-muted-foreground resize-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-muted bg-background"
                    aria-label="Chapter content"
                  />

                  {/* Context Menu */}
                  {showContextMenu && (
                    <div
                      className="fixed z-50 bg-card border border-border rounded-lg shadow-lg py-2 min-w-[200px]"
                      style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
                      onMouseLeave={() => setShowContextMenu(false)}
                    >
                      <button
                        onClick={handleAutoEnhance}
                        disabled={autoEnhancing}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                      >
                        <span>✨</span>
                        <span>Auto Enhance All</span>
                      </button>
                      <div className="border-t border-border my-1" />
                      <button
                        onClick={handleManualInsert}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                      >
                        <span>📍</span>
                        <span>Insert Image Here</span>
                      </button>
                      <button
                        onClick={handleHighlightInsert}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                      >
                        <span>🎯</span>
                        <span>Create from Selection</span>
                      </button>
                    </div>
                  )}
                </div>
              )
            ) : (
              renderContentWithInlineImages()
            )}
          </div>

          {/* Save status */}
          <div className="flex items-center justify-end mt-4 text-sm text-muted-foreground">
            {isDirty && (
              <span className="text-warning">● Unsaved changes</span>
            )}
          </div>
        </div>
      </div>


      {/* Manual Insert Modal */}
      <Dialog open={showManualInsert} onOpenChange={setShowManualInsert}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manual Image Insert</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-muted-foreground mb-4">
              Create a custom image at position {manualInsertPosition} in your chapter.
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="custom-prompt" className="block text-sm font-medium text-foreground mb-2">
                  Image Description
                </label>
                <textarea
                  id="custom-prompt"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Describe the scene you want to visualize..."
                  className="w-full h-24 border border-border rounded-lg p-3 text-foreground placeholder-muted-foreground resize-none focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                />
              </div>

              <div className="text-xs text-muted-foreground">
                <p>💡 Tips for better results:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Be specific about setting, mood, and characters</li>
                  <li>Include lighting and atmosphere details</li>
                  <li>Mention art style preferences (realistic, fantasy, etc.)</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => {
                  setShowManualInsert(false);
                  setCustomPrompt('');
                }}
                className="flex-1 border border-border text-secondary-foreground px-4 py-2 rounded hover:bg-secondary bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateManualEnhancement}
                disabled={!customPrompt.trim()}
                className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-50"
              >
                Create Image
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unsaved changes warning modal */}
      <Dialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-muted-foreground mb-6">
              You have unsaved changes. What would you like to do?
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDiscardChanges}
                className="flex-1 border border-border text-secondary-foreground px-4 py-2 rounded hover:bg-secondary bg-secondary"
              >
                Discard Changes
              </button>
              <button
                onClick={handleSaveAndBack}
                className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
              >
                Save First
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};