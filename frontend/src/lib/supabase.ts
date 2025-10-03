/**
 * Supabase Client Configuration
 * Real database connection for Novel Enchant Enhancement Engine
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase-generated'

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client with generated types
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Re-export Database type for convenience
export type { Database }

// Typed Supabase client
export type SupabaseClient = typeof supabase
