
interface StylePreviewProps {
  selectedStyle: string
  onStyleSelect: (style: string) => void
  className?: string
}

const STYLE_SAMPLES = {
  fantasy: {
    name: 'Fantasy',
    description: 'Magical, ethereal artwork with rich colors',
    preview: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=150&h=100&fit=crop',
    examples: [
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=60&h=60&fit=crop',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=60&h=60&fit=crop',
      'https://images.unsplash.com/photo-1520637836862-4d197d17c55a?w=60&h=60&fit=crop'
    ]
  },
  scifi: {
    name: 'Sci-Fi',
    description: 'Futuristic, cyberpunk atmosphere with neon highlights',
    preview: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=150&h=100&fit=crop',
    examples: [
      'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=60&h=60&fit=crop',
      'https://images.unsplash.com/photo-1484589065579-248aad0d8b13?w=60&h=60&fit=crop',
      'https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=60&h=60&fit=crop'
    ]
  },
  romance: {
    name: 'Romance',
    description: 'Soft, warm tones with elegant composition',
    preview: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=150&h=100&fit=crop',
    examples: [
      'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=60&h=60&fit=crop',
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=60&h=60&fit=crop',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=60&h=60&fit=crop'
    ]
  },
  thriller: {
    name: 'Thriller',
    description: 'Dark, dramatic lighting with suspenseful mood',
    preview: 'https://images.unsplash.com/photo-1520637736862-4d197d17c55a?w=150&h=100&fit=crop',
    examples: [
      'https://images.unsplash.com/photo-1520637736862-4d197d17c55a?w=60&h=60&fit=crop',
      'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=60&h=60&fit=crop',
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=60&h=60&fit=crop'
    ]
  },
  historical: {
    name: 'Historical',
    description: 'Period-accurate details with classical painting style',
    preview: 'https://images.unsplash.com/photo-1541959833400-049d37f98ccd?w=150&h=100&fit=crop',
    examples: [
      'https://images.unsplash.com/photo-1541959833400-049d37f98ccd?w=60&h=60&fit=crop',
      'https://images.unsplash.com/photo-1504198266287-1659872e6590?w=60&h=60&fit=crop',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=60&h=60&fit=crop'
    ]
  },
  contemporary: {
    name: 'Contemporary',
    description: 'Modern, realistic style with natural lighting',
    preview: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=150&h=100&fit=crop',
    examples: [
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=60&h=60&fit=crop',
      'https://images.unsplash.com/photo-1494790108755-2616c58c1b05?w=60&h=60&fit=crop',
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=60&h=60&fit=crop'
    ]
  }
}

export function StylePreview({ selectedStyle, onStyleSelect, className = '' }: StylePreviewProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Illustration Style
      </label>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(STYLE_SAMPLES).map(([styleKey, style]) => (
          <div
            key={styleKey}
            onClick={() => onStyleSelect(styleKey)}
            className={`
              relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md
              ${selectedStyle === styleKey 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            {/* Style Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-gray-900">{style.name}</h3>
                <p className="text-sm text-gray-600">{style.description}</p>
              </div>
              <div className={`
                w-4 h-4 rounded-full border-2 flex items-center justify-center
                ${selectedStyle === styleKey 
                  ? 'border-blue-500 bg-blue-500' 
                  : 'border-gray-300'
                }
              `}>
                {selectedStyle === styleKey && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            </div>

            {/* Sample Images */}
            <div className="flex space-x-2">
              <img
                src={style.preview}
                alt={`${style.name} style preview`}
                className="w-20 h-16 object-cover rounded border"
              />
              <div className="flex flex-col space-y-1">
                {style.examples.slice(0, 2).map((example, index) => (
                  <img
                    key={index}
                    src={example}
                    alt={`${style.name} example ${index + 1}`}
                    className="w-12 h-7 object-cover rounded border"
                  />
                ))}
              </div>
            </div>

            {/* Selection Indicator */}
            {selectedStyle === styleKey && (
              <div className="absolute top-2 right-2">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Advanced Options */}
      {selectedStyle && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            {STYLE_SAMPLES[selectedStyle as keyof typeof STYLE_SAMPLES].name} Style Selected
          </h4>
          <p className="text-sm text-gray-600">
            Your scenes will be generated with{' '}
            {STYLE_SAMPLES[selectedStyle as keyof typeof STYLE_SAMPLES].description.toLowerCase()}.
            You can change this later in your story settings.
          </p>
        </div>
      )}
    </div>
  )
}