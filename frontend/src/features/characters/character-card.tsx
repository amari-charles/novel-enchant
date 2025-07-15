import React from 'react'
import { Card, CardContent } from '../../shared/ui-components'
import type { CharacterCardProps } from '../../shared/type-definitions'

export function CharacterCard({ character, onClick, showSceneCount = false }: CharacterCardProps) {
  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'protagonist':
        return 'bg-blue-100 text-blue-800'
      case 'antagonist':
        return 'bg-red-100 text-red-800'
      case 'supporting':
        return 'bg-green-100 text-green-800'
      case 'minor':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card onClick={onClick} hover={!!onClick} className="h-full">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {/* Character Image */}
          <div className="flex-shrink-0">
            {character.primary_reference_image ? (
              <img
                src={character.primary_reference_image.image_url}
                alt={character.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>

          {/* Character Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {character.name}
              </h3>
              {character.role && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(character.role)}`}>
                  {character.role}
                </span>
              )}
            </div>

            {/* Aliases */}
            {character.aliases.length > 0 && (
              <p className="text-sm text-gray-600 mb-2">
                Also known as: {character.aliases.join(', ')}
              </p>
            )}

            {/* Description */}
            <p className="text-sm text-gray-700 mb-3 line-clamp-3">
              {character.base_description}
            </p>

            {/* Personality Traits */}
            {character.personality_traits.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {character.personality_traits.slice(0, 3).map((trait, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                    >
                      {trait}
                    </span>
                  ))}
                  {character.personality_traits.length > 3 && (
                    <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full">
                      +{character.personality_traits.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Reference Images Count */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {character.reference_images.length} reference image{character.reference_images.length !== 1 ? 's' : ''}
              </span>
              {showSceneCount && (
                <span>
                  Appears in X scenes
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}