import React, { useState, useEffect, useRef } from 'react'
import { Button, Card, CardContent } from '../../shared/ui-components'
import { SceneImage } from '../scenes/scene-image'
import type { ChapterWithScenes, Scene, Image } from '../../shared/type-definitions'

interface ChapterReaderProps {
  chapterId: string
  onBackToStory: (storyId: string) => void
  onCharactersClick: (storyId: string) => void
}

// Mock data for development
const mockChapterWithScenes: ChapterWithScenes = {
  id: '1',
  story_id: '1',
  chapter_number: 1,
  title: 'The Awakening',
  content: `The ancient tower loomed against the storm-darkened sky, its weathered stones slick with rain. Elara pulled her cloak tighter as she approached the massive oak doors, their iron hinges groaning in protest as she pushed them open.

Inside, the air was thick with the scent of old parchment and burning candles. Rows of towering bookshelves stretched into the shadows above, filled with tomes that held the knowledge of ages past. This was the Repository of the Arcane, and she had finally found it.

"You seek the forbidden knowledge," came a voice from the darkness.

Elara spun around to see an elderly figure emerge from behind one of the massive shelves. His robes were the deep blue of midnight, embroidered with silver stars that seemed to shimmer in the candlelight. His eyes, though aged, held a sharp intelligence that made her feel as though he could see directly into her soul.

"I seek only what was stolen from my family," she replied, her voice steady despite the trembling in her hands.

The old mage studied her for a long moment before nodding slowly. "The Grimoire of Shadows. Yes, I know why you're here, child of House Valdris. But are you prepared for what you might discover within its pages?"

Without waiting for an answer, he turned and beckoned for her to follow. They walked deeper into the repository, past shelves that seemed to whisper with ancient secrets. Finally, they stopped before a glass case that sat upon a pedestal of carved obsidian.

Inside lay a book bound in midnight-black leather, its cover adorned with symbols that seemed to shift and writhe when she wasn't looking directly at them. The Grimoire of Shadows – the very artifact that had been stolen from her family's vault twenty years ago.

"Touch the case," the mage instructed, "and we shall see if the magic recognizes its rightful heir."

Elara reached out with trembling fingers. The moment her skin made contact with the glass, the entire repository erupted in blinding light. Books flew from their shelves, pages whirling through the air like snow in a hurricane. And in that moment of chaos, she felt something awakening deep within her – a power that had been sleeping all her life.`,
  word_count: 2847,
  processing_status: 'completed',
  scenes_extracted: true,
  created_at: '2024-01-15T10:00:00Z',
  scenes: [
    {
      id: 'scene1',
      chapter_id: '1',
      scene_number: 1,
      title: 'Approaching the Tower',
      description: 'Elara approaches the ancient Repository tower during a fierce storm, pushing open its massive oak doors.',
      excerpt: 'The ancient tower loomed against the storm-darkened sky, its weathered stones slick with rain.',
      emotional_tone: 'mysterious',
      time_of_day: 'evening',
      weather: 'stormy',
      processing_status: 'completed',
      primary_image: {
        id: 'img1',
        scene_id: 'scene1',
        image_url: 'https://images.unsplash.com/photo-1520637836862-4d197d17c55a?w=800&h=600&fit=crop',
        thumbnail_url: 'https://images.unsplash.com/photo-1520637836862-4d197d17c55a?w=400&h=300&fit=crop',
        is_selected: true,
        user_rating: 4,
        quality_score: 0.85,
        dimensions: { width: 800, height: 600 },
        created_at: '2024-01-15T10:30:00Z'
      },
      images: [],
      characters: [
        {
          character: {
            id: 'char1',
            story_id: '1',
            name: 'Elara',
            aliases: [],
            base_description: 'A young woman seeking her family\'s stolen grimoire',
            personality_traits: ['determined', 'cautious', 'intelligent'],
            role: 'protagonist',
            reference_images: [],
            is_active: true
          },
          importance: 'main',
          emotional_state: 'anxious but determined'
        }
      ],
      locations: [
        {
          location: {
            id: 'loc1',
            story_id: '1',
            name: 'Repository of the Arcane',
            type: 'building',
            base_description: 'An ancient tower library filled with magical knowledge',
            atmosphere: 'mysterious and ancient',
            is_active: true
          },
          prominence: 'primary'
        }
      ]
    },
    {
      id: 'scene2',
      chapter_id: '1',
      scene_number: 2,
      title: 'Meeting the Keeper',
      description: 'Inside the repository, Elara encounters the elderly mage who guards the ancient knowledge.',
      excerpt: '"You seek the forbidden knowledge," came a voice from the darkness.',
      emotional_tone: 'tense',
      time_of_day: 'evening',
      processing_status: 'completed',
      primary_image: {
        id: 'img2',
        scene_id: 'scene2',
        image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop',
        thumbnail_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
        is_selected: true,
        user_rating: 5,
        quality_score: 0.92,
        dimensions: { width: 800, height: 600 },
        created_at: '2024-01-15T10:45:00Z'
      },
      images: [],
      characters: [
        {
          character: {
            id: 'char1',
            story_id: '1',
            name: 'Elara',
            aliases: [],
            base_description: 'A young woman seeking her family\'s stolen grimoire',
            personality_traits: ['determined', 'cautious', 'intelligent'],
            role: 'protagonist',
            reference_images: [],
            is_active: true
          },
          importance: 'main',
          emotional_state: 'cautious'
        },
        {
          character: {
            id: 'char2',
            story_id: '1',
            name: 'The Keeper',
            aliases: ['The Old Mage'],
            base_description: 'An elderly mage who guards the Repository of the Arcane',
            personality_traits: ['wise', 'mysterious', 'protective'],
            role: 'supporting',
            reference_images: [],
            is_active: true
          },
          importance: 'main',
          emotional_state: 'watchful'
        }
      ],
      locations: [
        {
          location: {
            id: 'loc1',
            story_id: '1',
            name: 'Repository of the Arcane',
            type: 'building',
            base_description: 'An ancient tower library filled with magical knowledge',
            atmosphere: 'mysterious and ancient',
            is_active: true
          },
          prominence: 'primary'
        }
      ]
    },
    {
      id: 'scene3',
      chapter_id: '1',
      scene_number: 3,
      title: 'The Grimoire Awakens',
      description: 'Elara touches the case containing her family\'s grimoire, triggering a magical awakening that transforms the entire repository.',
      excerpt: 'The entire repository erupted in blinding light. Books flew from their shelves, pages whirling through the air like snow in a hurricane.',
      emotional_tone: 'action',
      time_of_day: 'evening',
      processing_status: 'processing',
      images: [],
      characters: [
        {
          character: {
            id: 'char1',
            story_id: '1',
            name: 'Elara',
            aliases: [],
            base_description: 'A young woman seeking her family\'s stolen grimoire',
            personality_traits: ['determined', 'cautious', 'intelligent'],
            role: 'protagonist',
            reference_images: [],
            is_active: true
          },
          importance: 'main',
          emotional_state: 'overwhelmed by awakening power'
        }
      ],
      locations: [
        {
          location: {
            id: 'loc1',
            story_id: '1',
            name: 'Repository of the Arcane',
            type: 'building',
            base_description: 'An ancient tower library filled with magical knowledge',
            atmosphere: 'chaotic magical energy',
            is_active: true
          },
          prominence: 'primary'
        }
      ]
    }
  ]
}

