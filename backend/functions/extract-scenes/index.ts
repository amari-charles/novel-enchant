/**
 * Edge Function: extract-scenes
 * Uses GPT to extract 2-5 visual scenes from a chapter
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { 
  ExtractScenesRequest, 
  ExtractScenesResponse, 
  Scene,
  Chapter,
  Story,
  GPTSceneExtractionPrompt,
  GPTSceneExtractionResponse,
  ProcessingJob 
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

    const requestData: ExtractScenesRequest = await req.json()

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
    const { data: chapterWithStory, error: chapterError } = await supabaseClient
      .from('chapters')
      .select(`
        *,
        story:stories (
          id,
          user_id,
          title,
          genre,
          style_preset,
          custom_style_prompt
        )
      `)
      .eq('id', requestData.chapter_id)
      .single()

    if (chapterError || !chapterWithStory) {
      return new Response(
        JSON.stringify({ 
          error: 'Chapter not found',
          success: false 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user ownership
    if (chapterWithStory.story.user_id !== user.id) {
      return new Response(
        JSON.stringify({ 
          error: 'Access denied',
          success: false 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if scenes already extracted
    if (chapterWithStory.scenes_extracted) {
      return new Response(
        JSON.stringify({ 
          error: 'Scenes already extracted for this chapter',
          success: false 
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update chapter status to processing
    await supabaseClient
      .from('chapters')
      .update({ processing_status: 'processing' })
      .eq('id', requestData.chapter_id)

    // Get existing characters and locations for context
    const { data: existingCharacters } = await supabaseClient
      .from('characters')
      .select('name, aliases')
      .eq('story_id', chapterWithStory.story.id)
      .eq('is_active', true)

    const { data: existingLocations } = await supabaseClient
      .from('locations')
      .select('name')
      .eq('story_id', chapterWithStory.story.id)
      .eq('is_active', true)

    // Prepare GPT prompt
    const gptPrompt: GPTSceneExtractionPrompt = {
      chapter_text: chapterWithStory.content,
      story_context: {
        title: chapterWithStory.story.title,
        genre: chapterWithStory.story.genre || undefined,
        style_preset: chapterWithStory.story.style_preset,
        existing_characters: existingCharacters?.map(c => c.name) || [],
        existing_locations: existingLocations?.map(l => l.name) || []
      },
      extraction_parameters: {
        max_scenes: requestData.max_scenes || 5,
        focus_areas: requestData.focus_on ? [requestData.focus_on] : ['action', 'dialogue', 'description'],
        emotional_range: ['happy', 'sad', 'tense', 'romantic', 'action', 'mysterious', 'peaceful']
      }
    }

    // Call OpenAI GPT-4
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert at analyzing fiction and extracting visually compelling scenes. 
            Extract ${gptPrompt.extraction_parameters.max_scenes} key visual scenes from the provided chapter text.
            
            Focus on moments that would make compelling illustrations:
            - Character interactions and emotions
            - Dramatic action sequences  
            - Atmospheric settings and environments
            - Key plot developments
            - Visually interesting descriptions
            
            For each scene, provide:
            - A descriptive title (3-8 words)
            - A detailed visual description (50-150 words)
            - A brief excerpt of key dialogue or narrative (1-2 sentences)
            - Emotional tone
            - Time of day if mentioned
            - Weather conditions if relevant
            - Characters present
            - Location/setting
            - Visual elements that make it illustration-worthy
            
            Style context: ${gptPrompt.story_context.style_preset} ${gptPrompt.story_context.genre || ''}
            
            Return valid JSON in this exact format:
            {
              "scenes": [
                {
                  "title": "string",
                  "description": "string", 
                  "excerpt": "string",
                  "emotional_tone": "happy|sad|tense|romantic|action|mysterious|peaceful",
                  "time_of_day": "dawn|morning|afternoon|evening|night|unknown",
                  "weather": "string or null",
                  "characters_present": ["string"],
                  "location": "string",
                  "visual_elements": ["string"],
                  "narrative_importance": "high|medium|low"
                }
              ],
              "confidence_score": 0.0-1.0,
              "processing_notes": ["string"]
            }`
          },
          {
            role: 'user',
            content: `Chapter Title: "${chapterWithStory.title}"
            
            Existing Characters: ${gptPrompt.story_context.existing_characters.join(', ') || 'None established yet'}
            Existing Locations: ${gptPrompt.story_context.existing_locations.join(', ') || 'None established yet'}
            
            Chapter Text:
            ${gptPrompt.chapter_text}`
          }
        ],
        temperature: 0.3,
        max_tokens: 3000
      })
    })

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.status}`)
    }

    const openAIResult = await openAIResponse.json()
    const gptResponse: GPTSceneExtractionResponse = JSON.parse(openAIResult.choices[0].message.content)

    // Validate GPT response
    if (!gptResponse.scenes || !Array.isArray(gptResponse.scenes)) {
      throw new Error('Invalid GPT response format')
    }

    // Insert scenes into database
    const scenesToInsert = gptResponse.scenes.map((scene, index) => ({
      chapter_id: requestData.chapter_id,
      scene_number: index + 1,
      title: scene.title,
      description: scene.description,
      excerpt: scene.excerpt,
      emotional_tone: scene.emotional_tone,
      time_of_day: scene.time_of_day,
      weather: scene.weather,
      processing_status: 'pending' as const
    }))

    const { data: insertedScenes, error: scenesError } = await supabaseClient
      .from('scenes')
      .insert(scenesToInsert)
      .select()

    if (scenesError) {
      console.error('Error inserting scenes:', scenesError)
      throw new Error('Failed to save extracted scenes')
    }

    // Update chapter status
    await supabaseClient
      .from('chapters')
      .update({ 
        processing_status: 'completed',
        scenes_extracted: true 
      })
      .eq('id', requestData.chapter_id)

    // Create processing jobs for entity extraction for each scene
    const entityJobs = insertedScenes.map(scene => ({
      job_type: 'extract_entities' as const,
      entity_type: 'scene' as const,
      entity_id: scene.id,
      user_id: user.id,
      status: 'pending' as const,
      priority: 6,
      metadata: {
        scene_id: scene.id,
        chapter_id: requestData.chapter_id,
        story_id: chapterWithStory.story.id,
        gpt_characters: gptResponse.scenes[insertedScenes.indexOf(scene)]?.characters_present || [],
        gpt_location: gptResponse.scenes[insertedScenes.indexOf(scene)]?.location
      }
    }))

    const { data: processingJobs, error: jobsError } = await supabaseClient
      .from('processing_jobs')
      .insert(entityJobs)
      .select()

    if (jobsError) {
      console.error('Error creating entity extraction jobs:', jobsError)
    }

    // Update story statistics
    await supabaseClient.rpc('update_story_stats', { p_story_id: chapterWithStory.story.id })

    const response: ExtractScenesResponse = {
      scenes: insertedScenes as Scene[],
      processing_job: processingJobs?.[0] as ProcessingJob,
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
    console.error('Error in extract-scenes:', error)
    
    // Update chapter status to failed if we have the chapter_id
    const requestData = await req.json().catch(() => ({}))
    if (requestData.chapter_id) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      
      await supabaseClient
        .from('chapters')
        .update({ processing_status: 'failed' })
        .eq('id', requestData.chapter_id)
    }

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
curl -X POST 'https://your-project.supabase.co/functions/v1/extract-scenes' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "chapter_id": "123e4567-e89b-12d3-a456-426614174000",
    "max_scenes": 4,
    "focus_on": "action"
  }'
*/