import { useState } from 'react'
import { Button } from '../../shared/ui-components'
import { ContentInput } from '../../components/content-input'
import type { CreateStoryForm } from '../../shared/type-definitions'

interface SimpleUploadPageProps {
  onSubmit: (data: CreateStoryForm) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const STYLE_PRESETS = [
  { value: 'fantasy', label: 'Fantasy', description: 'Magical worlds and mythical creatures' },
  { value: 'scifi', label: 'Science Fiction', description: 'Futuristic technology and space' },
  { value: 'romance', label: 'Romance', description: 'Love stories and relationships' },
  { value: 'thriller', label: 'Thriller', description: 'Suspense and mystery' },
  { value: 'historical', label: 'Historical', description: 'Period settings and historical events' },
  { value: 'contemporary', label: 'Contemporary', description: 'Modern day settings' }
] as const

export function SimpleUploadPage({ onSubmit, onCancel, isLoading = false }: SimpleUploadPageProps) {
  const [formData, setFormData] = useState<CreateStoryForm>({
    content: '',
    source_url: '',
    title: '',
    description: '',
    genre: '',
    style_preset: 'fantasy',
    cover_image_url: '',
    is_public: false
  })
  
  const [error, setError] = useState<string>('')
  const [step, setStep] = useState<'upload' | 'style'>('upload')

  const handleContentSubmit = async () => {
    if (!formData.content.trim() && !formData.source_url?.trim()) {
      setError('Please provide story content or URL')
      return
    }

    if (formData.content.trim() && formData.content.trim().split(/\s+/).length < 100) {
      setError('Please provide at least 100 words for better processing')
      return
    }

    // If we have a URL, it will auto-submit after fetching
    // If we have content, go to style selection
    if (formData.content.trim()) {
      setStep('style')
    } else {
      // URL will handle auto-submit in ContentInput component
      // This shouldn't be reached due to the URL auto-submit logic
      setStep('style')
    }
  }

  const handleFinalSubmit = async () => {
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Failed to create story:', error)
      setError('Failed to create story. Please try again.')
    }
  }

  const handleFieldChange = (field: keyof CreateStoryForm, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleFileUpload = async (file: File) => {
    setError('')
    
    try {
      const text = await file.text()
      setFormData(prev => ({ ...prev, content: text }))
    } catch {
      setError('Failed to read file. Please try again.')
    }
  }
  
  const canSubmit = formData.content.trim().length > 0 || (formData.source_url || '').trim().length > 0

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <button 
            onClick={step === 'upload' ? onCancel : () => setStep('upload')}
            className="absolute left-4 top-4 p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step === 'upload' ? "M6 18L18 6M6 6l12 12" : "M15 19l-7-7 7-7"} />
            </svg>
          </button>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">Add Your Story</h1>
          <p className="text-muted-foreground">
            {step === 'upload' 
              ? 'Add your story content and we\'ll create stunning visual scenes from it'
              : 'Choose the visual style for your story'
            }
          </p>
        </div>

        {/* Step 1: Content Upload */}
        {step === 'upload' && (
          <div className="space-y-6">
            <ContentInput
              content={formData.content}
              sourceUrl={formData.source_url}
              onContentChange={(content) => handleFieldChange('content', content)}
              onSourceUrlChange={(url) => handleFieldChange('source_url', url)}
              onFileUpload={handleFileUpload}
              onSubmit={handleContentSubmit}
              canSubmit={canSubmit}
              isProcessing={false}
              error={error}
              submitButtonText="Create"
              processingText="Creating..."
              title="Add Your Story Content"
            />
          </div>
        )}

        {/* Step 2: Style Selection */}
        {step === 'style' && (
          <div className="space-y-6">
            {/* Style Preset Selection */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Choose Visual Style</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleFieldChange('style_preset', preset.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      formData.style_preset === preset.value
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                        : 'border-border hover:border-muted-foreground hover:bg-muted/30'
                    }`}
                  >
                    <div className={`font-medium ${
                      formData.style_preset === preset.value ? 'text-primary' : 'text-foreground'
                    }`}>
                      {preset.label}
                      {formData.style_preset === preset.value && (
                        <span className="ml-2 text-primary">✓</span>
                      )}
                    </div>
                    <div className={`text-sm mt-1 ${
                      formData.style_preset === preset.value ? 'text-primary/80' : 'text-muted-foreground'
                    }`}>
                      {preset.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button 
                onClick={handleFinalSubmit}
                disabled={isLoading}
                size="lg"
                className="px-8"
              >
                {isLoading ? 'Creating Story...' : 'Create Story'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}