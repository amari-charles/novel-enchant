/**
 * Reading View Component
 * Immersive reading experience with images integrated into the story
 */

import React, { useState, useEffect } from 'react';
import type { EnhancedCopy, ScenePreview, Chapter } from '../types';

interface ReadingViewProps {
  copy: EnhancedCopy;
  onBack?: () => void;
}

export const ReadingView: React.FC<ReadingViewProps> = ({ copy, onBack }) => {
  const [currentChapterIndex, setCurrentChapterIndex] = useState((copy as EnhancedCopy & { initialChapterIndex?: number }).initialChapterIndex || 0);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');

  const chapters = copy.content.chapters || [];
  const currentChapter = chapters[currentChapterIndex];

  // Reset chapter index when copy changes or when initialChapterIndex is provided
  useEffect(() => {
    const initialIndex = (copy as EnhancedCopy & { initialChapterIndex?: number }).initialChapterIndex;
    if (typeof initialIndex === 'number' && initialIndex !== currentChapterIndex) {
      setCurrentChapterIndex(initialIndex);
    }
  }, [copy, currentChapterIndex]);

  const fontSizeClasses = {
    small: 'text-sm leading-relaxed',
    medium: 'text-base leading-relaxed',
    large: 'text-lg leading-relaxed',
  };

  const themeClasses = {
    light: 'bg-background text-foreground',
    dark: 'bg-background text-foreground',
    sepia: 'bg-amber-50 text-amber-900',
  };


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentChapterIndex > 0) {
        setCurrentChapterIndex(currentChapterIndex - 1);
      } else if (e.key === 'ArrowRight' && currentChapterIndex < chapters.length - 1) {
        setCurrentChapterIndex(currentChapterIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentChapterIndex, chapters.length]);

  const renderChapterContent = (chapter: Chapter) => {
    // Use the full chapter content if available, otherwise fall back to combining scene excerpts
    const fullText = chapter.content ||
      (chapter.scenes && chapter.scenes.length > 0
        ? chapter.scenes.map((scene: ScenePreview) => scene.excerpt).join('\n\n')
        : '');

    if (!fullText) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No content available for this chapter</p>
        </div>
      );
    }

    // Split text into paragraphs for natural image insertion
    const paragraphs = fullText.split('\n\n').filter((p: string) => p.trim().length > 0);

    // Get images (for demo, treat all generated images as ready to show)
    const acceptedImages = (chapter.scenes || [])
      .filter((scene: ScenePreview) => scene.image_url && (scene.status === 'accepted' || scene.status === 'generated'))
      .map((scene: ScenePreview) => ({
        url: scene.image_url,
        alt: scene.excerpt.substring(0, 100) + '...'
      }));

    // Determine where to place images (roughly evenly distributed)
    const imagePositions: number[] = [];
    if (acceptedImages.length > 0 && paragraphs.length > 1) {
      const interval = Math.floor(paragraphs.length / (acceptedImages.length + 1));
      for (let i = 0; i < acceptedImages.length; i++) {
        const position = interval * (i + 1) + i; // Account for inserted images
        imagePositions.push(Math.min(position, paragraphs.length - 1));
      }
    }

    // Render content with images naturally inserted
    const elements: React.ReactElement[] = [];
    let imageIndex = 0;

    paragraphs.forEach((paragraph: string, index: number) => {
      // Add paragraph
      elements.push(
        <p key={`p-${index}`} className="mb-6 leading-relaxed">
          {paragraph}
        </p>
      );

      // Add image if this is an image position
      if (imagePositions.includes(index) && imageIndex < acceptedImages.length) {
        const image = acceptedImages[imageIndex];
        elements.push(
          <div key={`img-${imageIndex}`} className="my-8 -mx-4 sm:mx-0">
            <div className="relative rounded-lg overflow-hidden shadow-xl">
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-64 sm:h-80 lg:h-96 object-cover"
                onError={(e) => {
                  // Hide expired/broken images
                  const target = e.target as HTMLImageElement;
                  target.parentElement!.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            </div>
          </div>
        );
        imageIndex++;
      }
    });

    return (
      <div className={`prose prose-lg max-w-none ${fontSizeClasses[fontSize]}`}>
        <div className="space-y-0">
          {elements}
        </div>
      </div>
    );
  };

  if (!currentChapter) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No content available</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${themeClasses[theme]}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border backdrop-blur-sm bg-card/90">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back button and title */}
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                  aria-label="Go back"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div>
                <h1 className="font-semibold text-lg">{copy.title}</h1>
                {currentChapter.title && (
                  <p className="text-sm text-muted-foreground">
                    {currentChapter.title}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Settings */}
            <div className="flex items-center space-x-2">
              {/* Font Size */}
              <div className="flex items-center space-x-1 p-1 rounded-lg bg-muted">
                <button
                  onClick={() => setFontSize('small')}
                  className={`px-2 py-1 text-xs rounded ${
                    fontSize === 'small'
                      ? 'bg-card shadow-sm'
                      : 'hover:bg-background'
                  }`}
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize('medium')}
                  className={`px-2 py-1 text-sm rounded ${
                    fontSize === 'medium'
                      ? 'bg-white dark:bg-gray-700 shadow-sm'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize('large')}
                  className={`px-2 py-1 text-base rounded ${
                    fontSize === 'large'
                      ? 'bg-white dark:bg-gray-700 shadow-sm'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  A
                </button>
              </div>

              {/* Theme */}
              <div className="flex items-center space-x-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-2 rounded ${
                    theme === 'light'
                      ? 'bg-white shadow-sm'
                      : 'hover:bg-gray-200'
                  }`}
                  aria-label="Light theme"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-2 rounded ${
                    theme === 'dark'
                      ? 'bg-gray-700 shadow-sm text-gray-100'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  aria-label="Dark theme"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setTheme('sepia')}
                  className={`p-2 rounded ${
                    theme === 'sepia'
                      ? 'bg-amber-100 text-amber-800 shadow-sm'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  aria-label="Sepia theme"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chapter Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Chapter Title */}
        {currentChapter.title && (
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{currentChapter.title}</h2>
          </div>
        )}

        {/* Chapter Content with Seamlessly Integrated Images */}
        {renderChapterContent(currentChapter)}

        {/* Chapter Navigation */}
        <div className="flex items-center justify-between mt-16 pt-8 border-t">
          <button
            onClick={() => setCurrentChapterIndex(currentChapterIndex - 1)}
            disabled={currentChapterIndex === 0}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Previous Chapter</span>
          </button>

          {/* Chapter Indicator */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Chapter {currentChapterIndex + 1} of {chapters.length}
          </div>

          <button
            onClick={() => setCurrentChapterIndex(currentChapterIndex + 1)}
            disabled={currentChapterIndex === chapters.length - 1}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>Next Chapter</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Reading Instructions */}
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400">
          <p className="text-center">
            Use keyboard arrows (← →) or the buttons above to navigate between chapters
          </p>
        </div>
      </main>
    </div>
  );
};

export default ReadingView;