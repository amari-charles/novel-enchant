import { Card } from '../../shared/ui-components'
import type { StoryCardProps } from '../../shared/type-definitions'

export function StoryCard({ story, onClick }: StoryCardProps) {

  return (
    <Card onClick={onClick} hover className="group transition-all duration-200 hover:shadow-lg cursor-pointer">
      <div className="flex p-4 gap-4">
        {/* Cover Image */}
        <div className="flex-shrink-0">
          <div className="w-16 h-20 md:w-20 md:h-28 rounded-lg overflow-hidden bg-muted shadow-sm">
            {story.cover_image_url ? (
              <img
                src={story.cover_image_url}
                alt={story.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
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
            <h3 className="text-lg font-semibold text-card-foreground truncate pr-2 group-hover:text-primary transition-colors">
              {story.title}
            </h3>
          </div>


        </div>
      </div>
    </Card>
  )
}