import { useState, useEffect } from 'react'
import { Button, Card, CardContent, CardHeader } from '../../shared/ui-components'
import type { Story } from '../../shared/type-definitions'

interface StoryAnalytics {
  totalWords: number
  totalChapters: number
  totalScenes: number
  generatedImages: number
  averageWordsPerChapter: number
  estimatedReadTime: number
  charactersDiscovered: number
  locationsDiscovered: number
  lastUpdated: string
  creationDate: string
  generationProgress: {
    scenesExtracted: number
    imagesGenerated: number
    imagesRated: number
  }
  readingStats: {
    averageSceneLength: number
    longestChapter: { title: string; wordCount: number }
    shortestChapter: { title: string; wordCount: number }
  }
}

interface StoryAnalyticsProps {
  story: Story
  onClose?: () => void
  isModal?: boolean
}

// Mock analytics data
const mockAnalytics: StoryAnalytics = {
  totalWords: 47830,
  totalChapters: 8,
  totalScenes: 23,
  generatedImages: 18,
  averageWordsPerChapter: 5979,
  estimatedReadTime: 191, // minutes
  charactersDiscovered: 12,
  locationsDiscovered: 8,
  lastUpdated: '2024-01-15T14:30:00Z',
  creationDate: '2024-01-10T09:15:00Z',
  generationProgress: {
    scenesExtracted: 23,
    imagesGenerated: 18,
    imagesRated: 12
  },
  readingStats: {
    averageSceneLength: 2080,
    longestChapter: { title: 'The Final Confrontation', wordCount: 8420 },
    shortestChapter: { title: 'Prologue', wordCount: 1250 }
  }
}

export function StoryAnalytics({ story, onClose, isModal = false }: StoryAnalyticsProps) {
  const [analytics, setAnalytics] = useState<StoryAnalytics | null>(null)
  // const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'generation' | 'details'>('overview')

  useEffect(() => {
    const loadAnalytics = async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setAnalytics(mockAnalytics)
    }
    
    loadAnalytics()
  }, [story.id])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatReadTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`
    }
    return `${remainingMinutes}m`
  }

  const getCompletionPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }


  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">No analytics data available</p>
      </div>
    )
  }

  const Content = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{story.title} - Analytics</h2>
          <p className="text-gray-600">Visual content generation insights</p>
        </div>
        {isModal && onClose && (
          <Button variant="ghost" onClick={onClose}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'generation', label: 'Generation' },
            { key: 'details', label: 'Details' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Key Metrics */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium">Story Metrics</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Words</span>
                <span className="font-semibold">{analytics.totalWords.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Chapters</span>
                <span className="font-semibold">{analytics.totalChapters}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Scenes</span>
                <span className="font-semibold">{analytics.totalScenes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Generated Images</span>
                <span className="font-semibold">{analytics.generatedImages}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Est. Read Time</span>
                <span className="font-semibold">{formatReadTime(analytics.estimatedReadTime)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Generation Progress */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium">Generation Progress</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Scenes Extracted</span>
                  <span>{analytics.generationProgress.scenesExtracted}/{analytics.totalScenes}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${getCompletionPercentage(analytics.generationProgress.scenesExtracted, analytics.totalScenes)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Images Generated</span>
                  <span>{analytics.generationProgress.imagesGenerated}/{analytics.totalScenes}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${getCompletionPercentage(analytics.generationProgress.imagesGenerated, analytics.totalScenes)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Images Rated</span>
                  <span>{analytics.generationProgress.imagesRated}/{analytics.generatedImages}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${getCompletionPercentage(analytics.generationProgress.imagesRated, analytics.generatedImages)}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Characters & Locations */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium">World Building</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Characters</span>
                <span className="font-semibold">{analytics.charactersDiscovered}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Locations</span>
                <span className="font-semibold">{analytics.locationsDiscovered}</span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Created</span>
                  <span>{formatDate(analytics.creationDate)}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-gray-600">Last Updated</span>
                  <span>{formatDate(analytics.lastUpdated)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'generation' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium">Generation Pipeline</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Pipeline Steps */}
                <div className="relative">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">Scene Extraction</h4>
                      <p className="text-sm text-gray-600">
                        {analytics.generationProgress.scenesExtracted} of {analytics.totalScenes} scenes extracted
                      </p>
                    </div>
                    <div className="text-sm text-green-600 font-medium">Complete</div>
                  </div>
                </div>

                <div className="relative">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">Image Generation</h4>
                      <p className="text-sm text-gray-600">
                        {analytics.generationProgress.imagesGenerated} of {analytics.totalScenes} images generated
                      </p>
                    </div>
                    <div className="text-sm text-blue-600 font-medium">
                      {getCompletionPercentage(analytics.generationProgress.imagesGenerated, analytics.totalScenes)}%
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">Quality Rating</h4>
                      <p className="text-sm text-gray-600">
                        {analytics.generationProgress.imagesRated} of {analytics.generatedImages} images rated
                      </p>
                    </div>
                    <div className="text-sm text-purple-600 font-medium">
                      {getCompletionPercentage(analytics.generationProgress.imagesRated, analytics.generatedImages)}%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'details' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium">Content Statistics</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Chapter Analysis</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average length:</span>
                      <span>{analytics.averageWordsPerChapter.toLocaleString()} words</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Longest chapter:</span>
                      <span>{analytics.readingStats.longestChapter.wordCount.toLocaleString()} words</span>
                    </div>
                    <div className="text-xs text-gray-500 ml-4">
                      "{analytics.readingStats.longestChapter.title}"
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shortest chapter:</span>
                      <span>{analytics.readingStats.shortestChapter.wordCount.toLocaleString()} words</span>
                    </div>
                    <div className="text-xs text-gray-500 ml-4">
                      "{analytics.readingStats.shortestChapter.title}"
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Scene Analysis</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average scene length:</span>
                      <span>{analytics.readingStats.averageSceneLength.toLocaleString()} words</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Scenes per chapter:</span>
                      <span>{(analytics.totalScenes / analytics.totalChapters).toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Image coverage:</span>
                      <span>{getCompletionPercentage(analytics.generatedImages, analytics.totalScenes)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium">Export & Backup</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Download your story data for backup or external use.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="sm" variant="outline">
                  📄 Export Text (.txt)
                </Button>
                <Button size="sm" variant="outline">
                  📑 Export with Images (.pdf)
                </Button>
                <Button size="sm" variant="outline">
                  💾 Backup Data (.json)
                </Button>
                <Button size="sm" variant="outline">
                  📊 Analytics Report (.csv)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-white z-40 overflow-y-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 h-full">
          <Content />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <Content />
      </div>
    </div>
  )
}