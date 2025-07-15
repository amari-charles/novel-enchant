import { useState, useEffect } from 'react'
import { Button } from '../../shared/ui-components'
import { StoryCard } from './story-card'
import type { Story } from '../../shared/type-definitions'

// Mock data for development - replace with actual API calls
const mockStories: Story[] = [
  {
    id: '1',
    title: 'The Dragon\'s Crown',
    description: 'An epic fantasy tale of a young mage discovering their true power in a world where dragons once ruled.',
    genre: 'Epic Fantasy',
    style_preset: 'fantasy',
    cover_image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=400&fit=crop',
    total_chapters: 12,
    total_scenes: 38,
    completed_chapters: 8,
    last_read_chapter: 8,
    reading_progress: 67,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T15:30:00Z'
  },
  {
    id: '2',
    title: 'Stars Beyond the Void',
    description: 'A space exploration story following a crew as they discover an ancient alien civilization.',
    genre: 'Space Opera',
    style_preset: 'scifi',
    cover_image_url: 'https://images.unsplash.com/photo-1446776876451-1b37ba9b9a6b?w=300&h=400&fit=crop',
    total_chapters: 8,
    total_scenes: 24,
    completed_chapters: 3,
    last_read_chapter: 3,
    reading_progress: 38,
    created_at: '2024-01-10T14:20:00Z',
    updated_at: '2024-01-18T09:15:00Z'
  },
  {
    id: '3',
    title: 'The Last Detective',
    description: 'A noir thriller set in 1940s New York, following Detective Morgan as he investigates a series of mysterious murders.',
    genre: 'Crime Thriller',
    style_preset: 'thriller',
    cover_image_url: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=300&h=400&fit=crop',
    total_chapters: 15,
    total_scenes: 45,
    completed_chapters: 15,
    last_read_chapter: 15,
    reading_progress: 100,
    created_at: '2024-01-05T08:00:00Z',
    updated_at: '2024-01-19T16:45:00Z'
  }
]

interface StoryDashboardProps {
  onStoryClick: (storyId: string) => void
  onCreateClick: () => void
}

export function StoryDashboard({ onStoryClick, onCreateClick }: StoryDashboardProps) {
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const loadStories = async () => {
      setIsLoading(true)
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      setStories(mockStories)
      setIsLoading(false)
    }
    
    loadStories()
  }, [])


  const handleStoryClick = (story: Story) => {
    onStoryClick(story.id)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your stories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Your Stories</h1>
            <Button onClick={onCreateClick} size="sm" className="md:text-base">
              Create New Story
            </Button>
          </div>
          <p className="text-gray-600 text-sm md:text-base">
            Transform your stories into immersive visual experiences
          </p>
        </div>

        {/* Stories List */}
        {stories.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="max-w-sm mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Start Your First Story</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Create immersive visual experiences from your written stories. Upload chapters and watch AI bring your scenes to life with stunning imagery.
              </p>
              <Button onClick={onCreateClick} className="w-full md:w-auto">
                Create Your First Story
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sort/Filter Options */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{stories.length} {stories.length === 1 ? 'story' : 'stories'}</span>
              <select className="text-gray-600 bg-transparent border-none text-sm focus:ring-0">
                <option>Recently updated</option>
                <option>Recently created</option>
                <option>Alphabetical</option>
                <option>Reading progress</option>
              </select>
            </div>

            {/* Story Cards */}
            <div className="space-y-3">
              {stories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  onClick={() => handleStoryClick(story)}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}