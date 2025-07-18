import { useState } from 'react'
import { Button, Card } from '../../shared/ui-components'
import { PromptHistory } from './prompt-history'
import type { Scene, CharacterReferenceImage } from '../../shared/type-definitions'

interface PromptAttempt {
  id: string
  prompt: string
  image_url?: string
  created_at: string
  success: boolean
  error_message?: string
  user_rating?: number
  character_refs_used?: string[]
  style_modifiers?: string[]
}

interface SceneRetryToolsProps {
  scene: Scene
  onRetryGeneration: (sceneId: string, customPrompt?: string) => Promise<void>
  onSelectPreviousVersion: (attempt: PromptAttempt) => void
  isGenerating?: boolean
}

// Mock data for development
const mockPromptHistory: Record<string, PromptAttempt[]> = {
  'scene1': [
    {
      id: 'attempt1',
      prompt: 'A young woman with auburn hair approaches an ancient stone tower during a fierce storm, rain-soaked stones gleaming in the lightning, dark dramatic clouds overhead, fantasy art style',
      image_url: 'https://images.unsplash.com/photo-1520637836862-4d197d17c55a?w=400&h=300&fit=crop',
      created_at: '2024-01-15T10:30:00Z',
      success: true,
      user_rating: 4,
      character_refs_used: ['Elara - Portrait'],
      style_modifiers: ['dramatic lighting', 'stormy atmosphere']
    },
    {
      id: 'attempt2',
      prompt: 'Ancient tower with massive oak doors, storm clouds, gothic architecture, moody lighting, fantasy illustration',
      image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
      created_at: '2024-01-15T10:45:00Z',
      success: true,
      user_rating: 3,
      style_modifiers: ['gothic', 'moody']
    },
    {
      id: 'attempt3',
      prompt: 'Elara in rain pushing heavy doors, close-up shot, determination in her eyes, water dripping, atmospheric',
      created_at: '2024-01-15T11:00:00Z',
      success: false,
      error_message: 'Character reference not found',
      character_refs_used: ['Elara - Battle Ready']
    }
  ]
}

const mockCharacterRefs: CharacterReferenceImage[] = [
  {
    id: 'ref1',
    character_id: 'char1',
    image_url: 'https://images.unsplash.com/photo-1494790108755-2616c58c1b05?w=100&h=100&fit=crop&crop=face',
    is_primary: true,
    description: 'Elara - Portrait'
  },
  {
    id: 'ref2',
    character_id: 'char1',
    image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    is_primary: false,
    description: 'Elara - Battle Ready'
  }
]

