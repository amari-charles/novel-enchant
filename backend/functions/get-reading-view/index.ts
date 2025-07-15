/**
 * Edge Function: get-reading-view
 * Returns comprehensive reading interface data for a chapter with scenes and images
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { 
  GetReadingViewRequest, 
  GetReadingViewResponse, 
  ChapterWithScenes,
  SceneWithDetails,
  Story
} from '../shared/types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Auth validation
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requestData: GetReadingViewRequest = await req.json()

    if (!requestData.chapter_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required field: chapter_id',
          success: false 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get chapter with story context
    const { data: chapterData, error: chapterError } = await supabaseClient
      .from('chapters')
      .select(`
        *,
        story:stories (
          id,
          user_id,
          title,
          description,
          genre,
          style_preset,
          cover_image_url,
          is_public
        )
      `)
      .eq('id', requestData.chapter_id)
      .single()

    if (chapterError || !chapterData) {
      return new Response(
        JSON.stringify({ 
          error: 'Chapter not found',
          success: false 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check access permissions
    const hasAccess = chapterData.story.user_id === user.id || chapterData.story.is_public
    if (!hasAccess) {
      return new Response(
        JSON.stringify({ 
          error: 'Access denied',
          success: false 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get scenes with full details
    const { data: scenesData, error: scenesError } = await supabaseClient
      .from('scenes')
      .select(`
        *,
        scene_characters (
          *,
          character:characters (
            id,
            name,
            base_description,
            role
          )
        ),
        scene_locations (
          *,
          location:locations (
            id,
            name,
            base_description,
            type
          )
        ),
        images (
          id,
          image_url,
          thumbnail_url,
          is_selected,
          user_rating,
          quality_score,
          dimensions,
          created_at
        )
      `)
      .eq('chapter_id', requestData.chapter_id)
      .order('scene_number', { ascending: true })

    if (scenesError) {
      console.error('Error fetching scenes:', scenesError)
      throw new Error('Failed to fetch chapter scenes')
    }

    // Process scenes data
    const scenes: SceneWithDetails[] = (scenesData || []).map(scene => ({
      ...scene,
      characters: scene.scene_characters || [],
      locations: scene.scene_locations || [],
      images: scene.images || [],
      primary_image: scene.images?.find(img => img.is_selected) || scene.images?.[0]
    }))

    // Get navigation info (previous/next chapters)
    const { data: navigationData, error: navError } = await supabaseClient
      .from('chapters')
      .select('id, title, chapter_number')
      .eq('story_id', chapterData.story.id)
      .order('chapter_number', { ascending: true })

    let previousChapter, nextChapter
    if (navigationData) {
      const currentIndex = navigationData.findIndex(ch => ch.id === requestData.chapter_id)
      if (currentIndex > 0) {
        previousChapter = navigationData[currentIndex - 1]
      }
      if (currentIndex < navigationData.length - 1) {
        nextChapter = navigationData[currentIndex + 1]
      }
    }

    // Prepare chapter data
    const chapter: ChapterWithScenes = {
      ...chapterData,
      scenes,
      // Optionally exclude raw content for privacy
      content: requestData.include_raw_text !== false ? chapterData.content : '[Content available in editing mode]'
    }

    const response: GetReadingViewResponse = {
      chapter,
      story: chapterData.story as Story,
      navigation: {
        previous_chapter: previousChapter,
        next_chapter: nextChapter
      },
      success: true
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in get-reading-view:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/* Sample usage:
curl -X POST 'https://your-project.supabase.co/functions/v1/get-reading-view' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "chapter_id": "123e4567-e89b-12d3-a456-426614174000",
    "include_raw_text": false
  }'
*/