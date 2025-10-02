/**
 * Supabase Client Configuration
 * Real database connection for Novel Enchant Enhancement Engine
 */

import { createClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types based on our schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          preferences: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          preferences?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          preferences?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
      }
      stories: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          style_preferences: Record<string, unknown> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          style_preferences?: Record<string, unknown> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          style_preferences?: Record<string, unknown> | null
          created_at?: string
          updated_at?: string
        }
      }
      chapters: {
        Row: {
          id: string
          story_id: string
          title: string | null
          text_content: string
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          story_id: string
          title?: string | null
          text_content: string
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          title?: string | null
          text_content?: string
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      anchors: {
        Row: {
          id: string
          chapter_id: string
          position: number
          active_enhancement_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chapter_id: string
          position: number
          active_enhancement_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chapter_id?: string
          position?: number
          active_enhancement_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      media: {
        Row: {
          id: string
          user_id: string
          url: string
          storage_path: string
          media_type: 'image' | 'audio' | 'video'
          file_size: number | null
          mime_type: string | null
          width: number | null
          height: number | null
          duration: number | null
          metadata: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          url: string
          storage_path: string
          media_type: 'image' | 'audio' | 'video'
          file_size?: number | null
          mime_type?: string | null
          width?: number | null
          height?: number | null
          duration?: number | null
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          url?: string
          storage_path?: string
          media_type?: 'image' | 'audio' | 'video'
          file_size?: number | null
          mime_type?: string | null
          width?: number | null
          height?: number | null
          duration?: number | null
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
      }
      enhancements: {
        Row: {
          id: string
          anchor_id: string
          chapter_id: string
          enhancement_type: 'ai_image' | 'user_image' | 'audio' | 'animation'
          media_id: string | null
          status: 'generating' | 'completed' | 'failed'
          seed: string | null
          config: Record<string, unknown>
          metadata: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          anchor_id: string
          chapter_id: string
          enhancement_type: 'ai_image' | 'user_image' | 'audio' | 'animation'
          media_id?: string | null
          status?: 'generating' | 'completed' | 'failed'
          seed?: string | null
          config?: Record<string, unknown>
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          anchor_id?: string
          chapter_id?: string
          enhancement_type?: 'ai_image' | 'user_image' | 'audio' | 'animation'
          media_id?: string | null
          status?: 'generating' | 'completed' | 'failed'
          seed?: string | null
          config?: Record<string, unknown>
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
      }
      characters: {
        Row: {
          id: string
          story_id: string
          name: string | null
          short_desc: string | null
          aliases: string[]
          status: 'candidate' | 'confirmed' | 'ignored' | 'merged'
          confidence: number
          merged_into_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          story_id: string
          name?: string | null
          short_desc?: string | null
          aliases?: string[]
          status?: 'candidate' | 'confirmed' | 'ignored' | 'merged'
          confidence?: number
          merged_into_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          name?: string | null
          short_desc?: string | null
          aliases?: string[]
          status?: 'candidate' | 'confirmed' | 'ignored' | 'merged'
          confidence?: number
          merged_into_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Typed Supabase client
export type SupabaseClient = typeof supabase

// Helper functions for authentication
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export const requireAuth = async () => {
  const user = await getCurrentUser()
  if (!user) throw new Error('Authentication required')
  return user
}

// Storage helpers
export const uploadImage = async (
  bucket: string,
  path: string,
  file: File | Blob,
  options?: { upsert?: boolean }
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, options)

  if (error) throw error
  return data
}

export const getImageUrl = async (bucket: string, path: string) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return data.publicUrl
}

export const deleteImage = async (bucket: string, path: string) => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])

  if (error) throw error
}