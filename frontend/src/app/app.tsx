import { useState, useEffect } from 'react'
import { ThemeProvider } from '../contexts/theme-context'
import { StoryDashboard } from '../features/stories/story-dashboard'
import { CreateStoryPage } from '../features/stories/create-story-page'
import { StoryPage } from '../features/chapters/story-page'
import { AddChapterPage } from '../features/chapters/add-chapter-page'
import { ChapterReader } from '../features/chapters/chapter-reader'
import { CharacterRoster } from '../features/characters/character-roster'
import type { CreateStoryForm, Story, UploadChapterForm, Chapter } from '../shared/type-definitions'

// URL-based router that matches the vision's architecture
type Route = 
  | { type: 'home' }                                          // /
  | { type: 'create' }                                        // /create
  | { type: 'story'; storyId: string }                      // /story/:storyId
  | { type: 'add-chapter'; storyId: string }                // /story/:storyId/add
  | { type: 'chapter'; storyId: string; chapterId: string } // /story/:storyId/chapter/:chapterId
  | { type: 'characters'; storyId: string }                 // /story/:storyId/characters
  | { type: 'character'; storyId: string; characterId: string } // /story/:storyId/characters/:characterId
  | { type: 'settings'; storyId: string }                   // /story/:storyId/settings
  | { type: 'import' }                                       // /import

