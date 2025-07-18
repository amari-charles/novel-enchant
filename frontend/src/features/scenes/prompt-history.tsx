import { useState } from 'react'
import { Button, Textarea, Card } from '../../shared/ui-components'

interface PromptAttempt {
  id: string
  prompt: string
  image_url?: string
  created_at: string
  success: boolean
  error_message?: string
  user_rating?: number
}

interface PromptHistoryProps {
  currentPrompt: string
  promptHistory: PromptAttempt[]
  onRetryWithPrompt: (prompt: string) => Promise<void>
  onSelectPreviousVersion: (attempt: PromptAttempt) => void
  isGenerating?: boolean
}

export function PromptHistory({
  currentPrompt,
  promptHistory,
  onRetryWithPrompt,
  onSelectPreviousVersion,
  isGenerating = false
}: PromptHistoryProps) {
  const [editedPrompt, setEditedPrompt] = useState(currentPrompt)
  const [showPromptEditor, setShowPromptEditor] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const handleRetryWithEdits = async () => {
    if (editedPrompt.trim() !== currentPrompt.trim()) {
      await onRetryWithPrompt(editedPrompt)
      setShowPromptEditor(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onRetryWithPrompt(currentPrompt)}
          disabled={isGenerating}
          isLoading={isGenerating}
        >
          🔄 Retry Same
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowPromptEditor(!showPromptEditor)}
          disabled={isGenerating}
        >
          ✏️ Edit Prompt
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowHistory(!showHistory)}
        >
          📋 History ({promptHistory.length})
        </Button>
      </div>

      {/* Prompt Editor */}
      {showPromptEditor && (
        <Card className="p-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Edit Scene Prompt
              </label>
              <Textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                rows={4}
                className="w-full"
                placeholder="Describe the visual scene you want to generate..."
              />
            </div>
            
            <div className="text-sm text-gray-600">
              <p><strong>Tips for better prompts:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Be specific about lighting, mood, and composition</li>
                <li>Include character positions and expressions</li>
                <li>Mention important background elements</li>
                <li>Specify the artistic style if different from story default</li>
              </ul>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleRetryWithEdits}
                disabled={!editedPrompt.trim() || isGenerating}
                isLoading={isGenerating}
              >
                Generate with Edits
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditedPrompt(currentPrompt)
                  setShowPromptEditor(false)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Prompt History */}
      {showHistory && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Generation History</h4>
              <span className="text-sm text-gray-500">
                {promptHistory.length} attempts
              </span>
            </div>
            
            {promptHistory.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No previous attempts yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {promptHistory.map((attempt, index) => (
                  <div
                    key={attempt.id}
                    className={`border rounded-lg p-3 ${ 
                      attempt.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            Attempt #{promptHistory.length - index}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(attempt.created_at)}
                          </span>
                          {attempt.success ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              ✓ Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              ✗ Failed
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                          {attempt.prompt}
                        </p>
                        
                        {attempt.error_message && (
                          <p className="text-xs text-red-600 mb-2">
                            Error: {attempt.error_message}
                          </p>
                        )}
                        
                        {attempt.user_rating && (
                          <div className="flex items-center space-x-1 mb-2">
                            <span className="text-xs text-gray-500">Rating:</span>
                            <div className="flex">
                              {Array.from({ length: 5 }, (_, i) => (
                                <span
                                  key={i}
                                  className={`text-xs ${
                                    i < attempt.user_rating! ? 'text-yellow-400' : 'text-gray-300'
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {attempt.image_url && (
                        <img
                          src={attempt.image_url}
                          alt={`Attempt ${index + 1}`}
                          className="w-16 h-16 object-cover rounded border-2 border-white shadow-sm ml-3"
                        />
                      )}
                    </div>
                    
                    <div className="flex space-x-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRetryWithPrompt(attempt.prompt)}
                        disabled={isGenerating}
                      >
                        Retry This
                      </Button>
                      
                      {attempt.success && attempt.image_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSelectPreviousVersion(attempt)}
                          disabled={isGenerating}
                        >
                          Use This Version
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditedPrompt(attempt.prompt)}
                      >
                        Copy Prompt
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
      
      {/* Current Prompt Display */}
      <details className="group">
        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1">
          <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span>View Current Prompt</span>
        </summary>
        <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700 border-l-4 border-blue-200">
          {currentPrompt}
        </div>
      </details>
    </div>
  )
}