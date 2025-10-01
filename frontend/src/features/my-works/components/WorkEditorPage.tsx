import React, { useState, useEffect } from 'react';
import type { Work, Chapter } from '../types';
import { WorkService, ChapterService } from '../services';
import { getErrorMessage } from '../services/api-client';
import { ChapterEditor } from './ChapterEditor';

interface WorkEditorPageProps {
  workId: string;
  onBack: () => void;
}

type EditorView = 'overview' | 'chapter' | 'characters' | 'enhancements' | 'settings' | 'reading';

export const WorkEditorPage: React.FC<WorkEditorPageProps> = ({ workId, onBack }) => {
  const [work, setWork] = useState<Work | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<EditorView>('overview');
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  // Load work and chapters
  useEffect(() => {
    const loadWorkData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [workData, chaptersData] = await Promise.all([
          WorkService.getWork(workId),
          ChapterService.listChapters(workId),
        ]);

        setWork(workData);
        setChapters(chaptersData.chapters);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    loadWorkData();
  }, [workId]);

  const handleChapterSelect = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setCurrentView('chapter');
  };

  const handleReadWork = () => {
    setCurrentView('reading');
  };

  const handleChapterSave = (updatedChapter: Chapter) => {
    setChapters(prev =>
      prev.map(chapter =>
        chapter.id === updatedChapter.id ? updatedChapter : chapter
      )
    );
    setCurrentView('overview');
  };

  const handleCreateChapter = async () => {
    if (!work) return;

    try {
      const chapterCount = chapters ? chapters.length : 0;
      const newChapter = await ChapterService.createChapter(workId, {
        content: '',
        order_index: chapterCount,
        title: `Chapter ${chapterCount + 1}`,
      });

      setChapters(prev => prev ? [...prev, newChapter] : [newChapter]);
      setSelectedChapterId(newChapter.id);
      setCurrentView('chapter');
    } catch (err) {
      alert(`Failed to create chapter: ${getErrorMessage(err)}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading work...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
        <h3 className="text-destructive font-semibold mb-2">Failed to load work</h3>
        <p className="text-destructive/80 mb-4">{error}</p>
        <button
          onClick={onBack}
          className="bg-destructive text-destructive-foreground px-4 py-2 rounded hover:bg-destructive/90"
        >
          Back to Works
        </button>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Work not found</p>
        <button
          onClick={onBack}
          className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
        >
          Back to Works
        </button>
      </div>
    );
  }

  // Render chapter editor
  if (currentView === 'chapter' && selectedChapterId) {
    return (
      <ChapterEditor
        chapterId={selectedChapterId}
        onSave={handleChapterSave}
        onBack={() => setCurrentView('overview')}
        isPublished={work.publication_status === 'published'}
      />
    );
  }

  // Render reading view
  if (currentView === 'reading') {
    return (
      <div className="min-h-screen bg-background">
        {/* Reading Header */}
        <div className="bg-card border-b border-border">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentView('overview')}
                  className="p-2 text-muted-foreground hover:text-foreground"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-xl font-bold text-foreground">{work.title}</h1>
                  <p className="text-sm text-muted-foreground">Reading Mode</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reading Content */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          {chapters && chapters.length > 0 ? (
            <div className="space-y-12">
              {selectedChapterId ? (
                // Show single chapter if one was selected
                chapters
                  .filter(chapter => chapter.id === selectedChapterId)
                  .map((chapter) => {
                    const chapterIndex = chapters.findIndex(c => c.id === chapter.id);
                    return (
                      <div key={chapter.id} className="space-y-6">
                        <div className="border-b border-border pb-4 flex items-center justify-between">
                          <h2 className="text-2xl font-bold text-foreground">
                            Chapter {chapterIndex + 1}
                            {chapter.title && `: ${chapter.title}`}
                          </h2>
                          <button
                            onClick={() => setSelectedChapterId(null)}
                            className="text-sm text-muted-foreground hover:text-foreground"
                          >
                            View All Chapters
                          </button>
                        </div>
                        <div className="prose prose-lg max-w-none">
                          <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                            {chapter.content}
                          </div>
                        </div>

                        {/* Chapter Navigation */}
                        <div className="flex items-center justify-between pt-8 border-t border-border">
                          <button
                            onClick={() => {
                              const currentIndex = chapters.findIndex(c => c.id === selectedChapterId);
                              if (currentIndex > 0) {
                                setSelectedChapterId(chapters[currentIndex - 1].id);
                              }
                            }}
                            disabled={chapters.findIndex(c => c.id === selectedChapterId) === 0}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
                          >
                            ← Previous Chapter
                          </button>
                          <button
                            onClick={() => {
                              const currentIndex = chapters.findIndex(c => c.id === selectedChapterId);
                              if (currentIndex < chapters.length - 1) {
                                setSelectedChapterId(chapters[currentIndex + 1].id);
                              }
                            }}
                            disabled={chapters.findIndex(c => c.id === selectedChapterId) === chapters.length - 1}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
                          >
                            Next Chapter →
                          </button>
                        </div>
                      </div>
                    );
                  })
              ) : (
                // Show all chapters
                chapters.map((chapter, index) => (
                  <div key={chapter.id} className="space-y-6">
                    <div className="border-b border-border pb-4">
                      <h2 className="text-2xl font-bold text-foreground">
                        Chapter {index + 1}
                        {chapter.title && `: ${chapter.title}`}
                      </h2>
                    </div>
                    <div className="prose prose-lg max-w-none">
                      <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                        {chapter.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No chapters available to read</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-muted-foreground hover:text-foreground"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{work.title}</h1>
            <p className="text-muted-foreground mt-1">{work.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleReadWork}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 font-medium border border-border"
          >
            📖 Read Work
          </button>
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full ${
              work.publication_status === 'published'
                ? 'bg-success/10 text-success'
                : 'bg-warning/10 text-warning'
            }`}
          >
            {work.publication_status === 'published' ? 'Published' : 'Draft'}
          </span>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="border-b border-border mb-8">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'characters', label: 'Characters' },
            { id: 'enhancements', label: 'Enhancements' },
            { id: 'settings', label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id as EditorView)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                currentView === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview content */}
      {currentView === 'overview' && (
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Chapters</h3>
              <p className="mt-2 text-3xl font-bold text-foreground">{work.chapter_count}</p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Words</h3>
              <p className="mt-2 text-3xl font-bold text-foreground">{work.word_count.toLocaleString()}</p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Enhancements</h3>
              <p className="mt-2 text-3xl font-bold text-foreground">{work.enhancement_count}</p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Characters</h3>
              <p className="mt-2 text-3xl font-bold text-foreground">{work.character_count}</p>
            </div>
          </div>

          {/* Chapters */}
          <div className="bg-card rounded-lg shadow-sm border border-border">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Chapters</h2>
              <button
                onClick={handleCreateChapter}
                className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 text-sm font-medium"
              >
                Add Chapter
              </button>
            </div>

            {chapters && chapters.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground mb-4">No chapters yet</p>
                <button
                  onClick={handleCreateChapter}
                  className="bg-primary text-primary-foreground px-6 py-3 rounded hover:bg-primary/90 font-medium"
                >
                  Create First Chapter
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {chapters && chapters.map((chapter, index) => (
                  <div
                    key={chapter.id}
                    className="p-6 hover:bg-muted cursor-pointer"
                    onClick={() => handleChapterSelect(chapter.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">
                          Chapter {index + 1}
                          {chapter.title && `: ${chapter.title}`}
                        </h3>
                        <div className="mt-1 text-sm text-muted-foreground">
                          Updated {new Date(chapter.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedChapterId(chapter.id);
                            setCurrentView('reading');
                          }}
                          className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 border border-border"
                        >
                          📖 Read
                        </button>
                        <svg
                          className="w-5 h-5 text-muted-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Other views placeholders */}
      {currentView === 'characters' && (
        <div className="bg-card rounded-lg shadow-sm border border-border p-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Character Management</h2>
          <p className="text-muted-foreground">Character management interface coming soon...</p>
        </div>
      )}

      {currentView === 'enhancements' && (
        <div className="bg-card rounded-lg shadow-sm border border-border p-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Enhancement Gallery</h2>
          <p className="text-muted-foreground">Enhancement management interface coming soon...</p>
        </div>
      )}

      {currentView === 'settings' && (
        <div className="bg-card rounded-lg shadow-sm border border-border p-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Work Settings</h2>
          <p className="text-muted-foreground">Settings interface coming soon...</p>
        </div>
      )}
    </div>
  );
};