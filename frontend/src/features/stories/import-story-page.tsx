import { useState } from 'react'
import { Button, Card, CardContent, CardHeader } from '../../shared/ui-components'
import { ContentInput } from '../../components/content-input'
import type { CreateStoryForm } from '../../shared/type-definitions'

interface ImportStoryPageProps {
  onSubmit: (data: CreateStoryForm) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

interface ImportPreview {
  title: string
  description: string
  wordCount: number
  source: string
  estimatedReadTime: number
}

export function ImportStoryPage({ onSubmit, onCancel, isLoading = false }: ImportStoryPageProps) {
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
  
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string>('')
  const [step, setStep] = useState<'import' | 'preview' | 'details'>('import')

  const mockAnalyzeImportedContent = async (content: string, sourceUrl?: string): Promise<ImportPreview> => {
    // Simulate API call for content analysis
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const wordCount = content.trim().split(/\s+/).length
    const estimatedReadTime = Math.ceil(wordCount / 200) // 200 words per minute reading speed
    
    // Mock AI analysis of imported content
    const titles = [
      'The Enchanted Archive',
      'Whispers of the Old Kingdom',
      'The Celestial Codex',
      'Shadows of the Forgotten Realm',
      'The Mystic Chronicles'
    ]
    
    const descriptions = [
      'A tale of ancient magic and forgotten secrets waiting to be discovered.',
      'An epic journey through realms of wonder and peril.',
      'A story of heroes rising to face an ancient darkness.',
      'A chronicle of adventure in a world where magic shapes destiny.',
      'An exploration of hidden truths in a realm of endless possibilities.'
    ]
    
    return {
      title: titles[Math.floor(Math.random() * titles.length)],
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      wordCount,
      source: sourceUrl || 'Imported Content',
      estimatedReadTime
    }
  }

  const handleAnalyzeContent = async () => {
    if (formData.content.trim().split(/\s+/).length < 100) {
      setError('Please provide at least 100 words for better analysis')
      return
    }

    setIsAnalyzing(true)
    setError('')
    
    try {
      const result = await mockAnalyzeImportedContent(formData.content, formData.source_url)
      setPreview(result)
      
      // Update form data with analysis
      setFormData(prev => ({
        ...prev,
        title: result.title,
        description: result.description,
        genre: 'Fantasy' // Default genre for imported content
      }))
      
      setStep('preview')
    } catch {
      setError('Failed to analyze imported content. Please try again.')
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
      console.error('Failed to create story from import:', error)
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
              <h1 className="text-2xl font-bold text-foreground">Import Story</h1>
              <p className="text-sm text-muted-foreground">
                {step === 'import' ? 'Import content from URL, file, or paste text' : 
                 step === 'preview' ? 'Review the imported content' : 
                 'Customize story details'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              step === 'import' ? 'bg-primary text-primary-foreground' : 
              'bg-primary text-primary-foreground'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 rounded ${
              ['preview', 'details'].includes(step) ? 'bg-primary' : 'bg-muted'
            }`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              step === 'preview' ? 'bg-primary text-primary-foreground' : 
              step === 'details' ? 'bg-primary text-primary-foreground' : 
              'bg-muted text-muted-foreground'
            }`}>
              2
            </div>
            <div className={`w-16 h-1 rounded ${
              step === 'details' ? 'bg-primary' : 'bg-muted'
            }`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              step === 'details' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              3
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Step 1: Import Content */}
          {step === 'import' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-foreground">Import Your Story</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred method to import story content. URLs are ideal for web novels, articles, or online stories.
                  </p>
                </CardHeader>
              </Card>
              
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
            </div>
          )}

          {/* Step 2: Preview Imported Content */}
          {step === 'preview' && preview && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-foreground">Import Preview</h3>
                  <p className="text-sm text-muted-foreground">
                    Review the imported content before creating your story
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{preview.wordCount.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Words</div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{preview.estimatedReadTime}</div>
                      <div className="text-sm text-muted-foreground">Min Read</div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-primary">1</div>
                      <div className="text-sm text-muted-foreground">Chapter</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Suggested Title</h4>
                      <p className="text-foreground">{preview.title}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Suggested Description</h4>
                      <p className="text-muted-foreground">{preview.description}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Source</h4>
                      <p className="text-muted-foreground text-sm">{preview.source}</p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-foreground mb-2">Content Preview</h4>
                    <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground max-h-40 overflow-y-auto">
                      {formData.content.substring(0, 500)}...
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('import')}
                >
                  Back to Import
                </Button>
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep('details')}
                  >
                    Customize Details
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

          {/* Step 3: Customize Story Details */}
          {step === 'details' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-foreground">Story Details</h3>
                  <p className="text-sm text-muted-foreground">
                    Customize the story information before creating
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
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
                        rows={8}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background text-foreground"
                      />
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formData.description?.length || 0}/500 characters
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_public"
                        checked={formData.is_public}
                        onChange={(e) => handleFieldChange('is_public', e.target.checked)}
                        className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                      />
                      <label htmlFor="is_public" className="text-sm text-foreground">
                        Make story public (others can discover and read)
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {error && (
                <Card>
                  <CardContent className="p-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('preview')}
                >
                  Back to Preview
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