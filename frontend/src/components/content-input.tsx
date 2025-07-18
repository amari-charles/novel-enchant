import { useState, useCallback } from 'react'
import { Button, Card, CardContent } from '../shared/ui-components'
import { fetchContentFromUrl } from '../services/ai-analysis'

interface ContentInputProps {
  content: string
  sourceUrl?: string
  onContentChange: (content: string) => void
  onSourceUrlChange: (url: string) => void
  onFileUpload: (file: File) => void
  onSubmit: () => void
  canSubmit: boolean
  isProcessing?: boolean
  error?: string
  submitButtonText?: string
  processingText?: string
  title?: string
}

export function ContentInput({ 
  content, 
  sourceUrl, 
  onContentChange, 
  onSourceUrlChange, 
  onFileUpload,
  onSubmit,
  canSubmit,
  isProcessing = false,
  error,
  submitButtonText = 'Create',
  processingText = 'Creating...',
  title = 'Add Your Content'
}: ContentInputProps) {
  const [isFetching, setIsFetching] = useState(false)
  const [urlError, setUrlError] = useState<string>('')
  
  // Determine which input method is active
  const activeMethod = content.trim() ? 'text' : (sourceUrl || '').trim() ? 'url' : 'none'
  const isTextActive = activeMethod === 'text'
  const isUrlActive = activeMethod === 'url'
  const hasContent = content.trim().length > 0 || (sourceUrl || '').trim().length > 0

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Clear other fields when file is uploaded
      onSourceUrlChange('')
      onFileUpload(file)
    }
  }, [onFileUpload, onSourceUrlChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      // Clear other fields when file is dropped
      onSourceUrlChange('')
      onFileUpload(file)
    }
  }, [onFileUpload, onSourceUrlChange])

  const handleTextChange = useCallback((newContent: string) => {
    if (newContent.trim() && (sourceUrl || '').trim()) {
      // Clear URL when user starts typing
      onSourceUrlChange('')
    }
    onContentChange(newContent)
  }, [onContentChange, onSourceUrlChange, sourceUrl])
  
  const handleUrlChange = useCallback((newUrl: string) => {
    if (newUrl.trim() && content.trim()) {
      // Clear text when user enters URL
      onContentChange('')
    }
    setUrlError('') // Clear URL error when user changes URL
    onSourceUrlChange(newUrl)
  }, [onSourceUrlChange, onContentChange, content])
  
  const handleFetchUrl = useCallback(async () => {
    if (!sourceUrl?.trim()) return
    
    setIsFetching(true)
    setUrlError('') // Clear any previous errors
    try {
      const fetchedContent = await fetchContentFromUrl(sourceUrl)
      onContentChange(fetchedContent)
      onSourceUrlChange('') // Clear URL after successful fetch
      // Auto-submit after fetching
      onSubmit()
    } catch (error) {
      console.error('Failed to fetch URL:', error)
      // Set user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch content from URL'
      setUrlError(errorMessage)
    } finally {
      setIsFetching(false)
    }
  }, [sourceUrl, onContentChange, onSourceUrlChange, onSubmit])
  
  const handleSubmit = useCallback(async () => {
    // If URL exists but no content, fetch first and auto-submit
    if (sourceUrl?.trim() && !content.trim()) {
      await handleFetchUrl()
      return
    }
    
    // Otherwise, submit directly
    onSubmit()
  }, [sourceUrl, content, handleFetchUrl, onSubmit])
  
  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length
  const isValidContent = wordCount >= 100

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose one method below - fields will lock automatically when you start using one
            </p>
          </div>

          {/* URL Input */}
          <div className={`space-y-2 ${
            isTextActive ? 'opacity-50 pointer-events-none' : ''
          }`}>
            <label className="block text-sm font-medium text-foreground">
              <span className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span>Import from URL</span>
                {isUrlActive && <span className="text-primary text-xs">(Active)</span>}
              </span>
            </label>
            <input
              type="url"
              value={sourceUrl || ''}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com/story"
              className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground text-sm ${
                isUrlActive ? 'border-primary' : 'border-border'
              }`}
            />
            {urlError && (
              <div className="bg-red-50 border border-red-200 rounded p-2">
                <p className="text-xs text-red-700">{urlError}</p>
              </div>
            )}
          </div>

          {/* File Upload */}
          <div className={`space-y-2 ${
            hasContent ? 'opacity-50 pointer-events-none' : ''
          }`}>
            <label className="block text-sm font-medium text-foreground">
              <span className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Upload File</span>
              </span>
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept=".txt,.pdf,.epub"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="cursor-pointer"
                  onDrop={handleDrop}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Choose File
                </Button>
              </label>
              <span className="text-xs text-muted-foreground">
                .txt, .pdf, .epub (max 10MB)
              </span>
            </div>
          </div>

          {/* Text Input - Last */}
          <div className={`space-y-2 ${
            isUrlActive ? 'opacity-50 pointer-events-none' : ''
          }`}>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-foreground">
                <span className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Type or Paste Story Content</span>
                  {isTextActive && <span className="text-primary text-xs">(Active)</span>}
                </span>
              </label>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span className={wordCount < 100 ? 'text-red-600' : 'text-green-600'}>
                  {wordCount.toLocaleString()} words
                </span>
                <span className="text-muted-foreground">(min 100)</span>
              </div>
            </div>
            
            <textarea
              value={content}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Paste your story content here..."
              className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background text-foreground text-sm ${
                isTextActive ? 'border-primary' : 'border-border'
              }`}
              rows={3}
            />
            
            {!isValidContent && content.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded p-2">
                <p className="text-xs text-amber-700">
                  ⚠️ Please provide at least 100 words for better AI analysis
                </p>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button 
              onClick={handleSubmit}
              disabled={!canSubmit || isProcessing || isFetching}
              size="sm"
              className="px-6"
            >
              {isFetching ? processingText : isProcessing ? 'Processing...' : submitButtonText}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}