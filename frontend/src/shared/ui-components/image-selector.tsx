import React, { useState } from 'react'
import { Button } from './button'
import { FileUpload } from './file-upload'

interface ImageSelectorProps {
  currentImage?: string
  onImageSelect: (imageUrl: string) => void
  onImageUpload?: (file: File) => Promise<string>
  label?: string
  showPresets?: boolean
}

const PRESET_COVERS = [
  {
    id: 'fantasy-1',
    url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=400&fit=crop',
    title: 'Mystical Forest'
  },
  {
    id: 'fantasy-2', 
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=400&fit=crop',
    title: 'Ancient Castle'
  },
  {
    id: 'scifi-1',
    url: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=300&h=400&fit=crop',
    title: 'Space Explorer'
  },
  {
    id: 'scifi-2',
    url: 'https://images.unsplash.com/photo-1484589065579-248aad0d8b13?w=300&h=400&fit=crop',
    title: 'Futuristic City'
  },
  {
    id: 'romance-1',
    url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=300&h=400&fit=crop',
    title: 'Romantic Garden'
  },
  {
    id: 'thriller-1',
    url: 'https://images.unsplash.com/photo-1520637736862-4d197d17c55a?w=300&h=400&fit=crop',
    title: 'Dark Alley'
  }
]

export function ImageSelector({ 
  currentImage, 
  onImageSelect, 
  onImageUpload, 
  label = "Cover Image",
  showPresets = true 
}: ImageSelectorProps) {
  const [showUpload, setShowUpload] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = async (files: File[]) => {
    if (!onImageUpload || files.length === 0) return
    
    setIsUploading(true)
    try {
      const imageUrl = await onImageUpload(files[0])
      onImageSelect(imageUrl)
      setShowUpload(false)
    } catch (error) {
      console.error('Failed to upload image:', error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      {/* Current Selection */}
      {currentImage && (
        <div className="relative w-32 h-40 mx-auto">
          <img
            src={currentImage}
            alt="Selected cover"
            className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
          />
          <button
            onClick={() => onImageSelect('')}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Preset Options */}
      {showPresets && !currentImage && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Choose a preset:</h4>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_COVERS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onImageSelect(preset.url)}
                className="relative group"
              >
                <img
                  src={preset.url}
                  alt={preset.title}
                  className="w-full h-24 object-cover rounded border-2 border-transparent hover:border-blue-500 transition-colors"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded transition-opacity" />
                <div className="absolute bottom-1 left-1 right-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  {preset.title}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Upload Options */}
      <div className="flex justify-center space-x-2">
        {onImageUpload && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUpload(!showUpload)}
          >
            {showUpload ? 'Cancel Upload' : 'Upload Custom'}
          </Button>
        )}
        {currentImage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onImageSelect('')}
          >
            Remove Image
          </Button>
        )}
      </div>

      {/* Upload Interface */}
      {showUpload && onImageUpload && (
        <FileUpload
          accept="image/*"
          maxSize={5}
          onFileSelect={handleFileUpload}
          disabled={isUploading}
          className="max-w-sm mx-auto"
        >
          <div>
            <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-600">
              {isUploading ? 'Uploading...' : 'Drop your cover image here'}
            </p>
          </div>
        </FileUpload>
      )}
    </div>
  )
}