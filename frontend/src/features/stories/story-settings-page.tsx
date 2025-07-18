import { useState, useEffect } from 'react'
import { Button } from '../../shared/ui-components/button'
import { Card, CardContent, CardHeader } from '../../shared/ui-components/card'
import type { Story } from '../../shared/type-definitions'

interface StorySettingsPageProps {
  storyId: string
  onBackToStory: () => void
  onStoryDeleted: () => void
}

interface StorySettingsForm {
  title: string
  description: string
  genre: string
  style_preset: 'fantasy' | 'scifi' | 'romance' | 'thriller' | 'historical' | 'contemporary'
  cover_image_url?: string
}

interface FormErrors {
  title?: string
  description?: string
  genre?: string
}

const STYLE_PRESETS = [
  { id: 'fantasy', label: 'Fantasy', description: 'Magical, mystical scenes with rich colors' },
  { id: 'scifi', label: 'Sci-Fi', description: 'Futuristic, technological scenes' },
  { id: 'romance', label: 'Romance', description: 'Soft, emotional scenes with warm tones' },
  { id: 'thriller', label: 'Thriller', description: 'Dark, suspenseful scenes' },
  { id: 'historical', label: 'Historical', description: 'Period-appropriate scenes' },
  { id: 'contemporary', label: 'Contemporary', description: 'Modern, realistic scenes' }
]

const GENRES = [
  'Fantasy', 'Science Fiction', 'Romance', 'Thriller', 'Mystery', 'Historical Fiction',
  'Contemporary Fiction', 'Horror', 'Adventure', 'Young Adult', 'Literary Fiction', 'Other'
]

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

export function StorySettingsPage({ storyId, onBackToStory, onStoryDeleted }: StorySettingsPageProps) {
  const [story, setStory] = useState<Story | null>(null)
  // const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState<StorySettingsForm>({
    title: '',
    description: '',
    genre: '',
    style_preset: 'contemporary',
    cover_image_url: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})

  // Load story data
  useEffect(() => {
    // In a real app, this would be an API call
    setStory(mockStory)
    setFormData({
      title: mockStory.title,
      description: mockStory.description || '',
      genre: mockStory.genre || '',
      style_preset: mockStory.style_preset || 'contemporary',
      cover_image_url: mockStory.cover_image_url || ''
    })
  }, [storyId])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.trim().length < 2) {
      newErrors.title = 'Title must be at least 2 characters'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters'
    }

    if (!formData.genre.trim()) {
      newErrors.genre = 'Genre is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    try {
      setIsSaving(true)
      // Mock API call - no delay needed
      
      if (story) {
        const updatedStory = {
          ...story,
          ...formData,
          updated_at: new Date().toISOString()
        }
        setStory(updatedStory)
      }
      
      // Show success feedback
      console.log('Story settings saved successfully')
    } catch (error) {
      console.error('Failed to save story settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!story) return

    try {
      setIsDeleting(true)
      // Mock API call - no delay needed
      
      // Call the parent callback to handle navigation
      onStoryDeleted()
    } catch (error) {
      console.error('Failed to delete story:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleChange = (field: keyof StorySettingsForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('Please select an image smaller than 10MB')
      return
    }

    try {
      // Create a temporary URL for the image (in a real app, this would upload to a server)
      const imageUrl = URL.createObjectURL(file)
      setFormData(prev => ({ ...prev, cover_image_url: imageUrl }))
    } catch (error) {
      console.error('Failed to process image:', error)
      alert('Failed to process image. Please try again.')
    }
  }


  if (!story) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Story not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={onBackToStory}
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Story
          </button>
          <h1 className="text-3xl font-bold text-foreground mb-2">Story Settings</h1>
          <p className="text-muted-foreground">Configure your story's metadata and appearance</p>
        </div>

        {/* Settings Form */}
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Basic Information</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Story Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.title ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder="Enter story title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-3 rounded-lg border bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${
                    errors.description ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder="Enter story description"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-500">{errors.description}</p>
                )}
              </div>

              {/* Genre */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Genre
                </label>
                <select
                  value={formData.genre}
                  onChange={(e) => handleChange('genre', e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.genre ? 'border-red-500' : 'border-border'
                  }`}
                >
                  <option value="">Select a genre</option>
                  {GENRES.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
                {errors.genre && (
                  <p className="mt-1 text-sm text-red-500">{errors.genre}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Style Preset */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Visual Style</h2>
              <p className="text-sm text-muted-foreground">Choose the visual style for AI-generated scenes</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {STYLE_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => handleChange('style_preset', preset.id)}
                    className={`p-4 rounded-lg border text-left transition-all hover:border-primary ${
                      formData.style_preset === preset.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <h3 className="font-medium mb-1">{preset.label}</h3>
                    <p className="text-sm text-muted-foreground">{preset.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cover Image */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Cover Image</h2>
              <p className="text-sm text-muted-foreground">Add or update your story's cover image</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.cover_image_url && (
                  <div className="flex items-center space-x-4">
                    <img
                      src={formData.cover_image_url}
                      alt="Story cover"
                      className="w-16 h-20 rounded-lg object-cover border border-border"
                    />
                    <div>
                      <p className="text-sm text-foreground">Current cover image</p>
                      <button
                        onClick={() => handleChange('cover_image_url', '')}
                        className="text-sm text-red-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="cover-image-upload"
                  />
                  <label htmlFor="cover-image-upload" className="cursor-pointer">
                    <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p className="text-muted-foreground mb-2">Upload a new cover image</p>
                    <p className="text-sm text-muted-foreground">PNG, JPG up to 10MB</p>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-red-600">Danger Zone</h2>
              <p className="text-sm text-muted-foreground">Irreversible and destructive actions</p>
            </CardHeader>
            <CardContent>
              <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                <h3 className="font-medium text-red-800 dark:text-red-200 mb-2">Delete Story</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                  Once deleted, this story and all its chapters will be permanently removed. This action cannot be undone.
                </p>
                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  Delete Story
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button
            variant="outline"
            onClick={onBackToStory}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            className="flex-1"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-foreground mb-4">Confirm Deletion</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete "{story.title}"? This action cannot be undone and will permanently remove all chapters and generated content.
            </p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                isLoading={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? 'Deleting...' : 'Delete Story'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}