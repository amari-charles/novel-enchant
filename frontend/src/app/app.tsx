import { useState, useEffect } from 'react'
import { ThemeProvider } from '../contexts/theme-context'
import { AuthProvider, useAuth } from '../contexts/auth-context'
import { ErrorBoundary } from '../components/error-boundary'
import { AuthPage } from '../components/auth'
import { UploadStoryPage } from '../features/upload-story/components/UploadStoryPage'
import { MyStoriesPage } from '../features/my-stories/components/MyStoriesPage'
import { ExplorePage } from '../features/explore/components/ExplorePage'
import { NavBar } from '../components/NavBar'

// Router for new simplified flow
type Route =
  | { type: 'upload' }    // / (Upload Story)
  | { type: 'stories' }   // /stories
  | { type: 'story-editor'; storyId: string }   // /stories/:id/edit
  | { type: 'story-reading'; storyId: string; chapterIndex?: number }   // /stories/:id/read/:chapter?
  | { type: 'explore' } // /explore

const AuthenticatedApp = () => {
  const [currentRoute, setCurrentRoute] = useState<Route>({ type: 'upload' })

  const navigate = (route: Route) => {
    setCurrentRoute(route)
    // Update URL without page refresh
    let path = '/'
    switch (route.type) {
      case 'upload':
        path = '/'
        break
      case 'stories':
        path = '/stories'
        break
      case 'story-editor':
        path = `/stories/${route.storyId}/edit`
        break
      case 'story-reading':
        path = `/stories/${route.storyId}/read`
        if (route.chapterIndex !== undefined) {
          path += `/${route.chapterIndex}`
        }
        break
      case 'explore':
        path = '/explore'
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
    if (path === '/stories') return { type: 'stories' }
    if (path === '/explore') return { type: 'explore' }

    // Handle story sub-routes
    const storyEditorMatch = path.match(/^\/stories\/([^/]+)\/edit$/)
    if (storyEditorMatch) {
      return { type: 'story-editor', storyId: storyEditorMatch[1] }
    }

    const storyReadingMatch = path.match(/^\/stories\/([^/]+)\/read(?:\/(\d+))?$/)
    if (storyReadingMatch) {
      const chapterIndex = storyReadingMatch[2] ? parseInt(storyReadingMatch[2], 10) : undefined
      return { type: 'story-reading', storyId: storyReadingMatch[1], chapterIndex }
    }

    // Default to upload for any other path (including /)
    return { type: 'upload' }
  }

  // Render current route
  const renderCurrentRoute = () => {
    switch (currentRoute.type) {
      case 'upload':
        return <UploadStoryPage
          onNavigateToStories={() => navigate({ type: 'stories' })}
          onNavigate={(route) => navigate(route as Route)}
        />

      case 'stories':
      case 'story-editor':
      case 'story-reading':
        return <MyStoriesPage
          onNavigateToUpload={() => navigate({ type: 'upload' })}
          onNavigate={(route) => navigate(route as Route)}
          currentRoute={currentRoute}
        />

      case 'explore':
        return <ExplorePage />

      default:
        return <UploadStoryPage
          onNavigateToStories={() => navigate({ type: 'stories' })}
          onNavigate={(route) => navigate(route as Route)}
        />
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar
        currentRoute={currentRoute.type}
        onNavigate={(route) => {
          if (route === 'upload') navigate({ type: 'upload' })
          else if (route === 'stories') navigate({ type: 'stories' })
          else if (route === 'explore') navigate({ type: 'explore' })
        }}
      />
      {renderCurrentRoute()}
    </div>
  )
}

const AppWithAuth = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return <AuthenticatedApp />
}

const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppWithAuth />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App