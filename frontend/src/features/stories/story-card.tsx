import { Card, Button } from '../../shared/ui-components'
import type { StoryCardProps } from '../../shared/type-definitions'

export function StoryCard({ story, onClick }: StoryCardProps) {
  const getStylePresetColor = (preset: string) => {
    const colors = {
      fantasy: 'bg-purple-50 text-purple-700 border-purple-200',
      scifi: 'bg-blue-50 text-blue-700 border-blue-200',
      romance: 'bg-pink-50 text-pink-700 border-pink-200',
      thriller: 'bg-red-50 text-red-700 border-red-200',
      historical: 'bg-amber-50 text-amber-700 border-amber-200',
      contemporary: 'bg-gray-50 text-gray-700 border-gray-200'
    }
    return colors[preset as keyof typeof colors] || colors.contemporary
  }

  const getProgressText = () => {
    if (story.reading_progress === 100) {
      return 'Completed'
    }
    if (story.last_read_chapter) {
      return `Chapter ${story.last_read_chapter} of ${story.total_chapters}`
    }
    return 'Not started'
  }


  return (
    <Card onClick={onClick} hover className="group transition-all duration-200 hover:shadow-lg border-0 bg-white">
      <div className="flex p-4 gap-4">
        {/* Cover Image */}
        <div className="flex-shrink-0">
          <div className="w-16 h-20 md:w-20 md:h-28 rounded-lg overflow-hidden bg-gray-100 shadow-sm">
            {story.cover_image_url ? (
              <img
                src={story.cover_image_url}
                alt={story.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate pr-2 group-hover:text-blue-600 transition-colors">
              {story.title}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${getStylePresetColor(story.style_preset)}`}>
              {story.style_preset}
            </span>
          </div>

          {/* Reading Progress */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">{getProgressText()}</span>
              {story.reading_progress !== undefined && (
                <span className="text-gray-500">{Math.round(story.reading_progress)}%</span>
              )}
            </div>
            {story.reading_progress !== undefined && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${story.reading_progress}%` }}
                />
              </div>
            )}
          </div>


          {/* Action Button */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400">
              {story.genre && (
                <span>{story.genre}</span>
              )}
            </div>
            <Button 
              size="sm" 
              variant={story.reading_progress === 100 ? "outline" : "primary"}
              className="text-xs px-3 py-1 h-7"
              onClick={(e) => {
                e.stopPropagation()
                onClick()
              }}
            >
              {story.reading_progress === 100 ? 'Re-read' : story.last_read_chapter ? 'Continue' : 'Start Reading'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}