const App = () => {
  const [currentRoute, setCurrentRoute] = useState<Route>({ type: 'home' })

  const navigate = (route: Route) => {
    setCurrentRoute(route)
    // Update URL without page refresh (for MVP - would use proper router in production)
    let path = '/'
    switch (route.type) {
      case 'home':
        path = '/'
        break
      case 'create':
        path = '/create'
        break
      case 'story':
        path = `/story/${route.storyId}`
        break
      case 'add-chapter':
        path = `/story/${route.storyId}/add`
        break
      case 'chapter':
        path = `/story/${route.storyId}/chapter/${route.chapterId}`
        break
      case 'characters':
        path = `/story/${route.storyId}/characters`
        break
      case 'character':
        path = `/story/${route.storyId}/characters/${route.characterId}`
        break
      case 'settings':
        path = `/story/${route.storyId}/settings`
        break
      case 'import':
        path = '/import'
        break
    }
    window.history.pushState({}, '', path)
  }

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      const route = parsePathToRoute(path)
      setCurrentRoute(route)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Initialize route from current URL
  useEffect(() => {
    const path = window.location.pathname
    const route = parsePathToRoute(path)
    setCurrentRoute(route)
  }, [])

  const parsePathToRoute = (path: string): Route => {
    if (path === '/' || path === '') return { type: 'home' }
    if (path === '/create') return { type: 'create' }
    if (path === '/import') return { type: 'import' }
    
    const storyMatch = path.match(/^\/story\/([^\/]+)$/)
    if (storyMatch) return { type: 'story', storyId: storyMatch[1] }
    
    const addChapterMatch = path.match(/^\/story\/([^\/]+)\/add$/)
    if (addChapterMatch) return { type: 'add-chapter', storyId: addChapterMatch[1] }
    
    const chapterMatch = path.match(/^\/story\/([^\/]+)\/chapter\/([^\/]+)$/)
    if (chapterMatch) return { type: 'chapter', storyId: chapterMatch[1], chapterId: chapterMatch[2] }
    
    const charactersMatch = path.match(/^\/story\/([^\/]+)\/characters$/)
    if (charactersMatch) return { type: 'characters', storyId: charactersMatch[1] }
    
    const characterMatch = path.match(/^\/story\/([^\/]+)\/characters\/([^\/]+)$/)
    if (characterMatch) return { type: 'character', storyId: characterMatch[1], characterId: characterMatch[2] }
    
    const settingsMatch = path.match(/^\/story\/([^\/]+)\/settings$/)
    if (settingsMatch) return { type: 'settings', storyId: settingsMatch[1] }
    
    // Default fallback
    return { type: 'home' }
  }

  const handleCreateStory = async (data: CreateStoryForm): Promise<void> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const newStory: Story = {
      id: Date.now().toString(),
      title: data.title,
      description: data.description,
      genre: data.genre,
      style_preset: data.style_preset,
      cover_image_url: data.cover_image_url,
      total_chapters: 0,
      total_scenes: 0,
      completed_chapters: 0,
      reading_progress: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('Created story:', newStory)
    navigate({ type: 'story', storyId: newStory.id })
  }

  const handleAddChapter = async (data: UploadChapterForm): Promise<void> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const newChapter: Chapter = {
      id: Date.now().toString(),
      story_id: 'current-story-id', // TODO: Get from current route
      chapter_number: 1, // TODO: Calculate actual chapter number
      title: data.title,
      content: data.content,
      word_count: data.word_count || data.content.trim().split(/\s+/).length,
      processing_status: 'pending',
      scenes_extracted: false,
      created_at: new Date().toISOString()
    }
    
    console.log('Added chapter:', newChapter)
    // Navigate back to story page after successful upload
    if (currentRoute.type === 'add-chapter') {
      navigate({ type: 'story', storyId: currentRoute.storyId })
    }
  }

  // Render current route
  const renderCurrentRoute = () => {
    switch (currentRoute.type) {
      case 'home':
        return (
          <StoryDashboard 
            onStoryClick={(storyId) => navigate({ type: 'story', storyId })}
            onCreateClick={() => navigate({ type: 'create' })}
          />
        )
      
      case 'create':
        return (
          <CreateStoryPage 
            onSubmit={handleCreateStory}
            onCancel={() => navigate({ type: 'home' })}
            isLoading={false}
          />
        )
      
      case 'story':
        return (
          <StoryPage 
            storyId={currentRoute.storyId}
            onBackToHome={() => navigate({ type: 'home' })}
            onChapterClick={(chapterId) => navigate({ type: 'chapter', storyId: currentRoute.storyId, chapterId })}
            onCharactersClick={() => navigate({ type: 'characters', storyId: currentRoute.storyId })}
            onAddChapterClick={() => navigate({ type: 'add-chapter', storyId: currentRoute.storyId })}
            onSettingsClick={() => navigate({ type: 'settings', storyId: currentRoute.storyId })}
          />
        )
      
      case 'add-chapter':
        return (
          <AddChapterPage 
            storyId={currentRoute.storyId}
            onSubmit={handleAddChapter}
            onCancel={() => navigate({ type: 'story', storyId: currentRoute.storyId })}
            isLoading={false}
            nextChapterNumber={1} // TODO: Get actual next chapter number
          />
        )
      
      case 'chapter':
        return (
          <ChapterReader 
            chapterId={currentRoute.chapterId}
            onBackToStory={() => navigate({ type: 'story', storyId: currentRoute.storyId })}
            onCharactersClick={() => navigate({ type: 'characters', storyId: currentRoute.storyId })}
          />
        )
      
      case 'characters':
        return (
          <CharacterRoster 
            storyId={currentRoute.storyId}
            onClose={() => navigate({ type: 'story', storyId: currentRoute.storyId })}
            onCharacterClick={(characterId) => navigate({ type: 'character', storyId: currentRoute.storyId, characterId })}
          />
        )
      
      case 'character':
        return (
          <div>Character Detail Page - TODO</div>
        )
      
      case 'settings':
        return (
          <div>Story Settings Page - TODO</div>
        )
      
      case 'import':
        return (
          <div>Import from URL Page - TODO</div>
        )
      
      default:
        return <StoryDashboard onStoryClick={(storyId) => navigate({ type: 'story', storyId })} onCreateClick={() => navigate({ type: 'create' })} />
    }
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        {renderCurrentRoute()}
      </div>
    </ThemeProvider>
  )
}

export default App