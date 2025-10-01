import { useState } from 'react'
import { Button, Card, CardContent } from '../shared/ui-components'
import type { AIAnalysisResult } from '../services/ai-analysis'
// import type { CreateStoryForm } from '../shared/type-definitions'

interface CreateStoryForm {
  title?: string
  description?: string
  genre?: string
  style_preset?: string
}

interface AIAnalysisPreviewProps {
  analysis: AIAnalysisResult
  onFieldChange: (field: keyof CreateStoryForm, value: string) => void
  onStyleChange: (style: CreateStoryForm['style_preset']) => void
  isAnalyzing?: boolean
}

const stylePresets = [
  { value: 'fantasy', label: 'Fantasy', description: 'Magical worlds and epic adventures' },
  { value: 'scifi', label: 'Science Fiction', description: 'Futuristic technology and space exploration' },
  { value: 'romance', label: 'Romance', description: 'Love stories and emotional journeys' },
  { value: 'thriller', label: 'Thriller', description: 'Suspense, mystery, and high-stakes drama' },
  { value: 'historical', label: 'Historical', description: 'Period pieces and authentic settings' },
  { value: 'contemporary', label: 'Contemporary', description: 'Modern-day stories and realistic settings' }
] as const

export function AIAnalysisPreview({ 
  analysis, 
  onFieldChange, 
  onStyleChange, 
  isAnalyzing = false 
}: AIAnalysisPreviewProps) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValues, setEditValues] = useState({
    title: analysis.title,
    description: analysis.description,
    genre: analysis.genre
  })

  const handleEdit = (field: string) => {
    setEditingField(field)
    setEditValues(prev => ({
      ...prev,
      [field]: analysis[field as keyof typeof analysis] as string
    }))
  }

  const handleSave = (field: string) => {
    onFieldChange(field as keyof CreateStoryForm, editValues[field as keyof typeof editValues])
    setEditingField(null)
  }

  const handleCancel = () => {
    setEditingField(null)
    setEditValues({
      title: analysis.title,
      description: analysis.description,
      genre: analysis.genre
    })
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceText = (score: number) => {
    if (score >= 0.8) return 'High confidence'
    if (score >= 0.6) return 'Medium confidence'
    return 'Low confidence'
  }

  if (isAnalyzing) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Analyzing Your Story</h3>
              <p className="text-muted-foreground">
                AI is extracting themes, characters, and generating metadata...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">AI Analysis Results</h3>
            <div className="text-sm text-muted-foreground">
              Click any field to edit
            </div>
          </div>

          {/* Title Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Story Title</label>
              <div className="flex items-center space-x-2">
                <span className={`text-xs ${getConfidenceColor(analysis.confidence_scores.title)}`}>
                  {getConfidenceText(analysis.confidence_scores.title)}
                </span>
                <div className="w-16 bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${analysis.confidence_scores.title * 100}%` }}
                  />
                </div>
              </div>
            </div>
            {editingField === 'title' ? (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={editValues.title}
                  onChange={(e) => setEditValues(prev => ({ ...prev, title: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  autoFocus
                />
                <Button size="sm" onClick={() => handleSave('title')}>Save</Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
              </div>
            ) : (
              <div 
                className="p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleEdit('title')}
              >
                <p className="font-medium text-foreground">{analysis.title}</p>
                <p className="text-sm text-muted-foreground">Click to edit</p>
              </div>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Description</label>
              <div className="flex items-center space-x-2">
                <span className={`text-xs ${getConfidenceColor(analysis.confidence_scores.description)}`}>
                  {getConfidenceText(analysis.confidence_scores.description)}
                </span>
                <div className="w-16 bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${analysis.confidence_scores.description * 100}%` }}
                  />
                </div>
              </div>
            </div>
            {editingField === 'description' ? (
              <div className="space-y-2">
                <textarea
                  value={editValues.description}
                  onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={3}
                  autoFocus
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={() => handleSave('description')}>Save</Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div 
                className="p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleEdit('description')}
              >
                <p className="text-foreground">{analysis.description}</p>
                <p className="text-sm text-muted-foreground mt-1">Click to edit</p>
              </div>
            )}
          </div>

          {/* Genre Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Genre</label>
              <div className="flex items-center space-x-2">
                <span className={`text-xs ${getConfidenceColor(analysis.confidence_scores.genre)}`}>
                  {getConfidenceText(analysis.confidence_scores.genre)}
                </span>
                <div className="w-16 bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${analysis.confidence_scores.genre * 100}%` }}
                  />
                </div>
              </div>
            </div>
            {editingField === 'genre' ? (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={editValues.genre}
                  onChange={(e) => setEditValues(prev => ({ ...prev, genre: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  autoFocus
                />
                <Button size="sm" onClick={() => handleSave('genre')}>Save</Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
              </div>
            ) : (
              <div 
                className="p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleEdit('genre')}
              >
                <p className="font-medium text-foreground capitalize">{analysis.genre}</p>
                <p className="text-sm text-muted-foreground">Click to edit</p>
              </div>
            )}
          </div>

          {/* Style Preset */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Visual Style</label>
              <div className="flex items-center space-x-2">
                <span className={`text-xs ${getConfidenceColor(analysis.confidence_scores.style_preset)}`}>
                  {getConfidenceText(analysis.confidence_scores.style_preset)}
                </span>
                <div className="w-16 bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${analysis.confidence_scores.style_preset * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {stylePresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => onStyleChange(preset.value)}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    analysis.style_preset === preset.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <div className="font-medium">{preset.label}</div>
                  <div className="text-sm text-muted-foreground">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Additional Insights */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Additional Insights</h4>
            
            {analysis.extracted_characters.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-foreground mb-2">Detected Characters</h5>
                <div className="flex flex-wrap gap-2">
                  {analysis.extracted_characters.map((character, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {character}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysis.detected_themes.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-foreground mb-2">Detected Themes</h5>
                <div className="flex flex-wrap gap-2">
                  {analysis.detected_themes.map((theme, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(analysis.time_period || analysis.setting_type) && (
              <div className="grid grid-cols-2 gap-4">
                {analysis.time_period && (
                  <div>
                    <h5 className="text-sm font-medium text-foreground mb-1">Time Period</h5>
                    <p className="text-sm text-muted-foreground capitalize">{analysis.time_period}</p>
                  </div>
                )}
                {analysis.setting_type && (
                  <div>
                    <h5 className="text-sm font-medium text-foreground mb-1">Setting Type</h5>
                    <p className="text-sm text-muted-foreground capitalize">{analysis.setting_type}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}