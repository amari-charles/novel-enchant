import { useState } from 'react'
import { Button } from '../../shared/ui-components'
import { ContentInput } from '../../components/content-input'
import { AIAnalysisPreview } from '../../components/ai-analysis-preview'
import { analyzeStoryContent, type AIAnalysisResult } from '../../services/ai-analysis'
import type { CreateStoryForm } from '../../shared/type-definitions'

interface CreateStoryPageProps {
  onSubmit: (data: CreateStoryForm) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}


export function CreateStoryPage({ onSubmit, onCancel, isLoading = false }: CreateStoryPageProps) {
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
  
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string>('')
  const [step, setStep] = useState<'content' | 'review' | 'manual'>('content')

  // Manual content analysis (triggered by submit)
  const handleAnalyzeContent = async () => {
    if (formData.content.trim().split(/\s+/).length < 100) {
      setError('Please provide at least 100 words for better AI analysis')
      return
    }

    setIsAnalyzing(true)
    setError('')
    
    try {
      const result = await analyzeStoryContent(formData.content)
      setAnalysis(result)
      
      // Update form data with AI analysis
      setFormData(prev => ({
        ...prev,
        title: result.title,
        description: result.description,
        genre: result.genre,
        style_preset: result.style_preset,
        confidence_scores: result.confidence_scores
      }))
      
      // Auto-advance to review step
      setStep('review')
    } catch (err) {
      setError('Failed to analyze content. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }
    
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
    } catch (err) {
      setError('Failed to read file. Please try again.')
    }
  }
  
  const canSubmit = formData.content.trim().length > 0 || (formData.source_url || '').trim().length > 0

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button 
              onClick={onCancel}
              className="mr-4 p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Create New Story</h1>
              <p className="text-sm text-muted-foreground">
                {step === 'content' ? 'Add your story content and let AI analyze it' : 
                 step === 'review' ? 'Review and refine the AI analysis' : 
                 'Manually enter story details'}
              </p>
            </div>
          </div>
          
          {/* Manual Entry Option */}
          {step === 'content' && (
            <Button 
              variant="outline" 
              onClick={() => setStep('manual')}
              size="sm"
            >
              Manual Entry
            </Button>
          )}
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              step === 'content' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 rounded ${
              ['review', 'manual'].includes(step) ? 'bg-primary' : 'bg-muted'
            }`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              step === 'review' ? 'bg-primary text-primary-foreground' : 
              step === 'manual' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              2
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Step 1: Content Input */}
          {step === 'content' && (
            <ContentInput
              content={formData.content}
              sourceUrl={formData.source_url}
              onContentChange={(content) => handleFieldChange('content', content)}
              onSourceUrlChange={(url) => handleFieldChange('source_url', url)}
              onFileUpload={handleFileUpload}
              onSubmit={handleAnalyzeContent}
              canSubmit={canSubmit}
              isProcessing={isAnalyzing}
              error={error}
            />
          )}

          {/* Step 2: AI Analysis Review */}
          {step === 'review' && analysis && (
            <div className="space-y-6">
              <AIAnalysisPreview
                analysis={analysis}
                onFieldChange={handleFieldChange}
                onStyleChange={(style) => handleFieldChange('style_preset', style)}
                isAnalyzing={isAnalyzing}
              />
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('content')}
                >
                  Back to Content
                </Button>
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep('manual')}
                  >
                    Manual Override
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={!canSubmit || isLoading}
                    className="px-8"
                  >
                    {isLoading ? 'Creating...' : 'Create Story'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Manual Entry Fallback */}
          {step === 'manual' && (
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-medium text-foreground mb-2">Manual Entry Mode</h3>
                <p className="text-sm text-muted-foreground">
                  Fill out the story details manually. You can still use the content for chapter creation later.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Story Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleFieldChange('title', e.target.value)}
                      placeholder="Enter your story title..."
                      className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Genre (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.genre || ''}
                      onChange={(e) => handleFieldChange('genre', e.target.value)}
                      placeholder="e.g., Epic Fantasy, Space Opera..."
                      className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Visual Style
                    </label>
                    <select
                      value={formData.style_preset}
                      onChange={(e) => handleFieldChange('style_preset', e.target.value as CreateStoryForm['style_preset'])}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    >
                      <option value="fantasy">Fantasy</option>
                      <option value="scifi">Science Fiction</option>
                      <option value="romance">Romance</option>
                      <option value="thriller">Thriller</option>
                      <option value="historical">Historical</option>
                      <option value="contemporary">Contemporary</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Brief description of your story..."
                    rows={6}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background text-foreground"
                  />
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formData.description?.length || 0}/500 characters
                  </p>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(analysis ? 'review' : 'content')}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!formData.title.trim() || isLoading}
                  className="px-8"
                >
                  {isLoading ? 'Creating...' : 'Create Story'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}