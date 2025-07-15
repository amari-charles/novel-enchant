import React, { useState, useEffect } from 'react'
import { Button, Card, CardContent, CardHeader } from '../../shared/ui-components'
import { CharacterCard } from './character-card'
import type { Character } from '../../shared/type-definitions'

interface CharacterRosterProps {
  storyId: string
  onClose?: () => void
  onCharacterClick?: (characterId: string) => void
  isModal?: boolean
}

// Mock data for development
const mockCharacters: Character[] = [
  {
    id: 'char1',
    story_id: '1',
    name: 'Elara Valdris',
    aliases: ['The Young Mage', 'Heir of House Valdris'],
    base_description: 'A determined young woman in her early twenties with auburn hair and emerald eyes. She possesses untapped magical potential and seeks to reclaim her family\'s stolen grimoire.',
    personality_traits: ['determined', 'cautious', 'intelligent', 'curious', 'brave'],
    role: 'protagonist',
    primary_reference_image: {
      id: 'ref1',
      character_id: 'char1',
      image_url: 'https://images.unsplash.com/photo-1494790108755-2616c58c1b05?w=400&h=400&fit=crop&crop=face',
      is_primary: true,
      description: 'Portrait of Elara with auburn hair and emerald eyes'
    },
    reference_images: [
      {
        id: 'ref1',
        character_id: 'char1',
        image_url: 'https://images.unsplash.com/photo-1494790108755-2616c58c1b05?w=400&h=400&fit=crop&crop=face',
        is_primary: true,
        description: 'Portrait of Elara with auburn hair and emerald eyes'
      }
    ],
    is_active: true
  },
  {
    id: 'char2',
    story_id: '1',
    name: 'The Keeper',
    aliases: ['Master Aldrich', 'The Old Mage', 'Guardian of the Repository'],
    base_description: 'An elderly but powerful mage who has guarded the Repository of the Arcane for decades. He wears midnight-blue robes embroidered with silver stars and possesses deep wisdom about ancient magic.',
    personality_traits: ['wise', 'mysterious', 'protective', 'stern', 'knowledgeable'],
    role: 'supporting',
    primary_reference_image: {
      id: 'ref2',
      character_id: 'char2',
      image_url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face',
      is_primary: true,
      description: 'Elderly mage with wise eyes and silver beard'
    },
    reference_images: [
      {
        id: 'ref2',
        character_id: 'char2',
        image_url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face',
        is_primary: true,
        description: 'Elderly mage with wise eyes and silver beard'
      }
    ],
    is_active: true
  },
  {
    id: 'char3',
    story_id: '1',
    name: 'Lord Malachar',
    aliases: ['The Shadow Lord', 'Destroyer of House Valdris'],
    base_description: 'The dark sorcerer who destroyed House Valdris and stole their ancient grimoire. His presence is felt throughout the story even when he doesn\'t appear directly.',
    personality_traits: ['ruthless', 'powerful', 'cunning', 'ambitious', 'cold'],
    role: 'antagonist',
    reference_images: [],
    is_active: true
  },
  {
    id: 'char4',
    story_id: '1',
    name: 'Finn the Scribe',
    aliases: ['Young Finn'],
    base_description: 'A nervous young apprentice who works in the Repository. He has knowledge of the catalog system and often provides helpful information.',
    personality_traits: ['nervous', 'helpful', 'knowledgeable', 'timid'],
    role: 'minor',
    reference_images: [],
    is_active: true
  }
]

export function CharacterRoster({ storyId, onClose, onCharacterClick, isModal = false }: CharacterRosterProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [filterRole, setFilterRole] = useState<string>('all')

  useEffect(() => {
    const loadCharacters = async () => {
      setIsLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))
      setCharacters(mockCharacters)
      setIsLoading(false)
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

  const Content = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Character Roster</h2>
          <p className="text-gray-600">Characters discovered in your story</p>
        </div>
        {isModal && onClose && (
          <Button variant="ghost" onClick={onClose}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        )}
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

      {/* Loading State */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading characters...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Characters Grid */}
          {filteredCharacters.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filterRole === 'all' ? 'No characters yet' : `No ${filterRole} characters`}
                </h3>
                <p className="text-gray-600">
                  {filterRole === 'all' 
                    ? 'Characters will appear automatically as you upload chapters and scenes are extracted.'
                    : `No ${filterRole} characters have been identified in your story yet.`
                  }
                </p>
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
        </>
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

              {/* Aliases */}
              {selectedCharacter.aliases.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Also Known As</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCharacter.aliases.map((alias, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {alias}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Personality Traits */}
              {selectedCharacter.personality_traits.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Personality Traits</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCharacter.personality_traits.map((trait, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reference Images */}
              {selectedCharacter.reference_images.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Reference Images</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedCharacter.reference_images.map((image) => (
                      <img
                        key={image.id}
                        src={image.image_url}
                        alt={image.description || selectedCharacter.name}
                        className="w-full h-24 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}
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