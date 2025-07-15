import { useState } from 'react'
import { Button, Card, CardContent } from '../../shared/ui-components'
import type { CreateStoryForm } from '../../shared/type-definitions'

interface CreateStoryPageProps {
  onSubmit: (data: CreateStoryForm) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const stylePresets = [
  { 
    value: 'fantasy', 
    label: 'Fantasy', 
    description: 'Magical worlds, mythical creatures, and epic adventures',
    thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=150&fit=crop'
  },
  { 
    value: 'scifi', 
    label: 'Science Fiction', 
    description: 'Futuristic technology, space exploration, and alien worlds',
    thumbnail: 'https://images.unsplash.com/photo-1446776876451-1b37ba9b9a6b?w=200&h=150&fit=crop'
  },
  { 
    value: 'romance', 
    label: 'Romance', 
    description: 'Love stories, relationships, and emotional journeys',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=150&fit=crop'
  },
  { 
    value: 'thriller', 
    label: 'Thriller', 
    description: 'Suspense, mystery, and high-stakes drama',
    thumbnail: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=200&h=150&fit=crop'
  },
  { 
    value: 'historical', 
    label: 'Historical', 
    description: 'Period pieces, historical events, and authentic settings',
    thumbnail: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=150&fit=crop'
  },
  { 
    value: 'contemporary', 
    label: 'Contemporary', 
    description: 'Modern-day stories and realistic settings',
    thumbnail: 'https://images.unsplash.com/photo-1519452575417-564c1401ecc0?w=200&h=150&fit=crop'
  }
]

export function CreateStoryPage({ onSubmit, onCancel, isLoading = false }: CreateStoryPageProps) {
  const [formData, setFormData] = useState<CreateStoryForm>({
    title: '',
    description: '',
    genre: '',
    style_preset: 'fantasy',
    cover_image_url: '',
    is_public: false
  })
  
  const [errors, setErrors] = useState<Partial<Record<keyof CreateStoryForm, string>>>({})
  const [step, setStep] = useState<'details' | 'style' | 'cover'>('details')

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

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Failed to create story:', error)
    }
  }

  const handleChange = (field: keyof CreateStoryForm, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const canProceedToStyle = formData.title.trim().length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button 
              onClick={onCancel}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Story</h1>
              <p className="text-sm text-gray-600">Set up your story for visual enhancement</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              step === 'details' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 rounded ${
              ['style', 'cover'].includes(step) ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              step === 'style' ? 'bg-blue-600 text-white' : 
              step === 'cover' ? 'bg-gray-200 text-gray-600' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <div className={`w-16 h-1 rounded ${
              step === 'cover' ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              step === 'cover' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Step 1: Story Details */}
          {step === 'details' && (
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Story Details</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Story Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="Enter your story title..."
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.title ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Genre (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.genre || ''}
                        onChange={(e) => handleChange('genre', e.target.value)}
                        placeholder="e.g., Epic Fantasy, Space Opera..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (Optional)
                      </label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Brief description of your story..."
                        rows={4}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                          errors.description ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                      )}
                      <p className="mt-1 text-sm text-gray-500">
                        {formData.description?.length || 0}/500 characters
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={() => setStep('style')}
                    disabled={!canProceedToStyle}
                    className="px-8"
                  >
                    Next: Choose Style
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Illustration Style */}
          {step === 'style' && (
            <Card>
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Choose Illustration Style</h2>
                  <p className="text-gray-600">Select the visual style that best matches your story's tone and genre.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {stylePresets.map((preset) => (
                    <Card 
                      key={preset.value}
                      onClick={() => handleChange('style_preset', preset.value as CreateStoryForm['style_preset'])}
                      className={`cursor-pointer transition-all duration-200 ${
                        formData.style_preset === preset.value 
                          ? 'ring-2 ring-blue-500 border-blue-500' 
                          : 'hover:shadow-md'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="aspect-video rounded-lg overflow-hidden mb-3">
                          <img 
                            src={preset.thumbnail} 
                            alt={preset.label}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">{preset.label}</h3>
                        <p className="text-sm text-gray-600">{preset.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep('details')}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={() => setStep('cover')}
                    className="px-8"
                  >
                    Next: Cover Image
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Cover Image */}
          {step === 'cover' && (
            <Card>
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Upload Cover Image</h2>
                  <p className="text-gray-600">Add a cover image for your story (optional).</p>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
                  {formData.cover_image_url ? (
                    <div className="space-y-4">
                      <img 
                        src={formData.cover_image_url} 
                        alt="Cover preview" 
                        className="w-32 h-40 object-cover rounded-lg mx-auto"
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => handleChange('cover_image_url', '')}
                      >
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-gray-600 mb-2">Drag and drop an image here, or click to browse</p>
                        <Button variant="outline" size="sm">Choose File</Button>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep('style')}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    isLoading={isLoading}
                    className="px-8"
                  >
                    Create Story
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}