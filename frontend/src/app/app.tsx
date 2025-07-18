import { useState, useEffect } from 'react'
import { ThemeProvider } from '../contexts/theme-context'
import { ErrorBoundary } from '../components/error-boundary'
import { StoryDashboard } from '../features/stories/story-dashboard'
import { SimpleUploadPage } from '../features/stories/simple-upload-page'
import { StorySettingsPage } from '../features/stories/story-settings-page'
import { StoryPage } from '../features/chapters/story-page'
import { AddChapterPage } from '../features/chapters/add-chapter-page'
import { ChapterReader } from '../features/chapters/chapter-reader'
import { CharacterRoster } from '../features/characters/character-roster'
import { CharacterDetailPage } from '../features/characters/character-detail-page'
import { FlowTester } from '../features/testing/flow-tester'
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
  | { type: 'test-flows' }                                   // /test-flows

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
      case 'test-flows':
        path = '/test-flows'
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
    if (path === '/test-flows') return { type: 'test-flows' }
    
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

  // Get next chapter number for a story (mock implementation)
  const getNextChapterNumber = (_storyId: string): number => {
    // In a real app, this would query the API to get existing chapters
    // For now, simulate by returning a reasonable mock value
    // This could be enhanced to track chapters in local state
    return 1 // Mock: always return 1 for now, would be calculated from existing chapters
  }

  const handleCreateStory = async (data: CreateStoryForm): Promise<void> => {
    // Mock API call - no delay needed
    
    const newStory: Story = {
      id: Date.now().toString(),
      title: data.title,
      description: data.description,
      genre: data.genre,
      style_preset: data.style_preset,
      cover_image_url: data.cover_image_url,
      total_chapters: data.content ? 1 : 0, // If content provided, assume first chapter
      total_scenes: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('Created story:', newStory)
    console.log('Story content:', { 
      content: data.content.substring(0, 100) + '...', 
      confidence_scores: data.confidence_scores 
    })
    
    // If content was provided, we could automatically create the first chapter here
    // For now, just navigate to the story page
    navigate({ type: 'story', storyId: newStory.id })
  }

  const handleAddChapter = async (data: UploadChapterForm): Promise<void> => {
    // Mock API call - no delay needed
    
    // Get story ID from current route
    const storyId = currentRoute.type === 'add-chapter' ? currentRoute.storyId : 'default-story-id'
    
    // Calculate next chapter number using our mock function
    const nextChapterNumber = getNextChapterNumber(storyId)
    
    const newChapter: Chapter = {
      id: Date.now().toString(),
      story_id: storyId,
      chapter_number: nextChapterNumber,
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
            onTestFlowsClick={() => navigate({ type: 'test-flows' })}
          />
        )
      
      case 'create':
        return (
          <SimpleUploadPage 
            onSubmit={handleCreateStory}
            onCancel={() => navigate({ type: 'home' })}
            isLoading={false}
          />
        )
      
      case 'test-flows':
        return <FlowTester />
      
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
            nextChapterNumber={getNextChapterNumber(currentRoute.storyId)}
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
          <CharacterDetailPage 
            storyId={currentRoute.storyId}
            characterId={currentRoute.characterId}
            onBackToRoster={() => navigate({ type: 'characters', storyId: currentRoute.storyId })}
            onEditCharacter={(characterId) => console.log('Edit character:', characterId)}
          />
        )
      
      case 'settings':
        return (
          <StorySettingsPage 
            storyId={currentRoute.storyId}
            onBackToStory={() => navigate({ type: 'story', storyId: currentRoute.storyId })}
            onStoryDeleted={() => navigate({ type: 'home' })}
          />
        )
      
      
      default:
        return (
          <StoryDashboard 
            onStoryClick={(storyId) => navigate({ type: 'story', storyId })} 
            onCreateClick={() => navigate({ type: 'create' })}
            onTestFlowsClick={() => navigate({ type: 'test-flows' })}
          />
        )
    }
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <div className="min-h-screen bg-background text-foreground">
          {renderCurrentRoute()}
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App