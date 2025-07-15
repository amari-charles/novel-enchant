/**
 * Edge Function: upload-chapter
 * Accepts a chapter upload, stores it, and initiates scene extraction
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { 
  UploadChapterRequest, 
  UploadChapterResponse, 
  Chapter, 
  ProcessingJob,
  Story 
} from '../shared/types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Get user from Authorization header
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

    // Parse request body
    const requestData: UploadChapterRequest = await req.json()

    // Validate request data
    if (!requestData.story_id || !requestData.title || !requestData.content) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: story_id, title, content',
          success: false 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user owns the story
    const { data: story, error: storyError } = await supabaseClient
      .from('stories')
      .select('id, user_id, status')
      .eq('id', requestData.story_id)
      .eq('user_id', user.id)
      .single()

    if (storyError || !story) {
      return new Response(
        JSON.stringify({ 
          error: 'Story not found or access denied',
          success: false 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (story.status !== 'active') {
      return new Response(
        JSON.stringify({ 
          error: 'Cannot upload chapters to inactive stories',
          success: false 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if chapter number already exists
    const { data: existingChapter } = await supabaseClient
      .from('chapters')
      .select('id')
      .eq('story_id', requestData.story_id)
      .eq('chapter_number', requestData.chapter_number)
      .single()

    if (existingChapter) {
      return new Response(
        JSON.stringify({ 
          error: `Chapter ${requestData.chapter_number} already exists`,
          success: false 
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate word count
    const wordCount = requestData.content.trim().split(/\s+/).length

    // Validate content length
    if (wordCount < 100) {
      return new Response(
        JSON.stringify({ 
          error: 'Chapter content must be at least 100 words',
          success: false 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (wordCount > 50000) {
      return new Response(
        JSON.stringify({ 
          error: 'Chapter content exceeds maximum length of 50,000 words',
          success: false 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert the chapter
    const { data: chapter, error: chapterError } = await supabaseClient
      .from('chapters')
      .insert({
        story_id: requestData.story_id,
        chapter_number: requestData.chapter_number,
        title: requestData.title,
        content: requestData.content,
        processing_status: 'pending'
      })
      .select()
      .single()

    if (chapterError) {
      console.error('Error inserting chapter:', chapterError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to save chapter',
          success: false 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create processing job for scene extraction
    const { data: processingJob, error: jobError } = await supabaseClient
      .from('processing_jobs')
      .insert({
        job_type: 'extract_scenes',
        entity_type: 'chapter',
        entity_id: chapter.id,
        user_id: user.id,
        status: 'pending',
        priority: 5,
        metadata: {
          chapter_id: chapter.id,
          story_id: requestData.story_id,
          word_count: wordCount,
          auto_start: true
        }
      })
      .select()
      .single()

    if (jobError) {
      console.error('Error creating processing job:', jobError)
      // Chapter was created, but job failed - update chapter status
      await supabaseClient
        .from('chapters')
        .update({ processing_status: 'failed' })
        .eq('id', chapter.id)
    }

    // Update story statistics
    await supabaseClient.rpc('update_story_stats', { p_story_id: requestData.story_id })

    // Prepare response
    const response: UploadChapterResponse = {
      chapter: chapter as Chapter,
      processing_job: processingJob as ProcessingJob,
      success: true
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in upload-chapter:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
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
curl -X POST 'https://your-project.supabase.co/functions/v1/upload-chapter' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "story_id": "123e4567-e89b-12d3-a456-426614174000",
    "chapter_number": 1,
    "title": "The Beginning",
    "content": "It was a dark and stormy night when our hero first..."
  }'
*/