interface ReaderSettings {
  fontSize: number
  lineHeight: number
  fontFamily: 'serif' | 'sans-serif' | 'mono'
  darkMode: boolean
  showProgress: boolean
}

export function ChapterReader({ chapterId, onBackToStory, onCharactersClick }: ChapterReaderProps) {
  const [chapter, setChapter] = useState<ChapterWithScenes | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCharacterModal, setShowCharacterModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  
  const [settings, setSettings] = useState<ReaderSettings>({
    fontSize: 18,
    lineHeight: 1.6,
    fontFamily: 'serif',
    darkMode: false,
    showProgress: true
  })

  useEffect(() => {
    const loadChapter = async () => {
      setIsLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setChapter(mockChapterWithScenes)
      setIsLoading(false)
    }
    
    loadChapter()
  }, [chapterId])

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return
      
      const scrollTop = window.scrollY
      const docHeight = contentRef.current.offsetHeight
      const winHeight = window.innerHeight
      const scrollPercent = scrollTop / (docHeight - winHeight)
      const progress = Math.min(100, Math.max(0, scrollPercent * 100))
      
      setReadingProgress(progress)
      
      // Calculate estimated time left (assuming 250 words per minute)
      if (chapter) {
        const wordsRemaining = chapter.word_count * (1 - progress / 100)
        const minutesLeft = Math.ceil(wordsRemaining / 250)
        setEstimatedTimeLeft(minutesLeft)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [chapter])

  const updateSetting = <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleRetryImage = async (sceneId: string) => {
    console.log('Retrying image generation for scene:', sceneId)
    // Simulate retry
    if (chapter) {
      setChapter(prev => ({
        ...prev!,
        scenes: prev!.scenes.map(scene => 
          scene.id === sceneId 
            ? { ...scene, processing_status: 'processing' as const }
            : scene
        )
      }))
      
      // Simulate completion
      setTimeout(() => {
        setChapter(prev => ({
          ...prev!,
          scenes: prev!.scenes.map(scene => 
            scene.id === sceneId 
              ? { 
                  ...scene, 
                  processing_status: 'completed' as const,
                  primary_image: {
                    id: `retry-${Date.now()}`,
                    scene_id: sceneId,
                    image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop',
                    thumbnail_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
                    is_selected: true,
                    dimensions: { width: 800, height: 600 },
                    created_at: new Date().toISOString()
                  }
                }
              : scene
          )
        }))
      }, 3000)
    }
  }

  const handleRateImage = async (imageId: string, rating: number) => {
    console.log('Rating image:', imageId, 'with', rating, 'stars')
    // Update the rating in the local state
    if (chapter) {
      setChapter(prev => ({
        ...prev!,
        scenes: prev!.scenes.map(scene => ({
          ...scene,
          primary_image: scene.primary_image?.id === imageId 
            ? { ...scene.primary_image, user_rating: rating }
            : scene.primary_image
        }))
      }))
    }
  }

  // Split chapter content around scene breaks
  const splitContentAroundScenes = (content: string, scenes: Scene[]) => {
    // This is a simplified version - in a real app, you'd need more sophisticated text matching
    const sections = []
    let currentPosition = 0
    
    scenes.forEach((scene, index) => {
      // Find a reasonable place to insert the scene based on content
      const sectionLength = Math.floor(content.length / scenes.length)
      const insertPosition = (index + 1) * sectionLength
      
      // Add text section before the scene
      sections.push({
        type: 'text',
        content: content.slice(currentPosition, insertPosition)
      })
      
      // Add the scene
      sections.push({
        type: 'scene',
        scene: scene
      })
      
      currentPosition = insertPosition
    })
    
    // Add remaining text
    if (currentPosition < content.length) {
      sections.push({
        type: 'text',
        content: content.slice(currentPosition)
      })
    }
    
    return sections
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chapter...</p>
        </div>
      </div>
    )
  }

  if (!chapter) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Chapter not found</p>
        </div>
      </div>
    )
  }

  const contentSections = splitContentAroundScenes(chapter.content, chapter.scenes)

  const fontFamilyClass = {
    serif: 'font-serif',
    'sans-serif': 'font-sans',
    mono: 'font-mono'
  }[settings.fontFamily]

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      settings.darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
    }`}>
      {/* Reading Progress Bar */}
      {settings.showProgress && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-1 bg-gray-200 dark:bg-gray-700">
            <div 
              className="h-full bg-blue-600 transition-all duration-150 ease-out"
              style={{ width: `${readingProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Fixed Reader Controls */}
      <div className={`fixed top-4 right-4 z-40 flex items-center space-x-2 ${
        settings.darkMode ? 'text-gray-100' : 'text-gray-900'
      }`}>
        {settings.showProgress && estimatedTimeLeft > 0 && (
          <div className={`px-3 py-1 rounded-full text-sm ${
            settings.darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}>
            {estimatedTimeLeft} min left
          </div>
        )}
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-full transition-colors ${
            settings.darkMode 
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Reader Settings Panel */}
      {showSettings && (
        <div className="fixed top-16 right-4 z-50 w-80">
          <div className={`p-6 rounded-lg shadow-xl border ${
            settings.darkMode 
              ? 'bg-gray-800 border-gray-700 text-gray-100' 
              : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <h3 className="text-lg font-medium mb-4">Reading Settings</h3>
            
            <div className="space-y-4">
              {/* Font Size */}
              <div>
                <label className="block text-sm font-medium mb-2">Font Size</label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => updateSetting('fontSize', Math.max(12, settings.fontSize - 2))}
                    className={`p-1 rounded ${
                      settings.darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    A-
                  </button>
                  <span className="text-sm w-12 text-center">{settings.fontSize}px</span>
                  <button
                    onClick={() => updateSetting('fontSize', Math.min(24, settings.fontSize + 2))}
                    className={`p-1 rounded ${
                      settings.darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    A+
                  </button>
                </div>
              </div>
              
              {/* Line Height */}
              <div>
                <label className="block text-sm font-medium mb-2">Line Spacing</label>
                <input
                  type="range"
                  min="1.2"
                  max="2.0"
                  step="0.1"
                  value={settings.lineHeight}
                  onChange={(e) => updateSetting('lineHeight', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-sm text-center mt-1">{settings.lineHeight}x</div>
              </div>
              
              {/* Font Family */}
              <div>
                <label className="block text-sm font-medium mb-2">Font</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['serif', 'sans-serif', 'mono'] as const).map(font => (
                    <button
                      key={font}
                      onClick={() => updateSetting('fontFamily', font)}
                      className={`p-2 text-sm rounded border transition-colors ${
                        settings.fontFamily === font
                          ? settings.darkMode
                            ? 'border-blue-400 bg-blue-900/20 text-blue-300'
                            : 'border-blue-500 bg-blue-50 text-blue-700'
                          : settings.darkMode
                            ? 'border-gray-600 hover:border-gray-500'
                            : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {font === 'serif' ? 'Serif' : font === 'sans-serif' ? 'Sans' : 'Mono'}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Dark Mode */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Dark Mode</label>
                <button
                  onClick={() => updateSetting('darkMode', !settings.darkMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.darkMode ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              {/* Show Progress */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Show Progress</label>
                <button
                  onClick={() => updateSetting('showProgress', !settings.showProgress)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.showProgress ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.showProgress ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" ref={contentRef}>
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => onBackToStory(chapter.story_id)} 
            className={`flex items-center transition-colors ${
              settings.darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Story
          </button>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onCharactersClick(chapter.story_id)}
              className={settings.darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : ''}
            >
              Character Roster
            </Button>
            <div className={`text-sm ${
              settings.darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Chapter {chapter.chapter_number}
            </div>
          </div>
        </div>

        {/* Chapter Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${
            settings.darkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>{chapter.title}</h1>
          <div className={`flex items-center space-x-4 text-sm ${
            settings.darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <span>{chapter.word_count.toLocaleString()} words</span>
            <span>•</span>
            <span>{Math.ceil(chapter.word_count / 250)} min read</span>
            <span>•</span>
            <span>{chapter.scenes.length} scenes</span>
            {settings.showProgress && (
              <>
                <span>•</span>
                <span>{Math.round(readingProgress)}% complete</span>
              </>
            )}
          </div>
        </div>

        {/* Chapter Content with Inline Scenes */}
        <div className={`prose prose-lg max-w-4xl mx-auto ${fontFamilyClass}`}>
          {contentSections.map((section, index) => (
            <div key={index}>
              {section.type === 'text' ? (
                <div 
                  className={`whitespace-pre-wrap leading-relaxed mb-6 ${
                    settings.darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}
                  style={{
                    fontSize: `${settings.fontSize}px`,
                    lineHeight: settings.lineHeight
                  }}
                >
                  {section.content}
                </div>
              ) : (
                <SceneImage
                  scene={(section as any).scene}
                  onRetry={handleRetryImage}
                  onRateImage={handleRateImage}
                />
              )}
            </div>
          ))}
        </div>

        {/* Chapter Navigation */}
        <div className={`mt-12 pt-8 border-t ${
          settings.darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex justify-between items-center">
            <Button 
              variant="outline"
              className={settings.darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : ''}
            >
              ← Previous Chapter
            </Button>
            
            <div className={`text-center text-sm ${
              settings.darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <div>Chapter {chapter.chapter_number} of {chapter.chapter_number + 5}</div>
              <div className="mt-1">
                Reading progress: {Math.round(readingProgress)}%
              </div>
            </div>
            
            <Button 
              variant="outline"
              className={settings.darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : ''}
            >
              Next Chapter →
            </Button>
          </div>
        </div>
      </div>
      
      {/* Click overlay to close settings */}
      {showSettings && (
        <div 
          className="fixed inset-0 z-30"
          onClick={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}