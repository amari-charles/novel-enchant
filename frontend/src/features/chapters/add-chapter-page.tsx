import { useState, useCallback } from 'react'
import { Button, Card, CardContent } from '../../shared/ui-components'
import { FileUpload } from '../../shared/ui-components/file-upload'
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
  const [uploadMethod, setUploadMethod] = useState<'type' | 'file'>('type')
  const [fileError, setFileError] = useState<string>('')
  const [errors, setErrors] = useState<Partial<Record<keyof UploadChapterForm, string>>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UploadChapterForm, string>> = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Chapter title is required'
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters'
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Chapter content is required'
    } else if (formData.content.trim().split(/\s+/).length < 100) {
      newErrors.content = 'Chapter must be at least 100 words'
    } else if (formData.content.length > 200000) {
      newErrors.content = 'Chapter content is too long (max 200,000 characters)'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Failed to upload chapter:', error)
    }
  }

  const calculateMetadata = useCallback((content: string) => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0)
    const wordCount = words.length
    const readTime = Math.max(1, Math.ceil(wordCount / 250)) // 250 words per minute
    return { wordCount, readTime }
  }, [])

  const handleChange = (field: keyof UploadChapterForm, value: string) => {
    let updatedData = { ...formData, [field]: value }
    
    // Auto-calculate metadata when content changes
    if (field === 'content') {
      const { wordCount, readTime } = calculateMetadata(value)
      updatedData.word_count = wordCount
      updatedData.estimated_read_time = readTime
    }
    
    setFormData(updatedData)
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleFileUpload = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return

    setFileError('')
    
    try {
      let content = ''
      
      if (file.type === 'text/plain') {
        content = await file.text()
      } else if (file.name.endsWith('.docx')) {
        setFileError('DOCX files require additional processing. Please convert to .txt or paste content directly.')
        return
      } else {
        setFileError('Unsupported file type. Please upload .txt files or paste content.')
        return
      }
      
      const { wordCount, readTime } = calculateMetadata(content)
      
      setFormData(prev => ({
        ...prev,
        content,
        word_count: wordCount,
        estimated_read_time: readTime,
        title: prev.title || file.name.replace(/\.[^/.]+$/, '') // Use filename as title if empty
      }))
      
    } catch (error) {
      setFileError('Failed to read file. Please try again.')
    }
  }, [calculateMetadata])

  const wordCount = formData.word_count || 0
  const readTime = formData.estimated_read_time || 0
  const isWordCountValid = wordCount >= 100

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
              <h1 className="text-2xl font-bold text-gray-900">Add Chapter {nextChapterNumber}</h1>
              <p className="text-sm text-gray-600">Upload your chapter content for AI scene extraction</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Chapter Title */}
          <Card>
            <CardContent className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chapter Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder={`Chapter ${nextChapterNumber}: Enter title...`}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </CardContent>
          </Card>

          {/* Upload Method Selection */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">How would you like to add your chapter?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setUploadMethod('type')}
                  className={`p-6 rounded-lg border-2 transition-all duration-200 text-left ${
                    uploadMethod === 'type'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${
                      uploadMethod === 'type' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Type or Paste Text</h4>
                      <p className="text-sm text-gray-600">Write directly in the text editor or paste from another document</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setUploadMethod('file')}
                  className={`p-6 rounded-lg border-2 transition-all duration-200 text-left ${
                    uploadMethod === 'file'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${
                      uploadMethod === 'file' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Upload File</h4>
                      <p className="text-sm text-gray-600">Upload a .txt file from your device</p>
                    </div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Content Input */}
          <Card>
            <CardContent className="p-6">
              {uploadMethod === 'file' ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Upload Chapter File</h3>
                  <FileUpload
                    accept=".txt,text/plain"
                    maxSize={10}
                    onFileSelect={handleFileUpload}
                    onError={setFileError}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
                  >
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-700 font-medium mb-1">Drop your chapter file here</p>
                        <p className="text-sm text-gray-600 mb-3">or click to browse</p>
                        <p className="text-xs text-gray-500">Supports .txt files up to 10MB</p>
                      </div>
                    </div>
                  </FileUpload>
                  
                  {fileError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-700">{fileError}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Chapter Content</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <span className={wordCount < 100 ? 'text-red-600' : 'text-green-600'}>
                          {wordCount.toLocaleString()} words
                        </span>
                        <span className="text-gray-400">(min 100)</span>
                      </div>
                      {readTime > 0 && (
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{readTime} min read</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <textarea
                    value={formData.content}
                    onChange={(e) => handleChange('content', e.target.value)}
                    placeholder="Paste or type your chapter content here..."
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                      errors.content ? 'border-red-300' : 'border-gray-300'
                    }`}
                    rows={20}
                    style={{ minHeight: '400px' }}
                  />
                  
                  {errors.content && (
                    <p className="text-sm text-red-600">{errors.content}</p>
                  )}
                  
                  {!isWordCountValid && formData.content.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-700">
                        ⚠️ Chapters with fewer than 100 words may not generate meaningful scenes
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chapter Stats */}
          {formData.content && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Chapter Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{wordCount.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Words</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{readTime}</div>
                    <div className="text-sm text-gray-600">Min Read</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{formData.content.length.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Characters</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {formData.content.split('\n\n').filter(p => p.trim()).length}
                    </div>
                    <div className="text-sm text-gray-600">Paragraphs</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pb-8">
            <Button 
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={!isWordCountValid || !formData.title.trim()}
              size="lg"
              className="px-8"
            >
              {isLoading ? 'Processing Chapter...' : 'Add Chapter'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}