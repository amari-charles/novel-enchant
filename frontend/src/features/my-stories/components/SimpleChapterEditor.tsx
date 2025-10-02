/**
 * Simple Chapter Editor
 * Clean, distraction-free writing experience with auto-save
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Chapter {
  id: string;
  title?: string;
  content?: string;
  order_index: number;
}

interface SimpleChapterEditorProps {
  chapter: Chapter;
  onSave: (chapter: Chapter) => Promise<void>;
  onBack: () => void;
}

type FontPreference = 'sans' | 'serif';

export const SimpleChapterEditor: React.FC<SimpleChapterEditorProps> = ({
  chapter,
  onSave,
  onBack
}) => {
  const [title, setTitle] = useState(chapter.title || '');
  const [content, setContent] = useState(chapter.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [fontPref, setFontPref] = useState<FontPreference>(() => {
    const saved = localStorage.getItem('editor-font-preference');
    return (saved === 'serif' || saved === 'sans') ? saved : 'sans';
  });
  const [showFontMenu, setShowFontMenu] = useState(false);

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastSavedContentRef = useRef({ title: chapter.title || '', content: chapter.content || '' });

  useEffect(() => {
    const hasChanges = title !== (chapter.title || '') || content !== (chapter.content || '');
    setIsDirty(hasChanges);
  }, [title, content, chapter]);

  // Auto-save functionality
  const performSave = useCallback(async () => {
    if (!isDirty) return;

    try {
      setSaveStatus('saving');
      await onSave({
        ...chapter,
        title: title.trim(),
        content: content.trim()
      });
      lastSavedContentRef.current = { title, content };
      setSaveStatus('saved');
      setIsDirty(false);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('unsaved');
    }
  }, [chapter, title, content, isDirty, onSave]);

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

  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

  const fontClass = fontPref === 'serif'
    ? 'font-serif'
    : 'font-sans';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Minimal Header */}
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

            {/* Save Status */}
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
          </div>

          <div className="flex items-center gap-2">
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

            {/* Manual Save Button */}
            <button
              onClick={handleManualSave}
              disabled={isSaving || !isDirty}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Clean Document-like Editor */}
        <div className="max-w-[700px] mx-auto">
          {/* Title */}
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Chapter Title"
            className={`w-full text-3xl font-bold px-0 py-3 border-0 border-b border-transparent hover:border-border focus:border-border focus:outline-none bg-transparent text-foreground placeholder:text-muted-foreground/40 transition-colors ${fontClass}`}
          />

          {/* Content */}
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing your chapter..."
            className={`w-full px-0 py-6 border-0 focus:outline-none bg-transparent text-foreground text-base leading-relaxed placeholder:text-muted-foreground/40 resize-none ${fontClass}`}
            style={{
              minHeight: 'calc(100vh - 300px)',
              lineHeight: '1.75'
            }}
          />

          {/* Stats Footer */}
          <div className="flex items-center justify-between py-4 text-sm text-muted-foreground border-t border-border/50">
            <span>{wordCount} words</span>
            <span className="text-xs">Cmd/Ctrl + S to save</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleChapterEditor;
