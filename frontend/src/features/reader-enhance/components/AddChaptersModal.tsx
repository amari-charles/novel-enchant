/**
 * Add Chapters Modal
 * Interface for adding more chapters to an existing story
 */

import React, { useState, useCallback } from 'react';
import { CHAPTER_LIMITS } from '../config/chapter-limits';
import { Modal } from '../../../shared/ui-components/modal';
import type { EnhancedCopy } from '../types';

export interface ProcessedChapter {
  title: string;
  content: string;
  chapterNumber: number;
}

export interface MultiChapterResult {
  chapters: ProcessedChapter[];
  totalFetched: number;
  errors: string[];
}

interface ShelfCopy extends EnhancedCopy {
  preview_image?: string;
  scene_count?: number;
}

interface AddChaptersModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: ShelfCopy;
  onChaptersAdded: (chapters: MultiChapterResult) => void;
}

export const AddChaptersModal: React.FC<AddChaptersModalProps> = ({
  isOpen,
  onClose,
  story,
  onChaptersAdded,
}) => {
  const [inputMethod, setInputMethod] = useState<'text' | 'file'>('text');
  const [chapterText, setChapterText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentChapterCount = story.content?.chapters?.length || 0;
  const maxNewChapters = CHAPTER_LIMITS.maxChaptersPerStory - currentChapterCount;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const processTextContent = (text: string): ProcessedChapter[] => {
    if (!text.trim()) return [];

    // Simple chapter detection - look for "Chapter X:" patterns
    const chapterPattern = /^(Chapter\s+\d+[:\-.]?.*?)$/gim;
    const matches = [...text.matchAll(chapterPattern)];

    if (matches.length === 0) {
      // No chapter markers found, treat as single chapter
      return [{
        title: `Chapter ${currentChapterCount + 1}`,
        content: text.trim(),
        chapterNumber: currentChapterCount + 1
      }];
    }

    const chapters: ProcessedChapter[] = [];

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const title = match[0].trim();

      // Find content between this chapter and the next
      const startIndex = match.index! + match[0].length;
      const endIndex = matches[i + 1] ? matches[i + 1].index! : text.length;
      const content = text.slice(startIndex, endIndex).trim();

      if (content.length > 50) { // Only include substantial chapters
        chapters.push({
          title,
          content,
          chapterNumber: currentChapterCount + chapters.length + 1
        });
      }
    }

    return chapters;
  };

  const processFile = async (file: File): Promise<ProcessedChapter[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          if (file.name.toLowerCase().endsWith('.txt')) {
            resolve(processTextContent(content));
          } else if (file.name.toLowerCase().endsWith('.epub')) {
            // For now, treat EPUB as text (would need proper EPUB parser)
            setError('EPUB parsing not yet implemented. Please use TXT files or paste text.');
            reject(new Error('EPUB not supported yet'));
          } else {
            reject(new Error('Unsupported file format'));
          }
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleProcessChapters = useCallback(async () => {
    if (inputMethod === 'text' && !chapterText.trim()) {
      setError('Please enter some chapter content');
      return;
    }

    if (inputMethod === 'file' && !selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress({ current: 0, total: 1 });

    try {
      let chapters: ProcessedChapter[] = [];

      if (inputMethod === 'text') {
        chapters = processTextContent(chapterText);
      } else if (inputMethod === 'file' && selectedFile) {
        chapters = await processFile(selectedFile);
      }

      if (chapters.length === 0) {
        setError('No chapters could be processed. Please check your content format.');
        return;
      }

      if (chapters.length > maxNewChapters) {
        setError(`Cannot add more than ${maxNewChapters} chapters to this story`);
        return;
      }

      setProgress({ current: 1, total: 1 });

      const result: MultiChapterResult = {
        chapters,
        totalFetched: chapters.length,
        errors: []
      };

      onChaptersAdded(result);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process chapters');
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  }, [inputMethod, chapterText, selectedFile, maxNewChapters, onChaptersAdded, onClose, currentChapterCount]); // eslint-disable-line react-hooks/exhaustive-deps

  console.log('AddChaptersModal render - isOpen:', isOpen, 'story:', story?.title);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add More Chapters"
      size="lg"
    >
      {/* Story Info */}
      <div className="bg-muted rounded-lg p-4 mb-6">
        <h3 className="font-medium text-foreground mb-1">{story.title}</h3>
        <p className="text-sm text-muted-foreground">
          Current chapters: {currentChapterCount} • Can add up to {maxNewChapters} more
        </p>
      </div>

          {/* Input Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-3">
              How would you like to add chapters?
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center text-foreground">
                <input
                  type="radio"
                  value="text"
                  checked={inputMethod === 'text'}
                  onChange={(e) => setInputMethod(e.target.value as 'text')}
                  className="mr-2"
                  disabled={isLoading}
                />
                Paste text content
              </label>
              <label className="flex items-center text-foreground">
                <input
                  type="radio"
                  value="file"
                  checked={inputMethod === 'file'}
                  onChange={(e) => setInputMethod(e.target.value as 'file')}
                  className="mr-2"
                  disabled={isLoading}
                />
                Upload file (EPUB, TXT)
              </label>
            </div>
          </div>

          {inputMethod === 'text' && (
            <div className="space-y-4">
              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Chapter Content (paste multiple chapters separated by clear breaks)
                </label>
                <textarea
                  value={chapterText}
                  onChange={(e) => setChapterText(e.target.value)}
                  placeholder="Paste your chapter content here...

Chapter 2: The Journey Begins
The sun rose over the mountains...

Chapter 3: Into the Unknown
As they traveled deeper..."
                  rows={12}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm bg-background text-foreground"
                  disabled={isLoading}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Tip: Use clear chapter headings like "Chapter X:" to help with automatic detection.
                Max {maxNewChapters} chapters can be added to this story.
              </p>
            </div>
          )}

          {inputMethod === 'file' && (
            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Upload File
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-border/60 transition-colors">
                  <input
                    type="file"
                    accept=".txt,.epub"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="chapter-file-input"
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="chapter-file-input"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <svg className="w-12 h-12 text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p className="text-sm text-foreground mb-2">
                      {selectedFile ? selectedFile.name : "Click to select file"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports TXT and EPUB files
                    </p>
                  </label>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                EPUB files will be parsed automatically. TXT files should have clear chapter breaks.
                Max {maxNewChapters} chapters can be added to this story.
              </p>
            </div>
          )}

          {/* Progress */}
          {progress && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground">
                  Fetching chapters... ({progress.current}/{progress.total})
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round((progress.current / progress.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-border">
            <button
              onClick={onClose}
              className="px-4 py-2 text-foreground border border-border rounded-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleProcessChapters}
              disabled={isLoading || (inputMethod === 'text' && !chapterText.trim()) || (inputMethod === 'file' && !selectedFile)}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Processing...' : 'Add Chapters'}
            </button>
          </div>
    </Modal>
  );
};

export default AddChaptersModal;