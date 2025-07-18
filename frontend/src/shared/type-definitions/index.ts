// Frontend type definitions for Novel Enchant
// Simplified subset of backend types for client-side use

export type UUID = string
export type Timestamp = string

// Core entities
export interface Story {
  id: UUID
  title: string
  description?: string
  genre?: string
  style_preset: 'fantasy' | 'scifi' | 'romance' | 'thriller' | 'historical' | 'contemporary'
  cover_image_url?: string
  total_chapters: number
  total_scenes: number
  created_at: Timestamp
  updated_at: Timestamp
}

export interface Chapter {
  id: UUID
  story_id: UUID
  chapter_number: number
  title: string
  content: string
  word_count: number
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  scenes_extracted: boolean
  created_at: Timestamp
}

export interface Scene {
  id: UUID
  chapter_id: UUID
  scene_number: number
  title: string
  description: string
  excerpt?: string
  emotional_tone?: string
  time_of_day?: string
  weather?: string
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  primary_image?: Image
  images: Image[]
  characters: SceneCharacter[]
  locations: SceneLocation[]
}

export interface Character {
  id: UUID
  story_id: UUID
  name: string
  base_description: string
  role?: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  primary_reference_image?: CharacterReferenceImage
  is_active: boolean
}

export interface CharacterReferenceImage {
  id: UUID
  character_id: UUID
  image_url: string
  is_primary: boolean
  description?: string
}

export interface Location {
  id: UUID
  story_id: UUID
  name: string
  type?: string
  base_description: string
  atmosphere?: string
  is_active: boolean
}

export interface Image {
  id: UUID
  scene_id: UUID
  image_url: string
  thumbnail_url?: string
  is_selected: boolean
  user_rating?: number
  quality_score?: number
  dimensions?: { width: number; height: number }
  created_at: Timestamp
}

export interface SceneCharacter {
  character: Character
  importance: 'main' | 'secondary' | 'background'
  emotional_state?: string
}

export interface SceneLocation {
  location: Location
  prominence: 'primary' | 'secondary' | 'background'
}

// Form types
export interface CreateStoryForm {
  // Primary input
  content: string
  source_url?: string
  
  // AI-deduced fields (editable)
  title: string
  description?: string
  genre?: string
  style_preset: Story['style_preset']
  cover_image_url?: string
  
  // Metadata
  is_public?: boolean
  confidence_scores?: {
    title: number
    genre: number
    style_preset: number
    description: number
  }
}

export interface UploadChapterForm {
  title: string
  content: string
  word_count?: number
  estimated_read_time?: number // in minutes
}

// API response types
export interface ApiResponse<T> {
  data?: T
  success: boolean
  error?: string
}

export interface StoryWithChapters extends Story {
  chapters: Chapter[]
}

export interface ChapterWithScenes extends Chapter {
  scenes: Scene[]
}

// UI State types
export interface ProcessingStatus {
  isProcessing: boolean
  currentStep?: string
  progress?: number
  error?: string
}

export interface ChapterReaderState {
  chapter: ChapterWithScenes
  isLoading: boolean
  error?: string
  showCharacterModal: boolean
  selectedCharacter?: Character
}

export interface StoryDashboardState {
  stories: Story[]
  isLoading: boolean
  error?: string
  showCreateForm: boolean
}

// Component prop types
export interface StoryCardProps {
  story: Story
  onClick: () => void
}

export interface SceneImageProps {
  scene: Scene
  onRetry?: (sceneId: UUID) => void
  onRateImage?: (imageId: UUID, rating: number) => void
}

export interface CharacterCardProps {
  character: Character
  onClick?: () => void
  showSceneCount?: boolean
}

export interface ChapterListItemProps {
  chapter: Chapter
  onView: () => void
  onEdit?: () => void
  onDelete?: () => void
}

// Hook return types
export interface UseStoriesReturn {
  stories: Story[]
  isLoading: boolean
  error?: string
  createStory: (data: CreateStoryForm) => Promise<Story>
  deleteStory: (id: UUID) => Promise<void>
  refreshStories: () => Promise<void>
}

export interface UseChaptersReturn {
  chapters: Chapter[]
  isLoading: boolean
  error?: string
  uploadChapter: (storyId: UUID, data: UploadChapterForm) => Promise<Chapter>
  deleteChapter: (id: UUID) => Promise<void>
  refreshChapters: () => Promise<void>
}

export interface UseChapterReaderReturn {
  chapter?: ChapterWithScenes
  isLoading: boolean
  error?: string
  retryImageGeneration: (sceneId: UUID) => Promise<void>
  rateImage: (imageId: UUID, rating: number) => Promise<void>
}

// Error types
export interface AppError {
  message: string
  code?: string
  details?: Record<string, any>
}