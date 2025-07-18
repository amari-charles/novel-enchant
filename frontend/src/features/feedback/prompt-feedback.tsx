import { useState } from 'react'
import { Button, Card, Textarea } from '../../shared/ui-components'

interface FeedbackData {
  prompt_accuracy: number // 1-5 scale
  image_quality: number // 1-5 scale
  scene_relevance: number // 1-5 scale
  character_accuracy?: number // 1-5 scale (if characters present)
  feedback_text?: string
  improvement_suggestions?: string
}

interface PromptFeedbackProps {
  originalPrompt: string
  onSubmitFeedback: (feedback: FeedbackData) => Promise<void>
  onClose: () => void
  isSubmitting?: boolean
}

const RATING_LABELS = {
  prompt_accuracy: {
    1: 'Poor - Prompt missed key elements',
    2: 'Fair - Some elements captured',
    3: 'Good - Most elements captured',
    4: 'Very Good - Nearly accurate',
    5: 'Excellent - Perfect representation'
  },
  image_quality: {
    1: 'Poor - Low quality/artifacts',
    2: 'Fair - Some quality issues',
    3: 'Good - Acceptable quality',
    4: 'Very Good - High quality',
    5: 'Excellent - Outstanding quality'
  },
  scene_relevance: {
    1: 'Poor - Doesn\'t match scene',
    2: 'Fair - Loosely related',
    3: 'Good - Generally matches',
    4: 'Very Good - Strong match',
    5: 'Excellent - Perfect match'
  },
  character_accuracy: {
    1: 'Poor - Characters unrecognizable',
    2: 'Fair - Some resemblance',
    3: 'Good - Generally accurate',
    4: 'Very Good - Very close',
    5: 'Excellent - Perfect likeness'
  }
}

export function PromptFeedback({
  originalPrompt,
  onSubmitFeedback,
  onClose,
  isSubmitting = false
}: PromptFeedbackProps) {
  const [feedback, setFeedback] = useState<FeedbackData>({
    prompt_accuracy: 0,
    image_quality: 0,
    scene_relevance: 0,
    character_accuracy: 0,
    feedback_text: '',
    improvement_suggestions: ''
  })

  const [hoveredRating, setHoveredRating] = useState<{category: keyof FeedbackData, value: number} | null>(null)

  const updateRating = (category: keyof FeedbackData, value: number) => {
    setFeedback(prev => ({ ...prev, [category]: value }))
  }

  const updateText = (field: keyof FeedbackData, value: string) => {
    setFeedback(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (feedback.prompt_accuracy === 0 || feedback.image_quality === 0 || feedback.scene_relevance === 0) {
      return // Require minimum ratings
    }
    
    try {
      await onSubmitFeedback(feedback)
      onClose()
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    }
  }

  const renderStarRating = (category: keyof FeedbackData, label: string, required = true) => {
    const currentRating = feedback[category] as number
    const labels = RATING_LABELS[category as keyof typeof RATING_LABELS]
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-900">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {currentRating > 0 && (
            <span className="text-xs text-gray-500">
              {currentRating}/5
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          {Array.from({ length: 5 }, (_, i) => {
            const starValue = i + 1
            const isHovered = hoveredRating?.category === category && hoveredRating.value >= starValue
            const isSelected = currentRating >= starValue
            
            return (
              <button
                key={i}
                type="button"
                onClick={() => updateRating(category, starValue)}
                onMouseEnter={() => setHoveredRating({ category, value: starValue })}
                onMouseLeave={() => setHoveredRating(null)}
                className={`text-xl transition-colors ${
                  isSelected || isHovered ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
                }`}
              >
                ★
              </button>
            )
          })}
        </div>
        
        {/* Show description for hovered or selected rating */}
        {((hoveredRating?.category === category && hoveredRating.value > 0) || currentRating > 0) && (
          <p className="text-xs text-gray-600 mt-1">
            {labels[((hoveredRating?.category === category ? hoveredRating.value : currentRating) as keyof typeof labels)]}
          </p>
        )}
      </div>
    )
  }

  const isFormValid = feedback.prompt_accuracy > 0 && feedback.image_quality > 0 && feedback.scene_relevance > 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Provide Generation Feedback
            </h3>
            <Button variant="ghost" onClick={onClose}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>

          <div className="space-y-6">
            {/* Original Prompt Display */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Original Prompt</h4>
              <div className="p-3 bg-gray-50 rounded border text-sm text-gray-700 font-mono">
                {originalPrompt}
              </div>
            </div>

            {/* Rating Categories */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Rate the Generation Quality</h4>
              
              {renderStarRating('prompt_accuracy', 'Prompt Accuracy')}
              {renderStarRating('image_quality', 'Image Quality')}
              {renderStarRating('scene_relevance', 'Scene Relevance')}
              {renderStarRating('character_accuracy', 'Character Accuracy', false)}
            </div>

            {/* Text Feedback */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  General Feedback (Optional)
                </label>
                <Textarea
                  value={feedback.feedback_text || ''}
                  onChange={(e) => updateText('feedback_text', e.target.value)}
                  placeholder="What worked well? What could be improved?"
                  rows={3}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Improvement Suggestions (Optional)
                </label>
                <Textarea
                  value={feedback.improvement_suggestions || ''}
                  onChange={(e) => updateText('improvement_suggestions', e.target.value)}
                  placeholder="How could the prompt or generation process be improved?"
                  rows={3}
                  className="w-full"
                />
              </div>
            </div>

            {/* Quick Feedback Buttons */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Feedback</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '👍 Great job!', action: () => setFeedback(prev => ({ ...prev, feedback_text: 'Great job! This image captures the scene perfectly.' })) },
                  { label: '🎨 Good style', action: () => setFeedback(prev => ({ ...prev, feedback_text: 'The artistic style works well for this scene.' })) },
                  { label: '👥 Characters accurate', action: () => setFeedback(prev => ({ ...prev, feedback_text: 'Character representations are accurate.' })) },
                  { label: '🌅 Great atmosphere', action: () => setFeedback(prev => ({ ...prev, feedback_text: 'The mood and atmosphere are well captured.' })) },
                  { label: '📝 Prompt too complex', action: () => setFeedback(prev => ({ ...prev, improvement_suggestions: 'Consider simplifying the prompt for better results.' })) },
                  { label: '🔍 Missing details', action: () => setFeedback(prev => ({ ...prev, improvement_suggestions: 'Some important scene details were not captured.' })) }
                ].map((item, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant="outline"
                    onClick={item.action}
                    className="text-xs"
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-sm text-blue-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  Your feedback helps improve AI generation quality for future scenes.
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                isLoading={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>

            {!isFormValid && (
              <p className="text-sm text-amber-600 text-center">
                Please provide ratings for prompt accuracy, image quality, and scene relevance to submit.
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}