export function SceneRetryTools({
  scene,
  onRetryGeneration,
  onSelectPreviousVersion,
  isGenerating = false
}: SceneRetryToolsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedCharacterRefs, setSelectedCharacterRefs] = useState<string[]>([])
  const [showPromptDetails, setShowPromptDetails] = useState(false)

  const promptHistory = mockPromptHistory[scene.id] || []
  
  // Generate current prompt based on scene data
  const generateCurrentPrompt = () => {
    const parts = []
    
    // Base scene description
    parts.push(scene.description)
    
    // Character information
    if (scene.characters.length > 0) {
      const characterNames = scene.characters.map(sc => sc.character.name).join(', ')
      parts.push(`Characters: ${characterNames}`)
    }
    
    // Location information
    if (scene.locations.length > 0) {
      const locationNames = scene.locations.map(sl => sl.location.name).join(', ')
      parts.push(`Setting: ${locationNames}`)
    }
    
    // Mood and atmosphere
    const atmosphereDetails = []
    if (scene.emotional_tone) atmosphereDetails.push(scene.emotional_tone)
    if (scene.time_of_day) atmosphereDetails.push(scene.time_of_day)
    if (scene.weather) atmosphereDetails.push(scene.weather)
    
    if (atmosphereDetails.length > 0) {
      parts.push(`Atmosphere: ${atmosphereDetails.join(', ')}`)
    }
    
    // Add style information
    parts.push('Fantasy art style, detailed illustration')
    
    return parts.join('. ')
  }

  const currentPrompt = generateCurrentPrompt()

  const handleRetryWithPrompt = async (customPrompt: string) => {
    await onRetryGeneration(scene.id, customPrompt)
  }

  const toggleCharacterRef = (refId: string) => {
    setSelectedCharacterRefs(prev => 
      prev.includes(refId) 
        ? prev.filter(id => id !== refId)
        : [...prev, refId]
    )
  }

  const getRelevantCharacterRefs = () => {
    // In a real app, this would filter based on characters in the scene
    return mockCharacterRefs
  }

  return (
    <div className="space-y-4">
      {/* Quick Retry Options */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => handleRetryWithPrompt(currentPrompt)}
          disabled={isGenerating}
          isLoading={isGenerating}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          🔄 Quick Retry
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          disabled={isGenerating}
        >
          ⚙️ Advanced Options
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowPromptDetails(!showPromptDetails)}
        >
          🔍 Prompt Details
        </Button>
      </div>

      {/* Prompt Details */}
      {showPromptDetails && (
        <Card className="p-4">
          <h4 className="font-medium text-gray-900 mb-3">Generation Details</h4>
          
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Current Prompt:</span>
              <div className="mt-1 p-2 bg-gray-50 rounded text-gray-600 font-mono text-xs">
                {currentPrompt}
              </div>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Characters in Scene:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {scene.characters.length > 0 ? (
                  scene.characters.map((sc, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {sc.character.name} ({sc.importance})
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-xs">No characters specified</span>
                )}
              </div>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Scene Atmosphere:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {scene.emotional_tone && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                    😊 {scene.emotional_tone}
                  </span>
                )}
                {scene.time_of_day && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                    🕐 {scene.time_of_day}
                  </span>
                )}
                {scene.weather && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    🌤️ {scene.weather}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Advanced Options */}
      {showAdvanced && (
        <Card className="p-4">
          <h4 className="font-medium text-gray-900 mb-4">Advanced Generation Options</h4>
          
          <div className="space-y-4">
            {/* Character Reference Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Character References to Include
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {getRelevantCharacterRefs().map((ref) => (
                  <div
                    key={ref.id}
                    onClick={() => toggleCharacterRef(ref.id)}
                    className={`cursor-pointer border-2 rounded-lg p-2 transition-colors ${
                      selectedCharacterRefs.includes(ref.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={ref.image_url}
                      alt={ref.description}
                      className="w-full h-16 object-cover rounded mb-2"
                    />
                    <p className="text-xs font-medium text-gray-900 text-center">
                      {ref.description}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Selected references will be used to guide character appearance in the generated image
              </p>
            </div>
            
            {/* Style Modifiers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Style Modifiers
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'cinematic lighting',
                  'dramatic composition',
                  'soft focus',
                  'high contrast',
                  'warm tones',
                  'cool tones',
                  'detailed background',
                  'close-up shot',
                  'wide angle'
                ].map((modifier) => (
                  <button
                    key={modifier}
                    className="px-3 py-1 text-xs border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    {modifier}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-2 pt-2">
              <Button
                onClick={() => {
                  // Generate prompt with selected options
                  let enhancedPrompt = currentPrompt
                  if (selectedCharacterRefs.length > 0) {
                    enhancedPrompt += '. Use character references for accurate appearance.'
                  }
                  handleRetryWithPrompt(enhancedPrompt)
                }}
                disabled={isGenerating}
                isLoading={isGenerating}
              >
                Generate with Options
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAdvanced(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Prompt History Component */}
      <PromptHistory
        currentPrompt={currentPrompt}
        promptHistory={promptHistory}
        onRetryWithPrompt={handleRetryWithPrompt}
        onSelectPreviousVersion={onSelectPreviousVersion}
        isGenerating={isGenerating}
      />
    </div>
  )
}