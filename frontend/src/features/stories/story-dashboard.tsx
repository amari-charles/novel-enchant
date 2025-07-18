import { useState, useEffect } from 'react'
import { Button, DarkModeToggle } from '../../shared/ui-components'
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
    created_at: '2024-01-05T08:00:00Z',
    updated_at: '2024-01-19T16:45:00Z'
  }
]

interface StoryDashboardProps {
  onStoryClick: (storyId: string) => void
  onCreateClick: () => void
  onTestFlowsClick?: () => void
}

export function StoryDashboard({ onStoryClick, onCreateClick, onTestFlowsClick }: StoryDashboardProps) {
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    // Simulate API call with loading state
    const loadStories = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // In a real app, this would be an API call
        setStories(mockStories)
      } catch (err) {
        setError('Failed to load stories')
        console.error('Error loading stories:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadStories()
  }, [])


  const handleStoryClick = (story: Story) => {
    onStoryClick(story.id)
  }


  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Stories</h1>
            <div className="flex items-center space-x-3">
              <DarkModeToggle />
              {onTestFlowsClick && (
                <Button 
                  onClick={onTestFlowsClick} 
                  variant="outline" 
                  size="sm" 
                  className="md:text-base"
                >
                  Test Flows
                </Button>
              )}
              <Button onClick={onCreateClick} size="sm" className="md:text-base">
                Add Story
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-20 bg-muted-foreground/20 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
                      <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 px-4">
            <div className="max-w-sm mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Error Loading Stories</h3>
              <p className="text-muted-foreground mb-8">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="max-w-sm mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Start Your First Story</h3>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Create immersive visual experiences from your written stories. Upload chapters and watch AI bring your scenes to life with stunning imagery.
              </p>
              <Button onClick={onCreateClick} className="w-full md:w-auto">
                Add Your First Story
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sort/Filter Options */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{stories.length} {stories.length === 1 ? 'story' : 'stories'}</span>
              <select className="text-muted-foreground bg-transparent border-none text-sm focus:ring-0">
                <option>Recently updated</option>
                <option>Recently created</option>
                <option>Alphabetical</option>
                <option>Most scenes</option>
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