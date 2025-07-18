import { useState } from 'react'
import { Button, Input, Textarea } from '../../shared/ui-components'

interface SceneExtractData {
  title: string
  description: string
  excerpt?: string
  emotional_tone?: string
  time_of_day?: string
  weather?: string
  characters: string[] // character names
  locations: string[] // location names
}

interface SceneExtractionPreviewProps {
  extractedScenes: SceneExtractData[]
  onScenesConfirm: (scenes: SceneExtractData[]) => Promise<void>
  onCancel: () => void
  isProcessing?: boolean
  chapterTitle: string
}

export function SceneExtractionPreview({
  extractedScenes,
  onScenesConfirm,
  onCancel,
  isProcessing = false,
  chapterTitle
}: SceneExtractionPreviewProps) {
  const [scenes, setScenes] = useState<SceneExtractData[]>(extractedScenes)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const updateScene = (index: number, updatedScene: SceneExtractData) => {
    setScenes(prev => prev.map((scene, i) => i === index ? updatedScene : scene))
  }

  const removeScene = (index: number) => {
    setScenes(prev => prev.filter((_, i) => i !== index))
  }

  const addNewScene = () => {
    const newScene: SceneExtractData = {
      title: `Scene ${scenes.length + 1}`,
      description: '',
      characters: [],
      locations: []
    }
    setScenes(prev => [...prev, newScene])
    setEditingIndex(scenes.length)
  }

  const handleConfirm = async () => {
    try {
      await onScenesConfirm(scenes)
    } catch (error) {
      console.error('Failed to confirm scenes:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">
            Review Extracted Scenes
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            AI found {scenes.length} scenes in "{chapterTitle}". Review and edit before generating images.
          </p>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Scene List */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            <div className="p-4 space-y-3">
              {scenes.map((scene, index) => (
                <div
                  key={index}
                  onClick={() => setEditingIndex(index)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    editingIndex === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {scene.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {scene.description}
                      </p>
                      <div className="flex items-center mt-2 space-x-2 text-xs text-gray-500">
                        {scene.characters.length > 0 && (
                          <span>👥 {scene.characters.length}</span>
                        )}
                        {scene.locations.length > 0 && (
                          <span>📍 {scene.locations.length}</span>
                        )}
                        {scene.emotional_tone && (
                          <span>😊 {scene.emotional_tone}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeScene(index)
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={addNewScene}
                className="w-full"
                size="sm"
              >
                + Add Scene
              </Button>
            </div>
          </div>

          {/* Scene Editor */}
          <div className="flex-1 overflow-y-auto">
            {editingIndex !== null && scenes[editingIndex] ? (
              <SceneEditor
                scene={scenes[editingIndex]}
                onUpdate={(updatedScene) => updateScene(editingIndex, updatedScene)}
                sceneNumber={editingIndex + 1}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <p>Select a scene to edit its details</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
          <div className="text-sm text-gray-600">
            {scenes.length} scenes ready for image generation
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              isLoading={isProcessing}
              disabled={scenes.length === 0}
            >
              {isProcessing ? 'Processing...' : `Generate Images for ${scenes.length} Scenes`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface SceneEditorProps {
  scene: SceneExtractData
  onUpdate: (scene: SceneExtractData) => void
  sceneNumber: number
}

function SceneEditor({ scene, onUpdate, sceneNumber }: SceneEditorProps) {
  const handleFieldChange = (field: keyof SceneExtractData, value: string | string[]) => {
    onUpdate({ ...scene, [field]: value })
  }

  const handleArrayFieldChange = (field: 'characters' | 'locations', value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item.length > 0)
    handleFieldChange(field, items)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Edit Scene {sceneNumber}
        </h3>
        <div className="text-sm text-gray-500">
          Scene #{sceneNumber}
        </div>
      </div>

      <div className="space-y-4">
        <Input
          label="Scene Title"
          value={scene.title}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          placeholder="Enter a descriptive title for this scene"
        />

        <Textarea
          label="Scene Description"
          value={scene.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          placeholder="Describe what happens in this scene for image generation"
          rows={3}
          helperText="This description will be used to generate the scene image"
        />

        <Textarea
          label="Key Excerpt (Optional)"
          value={scene.excerpt || ''}
          onChange={(e) => handleFieldChange('excerpt', e.target.value)}
          placeholder="Copy a key passage that represents this scene"
          rows={2}
          helperText="This excerpt will be displayed with the scene image"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Emotional Tone"
            value={scene.emotional_tone || ''}
            onChange={(e) => handleFieldChange('emotional_tone', e.target.value)}
            placeholder="e.g., tense, joyful, mysterious"
          />

          <Input
            label="Time of Day"
            value={scene.time_of_day || ''}
            onChange={(e) => handleFieldChange('time_of_day', e.target.value)}
            placeholder="e.g., dawn, noon, midnight"
          />

          <Input
            label="Weather"
            value={scene.weather || ''}
            onChange={(e) => handleFieldChange('weather', e.target.value)}
            placeholder="e.g., stormy, clear, foggy"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Characters"
              value={scene.characters.join(', ')}
              onChange={(e) => handleArrayFieldChange('characters', e.target.value)}
              placeholder="Enter character names, separated by commas"
              helperText={`${scene.characters.length} characters`}
            />
            {scene.characters.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {scene.characters.map((char, index) => (
                  <span
                    key={index}
                    className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                  >
                    {char}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <Input
              label="Locations"
              value={scene.locations.join(', ')}
              onChange={(e) => handleArrayFieldChange('locations', e.target.value)}
              placeholder="Enter location names, separated by commas"
              helperText={`${scene.locations.length} locations`}
            />
            {scene.locations.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {scene.locations.map((loc, index) => (
                  <span
                    key={index}
                    className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                  >
                    {loc}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
        <div className="text-sm space-y-2">
          <div>
            <span className="font-medium">Title:</span> {scene.title}
          </div>
          <div>
            <span className="font-medium">Description:</span> {scene.description}
          </div>
          {scene.excerpt && (
            <div>
              <span className="font-medium">Excerpt:</span> "{scene.excerpt}"
            </div>
          )}
          <div className="flex flex-wrap gap-4 mt-2">
            {scene.emotional_tone && (
              <span className="text-purple-600">😊 {scene.emotional_tone}</span>
            )}
            {scene.time_of_day && (
              <span className="text-orange-600">🕐 {scene.time_of_day}</span>
            )}
            {scene.weather && (
              <span className="text-blue-600">🌤️ {scene.weather}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}