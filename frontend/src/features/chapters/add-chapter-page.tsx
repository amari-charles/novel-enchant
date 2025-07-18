import { useState } from 'react'
import { ContentInput } from '../../components/content-input'
import type { UploadChapterForm } from '../../shared/type-definitions'

interface AddChapterPageProps {
  storyId: string
  onSubmit: (data: UploadChapterForm) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  nextChapterNumber: number
}

export function AddChapterPage({ 
  onSubmit, 
  onCancel, 
  isLoading = false,
  nextChapterNumber 
}: AddChapterPageProps) {
  const [formData, setFormData] = useState<UploadChapterForm>({
    title: '',
    content: '',
    word_count: 0,
    estimated_read_time: 0
  })
  const [sourceUrl, setSourceUrl] = useState<string>('')
  const [error, setError] = useState<string>('')

  const handleContentSubmit = async () => {
    if (!formData.content.trim() && !sourceUrl?.trim()) {
      setError('Please provide chapter content or URL')
      return
    }

    if (formData.content.trim() && formData.content.trim().split(/\s+/).length < 100) {
      setError('Please provide at least 100 words for better processing')
      return
    }

    // Auto-extract title from content
    const extractedTitle = extractTitleFromContent(formData.content)
    
    try {
      // Calculate metadata
      const words = formData.content.trim().split(/\s+/).filter(word => word.length > 0)
      const wordCount = words.length
      const readTime = Math.max(1, Math.ceil(wordCount / 250))
      
      await onSubmit({
        ...formData,
        title: extractedTitle,
        word_count: wordCount,
        estimated_read_time: readTime
      })
    } catch (error) {
      console.error('Failed to upload chapter:', error)
      setError('Failed to create chapter. Please try again.')
    }
  }

  const extractTitleFromContent = (content: string): string => {
    if (!content.trim()) return `Chapter ${nextChapterNumber}`
    
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    if (lines.length === 0) return `Chapter ${nextChapterNumber}`
    
    const firstLine = lines[0]
    
    // If first line is short and looks like a title (no period at end, reasonable length)
    if (firstLine.length < 80 && firstLine.length > 3 && !firstLine.endsWith('.')) {
      return `Chapter ${nextChapterNumber}: ${firstLine}`
    }
    
    // Extract from first sentence if it's reasonably short
    const firstSentence = content.split(/[.!?]/)[0].trim()
    if (firstSentence.length < 60 && firstSentence.length > 10) {
      return `Chapter ${nextChapterNumber}: ${firstSentence}`
    }
    
    // Fallback to chapter number
    return `Chapter ${nextChapterNumber}`
  }

  const handleFieldChange = (field: keyof UploadChapterForm, value: string) => {
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

  const canSubmit = formData.content.trim().length > 0 || sourceUrl?.trim().length > 0


  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <button 
            onClick={onCancel}
            className="absolute left-4 top-4 p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">Add Chapter {nextChapterNumber}</h1>
          <p className="text-muted-foreground">
            Add your chapter content to continue building your story
          </p>
        </div>

        {/* Content Upload */}
        <div className="space-y-6">
          <ContentInput
            content={formData.content}
            sourceUrl={sourceUrl}
            onContentChange={(content) => handleFieldChange('content', content)}
            onSourceUrlChange={setSourceUrl}
            onFileUpload={handleFileUpload}
            onSubmit={handleContentSubmit}
            canSubmit={canSubmit}
            isProcessing={isLoading}
            error={error}
            submitButtonText="Add Chapter"
            processingText="Adding Chapter..."
            title="Add Your Chapter Content"
          />
        </div>
      </div>
    </div>
  )
}