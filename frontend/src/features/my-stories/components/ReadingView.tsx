/**
 * Reading View Component
 * Clean reading experience for viewing stories with enhanced scenes
 */

import React, { useState } from 'react';

interface Story {
  id: string;
  title: string;
  chapters: Chapter[];
}

interface Chapter {
  id: string;
  title?: string;
  content?: string;
  scenes?: Scene[];
}

interface Scene {
  id: string;
  excerpt: string;
  image_url?: string;
  status: string;
}

interface ReadingViewProps {
  story: Story;
  onBack: () => void;
}

export const ReadingView: React.FC<ReadingViewProps> = ({
  story,
  onBack
}) => {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const currentChapter = story.chapters[currentChapterIndex];

  if (!currentChapter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">No chapters available</h2>
          <button onClick={onBack} className="btn-primary">
            Back to Stories
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="btn-ghost btn-sm"
            aria-label="Back to stories"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h1 className="text-2xl font-bold text-foreground">{story.title}</h1>

          {/* Chapter Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentChapterIndex(Math.max(0, currentChapterIndex - 1))}
              disabled={currentChapterIndex === 0}
              className="btn-ghost btn-sm"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              {currentChapterIndex + 1} / {story.chapters.length}
            </span>
            <button
              onClick={() => setCurrentChapterIndex(Math.min(story.chapters.length - 1, currentChapterIndex + 1))}
              disabled={currentChapterIndex === story.chapters.length - 1}
              className="btn-ghost btn-sm"
            >
              Next
            </button>
          </div>
        </div>

        {/* Chapter Title */}
        <h2 className="text-3xl font-bold text-foreground mb-6">
          {currentChapter.title || `Chapter ${currentChapterIndex + 1}`}
        </h2>

        {/* Chapter Content */}
        {currentChapter.content && (
          <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
            <p className="whitespace-pre-wrap">{currentChapter.content}</p>
          </div>
        )}

        {/* Enhanced Scenes */}
        {currentChapter.scenes && currentChapter.scenes.length > 0 && (
          <div className="mt-12 space-y-8">
            <h3 className="text-2xl font-semibold text-foreground mb-4">Enhanced Scenes</h3>
            {currentChapter.scenes.map((scene) => (
              <div key={scene.id} className="bg-card rounded-lg border border-border p-6">
                {scene.image_url && (
                  <img
                    src={scene.image_url}
                    alt="Scene illustration"
                    className="w-full rounded-lg mb-4"
                  />
                )}
                <p className="text-foreground italic">{scene.excerpt}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingView;