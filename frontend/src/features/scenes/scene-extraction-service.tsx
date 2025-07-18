import React, { useState } from 'react'
import { Button } from '../../shared/ui-components'
import { SceneExtractionPreview } from './scene-extraction-preview'
import type { Chapter, Scene } from '../../shared/type-definitions'

interface SceneExtractData {
  title: string
  description: string
  excerpt?: string
  emotional_tone?: string
  time_of_day?: string
  weather?: string
  characters: string[]
  locations: string[]
}

interface SceneExtractionServiceProps {
  chapter: Chapter
  onComplete: (scenes: Scene[]) => void
  onCancel: () => void
}

export function SceneExtractionService({
  chapter,
  onComplete,
  onCancel
}: SceneExtractionServiceProps) {
  const [extractionStatus, setExtractionStatus] = useState<'extracting' | 'preview' | 'processing'>('extracting')
  const [extractedScenes, setExtractedScenes] = useState<SceneExtractData[]>([])
  // const [isLoading, setIsLoading] = useState(false)

  // Mock scene extraction - in real app this would call AI service
  React.useEffect(() => {
    const extractScenes = async () => {
      
      // Simulate AI extraction delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock extracted scenes based on chapter content
      const mockScenes: SceneExtractData[] = [
        {
          title: "The Mysterious Arrival",
          description: "A hooded figure approaches the ancient castle gates under the cover of darkness, carrying a mysterious artifact that glows with an otherworldly light.",
          excerpt: "The shadows parted as the figure stepped into the moonlight, revealing eyes that burned with an inner fire.",
          emotional_tone: "mysterious",
          time_of_day: "midnight",
          weather: "misty",
          characters: ["The Hooded Figure", "Castle Guard"],
          locations: ["Ancient Castle Gates", "Moonlit Courtyard"]
        },
        {
          title: "The Council's Decision",
          description: "The royal council gathers in the great hall to debate the fate of the kingdom, with tensions running high as old alliances are questioned.",
          excerpt: "\"We cannot ignore the signs any longer,\" the elder council member declared, his voice echoing through the vaulted chamber.",
          emotional_tone: "tense",
          time_of_day: "evening",
          weather: "clear",
          characters: ["King Aldric", "Elder Councilman", "Lady Vera"],
          locations: ["Great Hall", "Royal Palace"]
        },
        {
          title: "The Forest Encounter",
          description: "Deep in the enchanted forest, our heroes encounter magical creatures that will either aid or hinder their quest.",
          excerpt: "The trees seemed to whisper secrets as ancient as time itself, and the very air shimmered with magic.",
          emotional_tone: "wonder",
          time_of_day: "dawn",
          weather: "dappled sunlight",
          characters: ["Hero", "Forest Spirit", "Companion"],
          locations: ["Enchanted Forest", "Sacred Grove"]
        }
      ]
      
      setExtractedScenes(mockScenes)
      setExtractionStatus('preview')
    }

    extractScenes()
  }, [chapter])

  const handleScenesConfirm = async (confirmedScenes: SceneExtractData[]) => {
    setExtractionStatus('processing')

    try {
      // Convert SceneExtractData to Scene objects
      const scenes: Scene[] = confirmedScenes.map((sceneData, index) => ({
        id: `scene-${chapter.id}-${index}`,
        chapter_id: chapter.id,
        scene_number: index + 1,
        title: sceneData.title,
        description: sceneData.description,
        excerpt: sceneData.excerpt,
        emotional_tone: sceneData.emotional_tone,
        time_of_day: sceneData.time_of_day,
        weather: sceneData.weather,
        processing_status: 'pending' as const,
        images: [],
        characters: [], // Would be populated from the character names
        locations: []   // Would be populated from the location names
      }))

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onComplete(scenes)
    } catch (error) {
      console.error('Failed to process scenes:', error)
    }
  }

  if (extractionStatus === 'extracting') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Extracting Scenes
            </h3>
            <p className="text-gray-600 mb-4">
              AI is analyzing "{chapter.title}" to identify visual scenes...
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>Analyzing chapter content</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span>Identifying key scenes</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span>Extracting characters and locations</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="mt-6"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (extractionStatus === 'preview') {
    return (
      <SceneExtractionPreview
        extractedScenes={extractedScenes}
        onScenesConfirm={handleScenesConfirm}
        onCancel={onCancel}
        isProcessing={false}
        chapterTitle={chapter.title}
      />
    )
  }

  if (extractionStatus === 'processing') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Processing Scenes
            </h3>
            <p className="text-gray-600 mb-4">
              Setting up scenes for image generation...
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
            </div>
            <p className="text-sm text-gray-500">
              This will only take a moment
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}