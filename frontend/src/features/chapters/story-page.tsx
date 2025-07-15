import React, { useState, useEffect } from 'react'
import { Button, Card, CardContent, CardHeader } from '../../shared/ui-components'
import { ChapterListItem } from './chapter-list-item'
import { UploadChapterFormComponent } from './upload-chapter-form'
import type { Story, Chapter, UploadChapterForm } from '../../shared/type-definitions'

interface StoryPageProps {
  storyId: string
  onBackToHome: () => void
  onChapterClick: (chapterId: string) => void
  onCharactersClick: () => void
  onAddChapterClick: () => void
  onSettingsClick: () => void
}

// Mock data for development
const mockStory: Story = {
  id: '1',
  title: 'The Dragon\'s Crown',
  description: 'An epic fantasy tale of a young mage discovering their true power in a world where dragons once ruled.',
  genre: 'Epic Fantasy',
  style_preset: 'fantasy',
  total_chapters: 3,
  total_scenes: 12,
  completed_chapters: 2,
  reading_progress: 67,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-20T15:30:00Z'
}

const mockChapters: Chapter[] = [
  {
    id: '1',
    story_id: '1',
    chapter_number: 1,
    title: 'The Awakening',
    content: 'The young mage discovers their power...',
    word_count: 2847,
    processing_status: 'completed',
    scenes_extracted: true,
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    story_id: '1',
    chapter_number: 2,
    title: 'The First Trial',
    content: 'Facing the ancient guardian...',
    word_count: 3156,
    processing_status: 'processing',
    scenes_extracted: false,
    created_at: '2024-01-18T14:20:00Z'
  },
  {
    id: '3',
    story_id: '1',
    chapter_number: 3,
    title: 'Shadows of the Past',
    content: 'Uncovering dark secrets...',
    word_count: 2923,
    processing_status: 'failed',
    scenes_extracted: false,
    created_at: '2024-01-20T09:15:00Z'
  }
]

export function StoryPage({ storyId, onBackToHome, onChapterClick, onCharactersClick, onAddChapterClick, onSettingsClick }: StoryPageProps) {
  const [story, setStory] = useState<Story | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStoryData = async () => {
      setIsLoading(true)
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 800))
      setStory(mockStory)
      setChapters(mockChapters)
      setIsLoading(false)
    }
    
    loadStoryData()
  }, [storyId])


  const handleViewChapter = (chapter: Chapter) => {
    onChapterClick(chapter.id)
  }

  const handleDeleteChapter = (chapter: Chapter) => {
    if (window.confirm(`Are you sure you want to delete "${chapter.title}"?`)) {
      setChapters(prev => prev.filter(ch => ch.id !== chapter.id))
    }
  }

  const getProcessingStats = () => {
    const completed = chapters.filter(ch => ch.processing_status === 'completed').length
    const processing = chapters.filter(ch => ch.processing_status === 'processing').length
    const failed = chapters.filter(ch => ch.processing_status === 'failed').length
    
    return { completed, processing, failed, total: chapters.length }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading story...</p>
        </div>
      </div>
    )
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Story not found</p>
        </div>
      </div>
    )
  }

  const stats = getProcessingStats()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Story Header */}
        <div className="mb-8">
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <button onClick={onBackToHome} className="hover:text-gray-700">← Back to Stories</button>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{story.title}</h1>
              {story.description && (
                <p className="text-gray-600 max-w-2xl">{story.description}</p>
              )}
              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                <span className="capitalize">{story.style_preset}</span>
                {story.genre && (
                  <>
                    <span>•</span>
                    <span>{story.genre}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onCharactersClick}>
                Character Roster
              </Button>
              <Button variant="outline" onClick={onSettingsClick}>
                Settings
              </Button>
              <Button onClick={onAddChapterClick}>
                Add Chapter
              </Button>
            </div>
          </div>
        </div>

        {/* Processing Stats */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Processing Status</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-500">Total Chapters</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.processing}</div>
                <div className="text-sm text-gray-500">Processing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <div className="text-sm text-gray-500">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chapters List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Chapters</h2>
          
          {chapters.length === 0 ? (
            <div className="flex justify-center">
              <Card className="max-w-lg w-full">
                <CardContent className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No chapters yet</h3>
                  <p className="text-gray-600 mb-6">
                    Upload your first chapter to start generating visual scenes
                  </p>
                  <Button onClick={onAddChapterClick}>
                    Add First Chapter
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              {chapters.map((chapter) => (
                <ChapterListItem
                  key={chapter.id}
                  chapter={chapter}
                  onView={() => handleViewChapter(chapter)}
                  onDelete={() => handleDeleteChapter(chapter)}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}