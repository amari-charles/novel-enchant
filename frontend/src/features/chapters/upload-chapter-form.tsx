import React, { useState, useCallback } from 'react'
import { Button, Input, Textarea } from '../../shared/ui-components'
import { FileUpload } from '../../shared/ui-components/file-upload'
import type { UploadChapterForm } from '../../shared/type-definitions'

interface UploadChapterFormProps {
  onSubmit: (data: UploadChapterForm) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  nextChapterNumber: number
}

export function UploadChapterFormComponent({ 
  onSubmit, 
  onCancel, 
  isLoading = false,
  nextChapterNumber 
}: UploadChapterFormProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
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
        // Basic .docx support - in a real app you'd use a library like mammoth.js
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">
            Upload Chapter {nextChapterNumber}
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Add your chapter content and AI will extract visual scenes automatically
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-4 space-y-4 flex-1 overflow-y-auto">
            <Input
              label="Chapter Title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              error={errors.title}
              placeholder={`Chapter ${nextChapterNumber}: Enter title...`}
              required
            />

            {/* Upload Method Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                How would you like to add your chapter?
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setUploadMethod('type')}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    uploadMethod === 'type'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Type/Paste Text</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod('file')}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    uploadMethod === 'file'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Upload File</span>
                  </div>
                </button>
              </div>
            </div>
            
            {/* File Upload Interface */}
            {uploadMethod === 'file' && (
              <div className="space-y-3">
                <FileUpload
                  accept=".txt,text/plain"
                  maxSize={10}
                  onFileSelect={handleFileUpload}
                  onError={setFileError}
                  className="max-w-full"
                >
                  <div>
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600 mb-2">
                      Drop your chapter file here or click to browse
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports .txt files up to 10MB
                    </p>
                  </div>
                </FileUpload>
                
                {fileError && (
                  <p className="text-sm text-red-600">{fileError}</p>
                )}
              </div>
            )}
            
            {/* Text Input Interface */}
            {uploadMethod === 'type' && (
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Chapter Content
                  </label>
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
                
                <Textarea
                  value={formData.content}
                  onChange={(e) => handleChange('content', e.target.value)}
                  error={errors.content}
                  placeholder="Paste or type your chapter content here..."
                  className="flex-1 min-h-[400px] resize-none"
                  required
                />
                
                {!isWordCountValid && formData.content.length > 0 && (
                  <p className="mt-2 text-sm text-amber-600">
                    ⚠️ Chapters with fewer than 100 words may not generate meaningful scenes
                  </p>
                )}
              </div>
            )}

            {/* Chapter Preview Summary */}
            {formData.content && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Chapter Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Words:</span>
                    <span className="ml-1 font-medium">{wordCount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Read Time:</span>
                    <span className="ml-1 font-medium">{readTime} min</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Characters:</span>
                    <span className="ml-1 font-medium">{formData.content.length.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Paragraphs:</span>
                    <span className="ml-1 font-medium">{formData.content.split('\n\n').filter(p => p.trim()).length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 flex-shrink-0">
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              isLoading={isLoading}
              disabled={!isWordCountValid}
            >
              {isLoading ? 'Uploading...' : 'Upload Chapter'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}