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
      works: {
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
          work_id: string
          title: string | null
          text_content: string
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          work_id: string
          title?: string | null
          text_content: string
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          work_id?: string
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
          active_image_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chapter_id: string
          position: number
          active_image_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chapter_id?: string
          position?: number
          active_image_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      prompts: {
        Row: {
          id: string
          anchor_id: string
          version: number
          body: string
          ref_ids: string[]
          seed: string | null
          metadata: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          anchor_id: string
          version?: number
          body: string
          ref_ids?: string[]
          seed?: string | null
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          anchor_id?: string
          version?: number
          body?: string
          ref_ids?: string[]
          seed?: string | null
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
      }
      images: {
        Row: {
          id: string
          anchor_id: string
          prompt_id: string
          url: string
          thumbnail_url: string | null
          status: 'generating' | 'completed' | 'failed'
          metadata: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          anchor_id: string
          prompt_id: string
          url: string
          thumbnail_url?: string | null
          status?: 'generating' | 'completed' | 'failed'
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          anchor_id?: string
          prompt_id?: string
          url?: string
          thumbnail_url?: string | null
          status?: 'generating' | 'completed' | 'failed'
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
      }
      characters: {
        Row: {
          id: string
          work_id: string
          name: string | null
          short_desc: string | null
          aliases: string[]
          status: 'candidate' | 'confirmed' | 'ignored' | 'merged'
          confidence: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          work_id: string
          name?: string | null
          short_desc?: string | null
          aliases?: string[]
          status?: 'candidate' | 'confirmed' | 'ignored' | 'merged'
          confidence?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          work_id?: string
          name?: string | null
          short_desc?: string | null
          aliases?: string[]
          status?: 'candidate' | 'confirmed' | 'ignored' | 'merged'
          confidence?: number
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