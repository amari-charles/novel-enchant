import { useState, useEffect } from 'react'
import { Button, Card, CardContent } from '../../shared/ui-components'
import { ChapterListItem } from './chapter-list-item'
import type { Story, Chapter } from '../../shared/type-definitions'

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
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  })
  const [errors, setErrors] = useState<{title?: string, content?: string}>({})
  const [deletingChapter, setDeletingChapter] = useState<Chapter | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    // In a real app, this would be an API call
    setStory(mockStory)
    setChapters(mockChapters)
  }, [storyId])


  const handleViewChapter = (chapter: Chapter) => {
    onChapterClick(chapter.id)
  }

  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter)
    setFormData({
      title: chapter.title,
      content: chapter.content
    })
    setIsEditing(true)
  }

  const handleSaveChapter = async () => {
    const newErrors: {title?: string, content?: string} = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      setIsSaving(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (editingChapter) {
        const updatedChapter = {
          ...editingChapter,
          title: formData.title.trim(),
          content: formData.content.trim(),
          word_count: formData.content.trim().split(/\s+/).length
        }
        
        setChapters(prev => prev.map(ch => 
          ch.id === editingChapter.id ? updatedChapter : ch
        ))
        
        setIsEditing(false)
        setEditingChapter(null)
        setFormData({ title: '', content: '' })
        setErrors({})
        console.log('Chapter updated successfully:', updatedChapter)
      }
    } catch (error) {
      console.error('Failed to update chapter:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingChapter(null)
    setFormData({ title: '', content: '' })
    setErrors({})
  }

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleDeleteChapter = (chapter: Chapter) => {
    setDeletingChapter(chapter)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteChapter = async () => {
    if (!deletingChapter) return

    try {
      setIsDeleting(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setChapters(prev => prev.filter(ch => ch.id !== deletingChapter.id))
      setShowDeleteConfirm(false)
      setDeletingChapter(null)
      console.log('Chapter deleted successfully:', deletingChapter.title)
    } catch (error) {
      console.error('Failed to delete chapter:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDeleteChapter = () => {
    setShowDeleteConfirm(false)
    setDeletingChapter(null)
  }


  // Processing stats function removed since processing status section was removed

  if (!story) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Story not found</p>
        </div>
      </div>
    )
  }

  // Stats calculation removed since processing status section was removed

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Story Header */}
        <div className="mb-8">
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <button onClick={onBackToHome} className="hover:text-foreground transition-colors">← Back to Stories</button>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{story.title}</h1>
              {story.description && (
                <p className="text-muted-foreground max-w-2xl">{story.description}</p>
              )}
              <div className="flex items-center space-x-4 mt-3 text-sm text-muted-foreground">
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
            </div>
          </div>
        </div>


        {/* Chapters List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Chapters</h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={onAddChapterClick}
                size="sm"
                className="text-sm"
              >
                Add Chapter
              </Button>
              {chapters.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-sm"
                >
                  {isEditing ? 'Done' : 'Edit'}
                </Button>
              )}
            </div>
          </div>
          
          {chapters.length === 0 ? (
            <div className="flex justify-center">
              <Card className="max-w-lg w-full">
                <CardContent className="text-center py-12">
                  <svg className="w-16 h-16 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-foreground mb-2">No chapters yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start building your story by adding your first chapter
                  </p>
                  <Button onClick={onAddChapterClick} size="lg">
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
                  onEdit={isEditing ? () => handleEditChapter(chapter) : undefined}
                  onDelete={isEditing ? () => handleDeleteChapter(chapter) : undefined}
                />
              ))}
            </div>
          )}
        </div>

        {/* Edit Chapter Modal */}
        {isEditing && editingChapter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Edit Chapter {editingChapter.chapter_number}
                  </h3>
                  <Button 
                    variant="ghost" 
                    onClick={handleCancelEdit}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              </div>
              
              <div className="px-6 py-4 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chapter Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter chapter title"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                  )}
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chapter Content *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => handleFormChange('content', e.target.value)}
                    rows={20}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                      errors.content ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter chapter content"
                  />
                  {errors.content && (
                    <p className="mt-1 text-sm text-red-500">{errors.content}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.content.trim().split(/\s+/).filter(word => word.length > 0).length} words
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveChapter}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && deletingChapter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Delete Chapter</h3>
              </div>
              
              <div className="px-6 py-4">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete "{deletingChapter.title}"? This action cannot be undone and will permanently remove this chapter and all associated content.
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-sm text-red-800">
                      This will permanently delete the chapter and all its scenes and generated content.
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={cancelDeleteChapter}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeleteChapter}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Chapter'}
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}