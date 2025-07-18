import { useState, useEffect } from 'react'
import { Button } from '../../shared/ui-components/button'
import { Card, CardContent, CardHeader } from '../../shared/ui-components/card'
import type { Character } from '../../shared/type-definitions'

interface CharacterDetailPageProps {
  storyId: string
  characterId: string
  onBackToRoster: () => void
  onEditCharacter?: (characterId: string) => void
}

interface EditCharacterFormData {
  name: string
  base_description: string
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  image_url?: string
}

interface FormErrors {
  name?: string
  base_description?: string
  role?: string
}

// Mock data for development - matches the structure from character-roster.tsx
const mockCharacters: Character[] = [
  {
    id: 'char1',
    story_id: '1',
    name: 'Elara Valdris',
    base_description: 'A determined young woman in her early twenties with auburn hair and emerald eyes. She possesses untapped magical potential and seeks to reclaim her family\'s stolen grimoire.',
    role: 'protagonist',
    primary_reference_image: {
      id: 'ref1',
      character_id: 'char1',
      image_url: 'https://images.unsplash.com/photo-1494790108755-2616c58c1b05?w=400&h=400&fit=crop&crop=face',
      is_primary: true,
      description: 'Portrait of Elara with auburn hair and emerald eyes'
    },
    is_active: true
  },
  {
    id: 'char2',
    story_id: '1',
    name: 'The Keeper',
    base_description: 'An enigmatic figure cloaked in shadows, the Keeper guards the ancient knowledge hidden within the Ethereal Library. Their true identity remains unknown.',
    role: 'supporting',
    primary_reference_image: {
      id: 'ref2',
      character_id: 'char2',
      image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      is_primary: true,
      description: 'Shadowy figure in hooded robes'
    },
    is_active: true
  }
]

const getRoleColor = (role: string) => {
  const colors = {
    protagonist: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    antagonist: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
    mentor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
    ally: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
    supporting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
  }
  return colors[role as keyof typeof colors] || colors.neutral
}

export function CharacterDetailPage({ 
  storyId, 
  characterId, 
  onBackToRoster, 
  onEditCharacter: _onEditCharacter 
}: CharacterDetailPageProps) {
  const [character, setCharacter] = useState<Character | null>(null)
  // const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<EditCharacterFormData>({
    name: '',
    base_description: '',
    role: 'supporting',
    image_url: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load character data
  useEffect(() => {
    // In a real app, this would be an API call
    const foundCharacter = mockCharacters.find(c => c.id === characterId && c.story_id === storyId)
    setCharacter(foundCharacter || null)
    
    // Populate form data when character is loaded
    if (foundCharacter) {
      setFormData({
        name: foundCharacter.name,
        base_description: foundCharacter.base_description,
        role: foundCharacter.role || 'supporting',
        image_url: foundCharacter.primary_reference_image?.image_url || ''
      })
    }
  }, [characterId, storyId])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.base_description.trim()) {
      newErrors.base_description = 'Description is required'
    } else if (formData.base_description.trim().length < 10) {
      newErrors.base_description = 'Description must be at least 10 characters'
    }

    if (!formData.role) {
      newErrors.role = 'Role is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveCharacter = async () => {
    if (!validateForm()) return

    try {
      setIsSaving(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update character with form data
      if (character) {
        const updatedCharacter: Character = {
          ...character,
          name: formData.name.trim(),
          base_description: formData.base_description.trim(),
          role: formData.role,
          primary_reference_image: formData.image_url ? {
            id: character.primary_reference_image?.id || `ref_${Date.now()}`,
            character_id: character.id,
            image_url: formData.image_url,
            is_primary: true,
            description: `Portrait of ${formData.name}`
          } : undefined
        }
        
        setCharacter(updatedCharacter)
        setIsEditing(false)
        console.log('Character updated successfully:', updatedCharacter)
      }
    } catch (error) {
      console.error('Failed to update character:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleFormChange = (field: keyof EditCharacterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }


  const handleStartEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setErrors({})
    // Reset form data to original character data
    if (character) {
      setFormData({
        name: character.name,
        base_description: character.base_description,
        role: character.role || 'supporting',
        image_url: character.primary_reference_image?.image_url || ''
      })
    }
  }

  const handleDeleteCharacter = async () => {
    if (!character) return

    try {
      setIsDeleting(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Navigate back to character roster after deletion
      console.log('Character deleted successfully:', character.name)
      onBackToRoster()
    } catch (error) {
      console.error('Failed to delete character:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }


  if (!character) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Character not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={onBackToRoster}
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Character Roster
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{character.name}</h1>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(character.role || 'supporting')}`}>
                  {(character.role || 'supporting').charAt(0).toUpperCase() + (character.role || 'supporting').slice(1)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleStartEdit}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Character
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Character
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Character Images */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Character Images</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Main Image */}
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    {character.primary_reference_image ? (
                      <img
                        src={character.primary_reference_image.image_url}
                        alt={character.primary_reference_image.description || character.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Image Description */}
                  {character.primary_reference_image?.description && (
                    <p className="text-sm text-muted-foreground text-center">
                      {character.primary_reference_image.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Character Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Description</h2>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed">{character.base_description}</p>
              </CardContent>
            </Card>


          </div>
        </div>

        {/* Edit Character Form Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Edit Character</h3>
                  <Button 
                    variant="ghost" 
                    onClick={handleCancelEdit}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              </div>
              
              <div className="px-6 py-4 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Character Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter character name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleFormChange('role', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.role ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="protagonist">Protagonist</option>
                    <option value="antagonist">Antagonist</option>
                    <option value="supporting">Supporting</option>
                    <option value="minor">Minor</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-500">{errors.role}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.base_description}
                    onChange={(e) => handleFormChange('base_description', e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                      errors.base_description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Describe the character's appearance, background, and key characteristics"
                  />
                  {errors.base_description && (
                    <p className="mt-1 text-sm text-red-500">{errors.base_description}</p>
                  )}
                </div>


                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.image_url || ''}
                    onChange={(e) => handleFormChange('image_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/character-image.jpg"
                  />
                  {formData.image_url && (
                    <div className="mt-2">
                      <img
                        src={formData.image_url}
                        alt="Character preview"
                        className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveCharacter}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && character && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Delete Character</h3>
              </div>
              
              <div className="px-6 py-4">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete "{character.name}"? This action cannot be undone and will permanently remove this character from your story.
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-sm text-red-800">
                      This will permanently delete the character and cannot be undone.
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteCharacter}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Character'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}