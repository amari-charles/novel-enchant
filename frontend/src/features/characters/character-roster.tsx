import { useState, useEffect } from 'react'
import { Button } from '../../shared/ui-components'
import { CharacterCard } from './character-card'
import type { Character } from '../../shared/type-definitions'

interface CharacterRosterProps {
  storyId: string
  onClose?: () => void
  onCharacterClick?: (characterId: string) => void
  isModal?: boolean
}

interface CharacterFormData {
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

// Mock data for development
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
    base_description: 'An elderly but powerful mage who has guarded the Repository of the Arcane for decades. He wears midnight-blue robes embroidered with silver stars and possesses deep wisdom about ancient magic.',
    role: 'supporting',
    primary_reference_image: {
      id: 'ref2',
      character_id: 'char2',
      image_url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face',
      is_primary: true,
      description: 'Elderly mage with wise eyes and silver beard'
    },
    is_active: true
  },
  {
    id: 'char3',
    story_id: '1',
    name: 'Lord Malachar',
    base_description: 'The dark sorcerer who destroyed House Valdris and stole their ancient grimoire. His presence is felt throughout the story even when he doesn\'t appear directly.',
    role: 'antagonist',
    is_active: true
  },
  {
    id: 'char4',
    story_id: '1',
    name: 'Finn the Scribe',
    base_description: 'A nervous young apprentice who works in the Repository. He has knowledge of the catalog system and often provides helpful information.',
    role: 'minor',
    is_active: true
  }
]

export function CharacterRoster({ storyId, onClose, onCharacterClick, isModal = false }: CharacterRosterProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  // const [isLoading, setIsLoading] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [filterRole, setFilterRole] = useState<string>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState<CharacterFormData>({
    name: '',
    base_description: '',
    role: 'supporting',
    image_url: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    const loadCharacters = async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))
      setCharacters(mockCharacters)
    }
    
    loadCharacters()
  }, [storyId])

  const handleCharacterClick = (character: Character) => {
    if (onCharacterClick) {
      onCharacterClick(character.id)
    } else {
      setSelectedCharacter(character)
    }
  }

  const filteredCharacters = characters.filter(character => {
    if (filterRole === 'all') return true
    return character.role === filterRole
  })

  const getRoleCount = (role: string) => {
    if (role === 'all') return characters.length
    return characters.filter(c => c.role === role).length
  }

  const resetForm = () => {
    setFormData({
      name: '',
      base_description: '',
      role: 'supporting',
      image_url: ''
    })
    setErrors({})
  }

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

  const handleAddCharacter = async () => {
    if (!validateForm()) return

    try {
      setIsAdding(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      const newCharacter: Character = {
        id: `char_${Date.now()}`,
        story_id: storyId,
        name: formData.name.trim(),
        base_description: formData.base_description.trim(),
        role: formData.role,
        primary_reference_image: formData.image_url ? {
          id: `ref_${Date.now()}`,
          character_id: `char_${Date.now()}`,
          image_url: formData.image_url,
          is_primary: true,
          description: `Portrait of ${formData.name}`
        } : undefined,
        is_active: true
      }

      setCharacters(prev => [...prev, newCharacter])
      setShowAddForm(false)
      resetForm()
      console.log('Character added successfully:', newCharacter)
    } catch (error) {
      console.error('Failed to add character:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleFormChange = (field: keyof CharacterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }


  const Content = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          {!isModal && onClose && (
            <button 
              onClick={onClose}
              className="mr-4 flex items-center p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Back to Story</span>
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Character Roster</h2>
            <p className="text-gray-600">Characters discovered in your story</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Character</span>
          </Button>
          {isModal && onClose && (
            <Button variant="ghost" onClick={onClose}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          )}
        </div>
      </div>

      {/* Role Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'all', label: 'All Characters', count: getRoleCount('all') },
          { key: 'protagonist', label: 'Protagonists', count: getRoleCount('protagonist') },
          { key: 'antagonist', label: 'Antagonists', count: getRoleCount('antagonist') },
          { key: 'supporting', label: 'Supporting', count: getRoleCount('supporting') },
          { key: 'minor', label: 'Minor', count: getRoleCount('minor') }
        ].map(filter => (
          <button
            key={filter.key}
            onClick={() => setFilterRole(filter.key)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterRole === filter.key
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>

      {/* Characters Grid */}
      {filteredCharacters.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filterRole === 'all' ? 'No characters yet' : `No ${filterRole} characters`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filterRole === 'all' 
                ? 'Start building your character roster by adding characters manually or uploading chapters to have them extracted automatically.'
                : `No ${filterRole} characters have been identified in your story yet. Try adding characters manually or uploading more chapters.`
              }
            </p>
            {filterRole === 'all' && (
              <Button 
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 mx-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Your First Character</span>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCharacters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              onClick={() => handleCharacterClick(character)}
              showSceneCount={true}
            />
          ))}
        </div>
      )}

      {/* Character Detail Modal */}
      {selectedCharacter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedCharacter.name}
                </h3>
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedCharacter(null)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              {/* Character Image */}
              {selectedCharacter.primary_reference_image && (
                <div className="text-center">
                  <img
                    src={selectedCharacter.primary_reference_image.image_url}
                    alt={selectedCharacter.name}
                    className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-gray-200"
                  />
                </div>
              )}

              {/* Basic Info */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700">{selectedCharacter.base_description}</p>
              </div>

              {/* Character Role */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Role</h4>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  {(selectedCharacter.role || 'supporting').charAt(0).toUpperCase() + (selectedCharacter.role || 'supporting').slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Character Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Add New Character</h3>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowAddForm(false)
                    resetForm()
                  }}
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
                  value={formData.image_url}
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
                onClick={() => {
                  setShowAddForm(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCharacter}
                disabled={isAdding}
              >
                {isAdding ? 'Adding...' : 'Add Character'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-white z-40 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
          <Content />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Content />
      </div>
    </div>
  )
}