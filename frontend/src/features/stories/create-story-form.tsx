import React, { useState } from 'react'
import { Button, Input, Textarea, Select } from '../../shared/ui-components'
import { ImageSelector } from '../../shared/ui-components/image-selector'
import { StylePreview } from '../../shared/ui-components/style-preview'
import type { CreateStoryForm } from '../../shared/type-definitions'

interface CreateStoryFormProps {
  onSubmit: (data: CreateStoryForm) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const stylePresetOptions = [
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'scifi', label: 'Science Fiction' },
  { value: 'romance', label: 'Romance' },
  { value: 'thriller', label: 'Thriller' },
  { value: 'historical', label: 'Historical' },
  { value: 'contemporary', label: 'Contemporary' }
]

export function CreateStoryForm({ onSubmit, onCancel, isLoading = false }: CreateStoryFormProps) {
  const [formData, setFormData] = useState<CreateStoryForm>({
    title: '',
    description: '',
    genre: '',
    style_preset: 'fantasy',
    cover_image_url: '',
    is_public: false
  })
  
  const [errors, setErrors] = useState<Partial<Record<keyof CreateStoryForm, string>>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateStoryForm, string>> = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters'
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Failed to create story:', error)
    }
  }

  const handleChange = (field: keyof CreateStoryForm, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleImageUpload = async (file: File): Promise<string> => {
    // Mock image upload - replace with actual upload logic
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockUrl = URL.createObjectURL(file)
        resolve(mockUrl)
      }, 1000)
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Story</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Story Details</h3>
              
              <Input
                label="Story Title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                error={errors.title}
                placeholder="Enter your story title..."
                required
              />
              
              <Textarea
                label="Description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                error={errors.description}
                placeholder="Brief description of your story..."
                rows={3}
                helperText="This helps readers discover your story"
              />
              
              <Input
                label="Genre (Optional)"
                value={formData.genre || ''}
                onChange={(e) => handleChange('genre', e.target.value)}
                placeholder="e.g., Epic Fantasy, Space Opera, etc."
              />

              {/* Privacy Setting */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) => handleChange('is_public', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_public" className="text-sm text-gray-700">
                  Make this story publicly discoverable
                </label>
              </div>
              <p className="text-xs text-gray-500">
                You can change this setting later. Public stories may be featured in our community.
              </p>
            </div>

            {/* Right Column - Visual Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Visual Style</h3>
              
              <ImageSelector
                currentImage={formData.cover_image_url}
                onImageSelect={(url) => handleChange('cover_image_url', url)}
                onImageUpload={handleImageUpload}
                label="Cover Image"
              />
              
              <StylePreview
                selectedStyle={formData.style_preset}
                onStyleSelect={(style) => handleChange('style_preset', style as CreateStoryForm['style_preset'])}
              />
            </div>
          </div>
        </form>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            isLoading={isLoading}
            onClick={handleSubmit}
          >
            Create Story
          </Button>
        </div>
      </div>
    </div>
  )
}