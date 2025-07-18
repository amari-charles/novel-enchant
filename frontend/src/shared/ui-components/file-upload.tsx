import React, { useCallback, useState } from 'react'

interface FileUploadProps {
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  onFileSelect: (files: File[]) => void
  onError?: (error: string) => void
  children?: React.ReactNode
  className?: string
  disabled?: boolean
}

export function FileUpload({
  accept = '*',
  multiple = false,
  maxSize = 10,
  onFileSelect,
  onError,
  children,
  className = '',
  disabled = false
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const validateFiles = (files: File[]): File[] => {
    const validFiles: File[] = []
    
    for (const file of files) {
      if (file.size > maxSize * 1024 * 1024) {
        onError?.(`File "${file.name}" is too large. Maximum size is ${maxSize}MB.`)
        continue
      }
      validFiles.push(file)
    }
    
    return validFiles
  }

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const fileArray = Array.from(files)
    const validFiles = validateFiles(fileArray)
    
    if (validFiles.length > 0) {
      onFileSelect(validFiles)
    }
  }, [onFileSelect, maxSize, onError])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled) return
    
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect, disabled])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
  }

  const baseClasses = `
    border-2 border-dashed rounded-lg p-6 text-center transition-colors
    ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
  `

  return (
    <div
      className={`${baseClasses} ${className}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !disabled && document.getElementById('file-input')?.click()}
    >
      <input
        id="file-input"
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
      
      {children || (
        <div>
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-gray-600 mb-2">
            {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-sm text-gray-500">
            Maximum file size: {maxSize}MB
          </p>
        </div>
      )}
    </div>
  )
}