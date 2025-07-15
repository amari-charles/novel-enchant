/**
 * Edge Function: queue-image-generation
 * Queues async image generation jobs for SDXL+IP-Adapter pipeline
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { 
  QueueImageGenerationRequest, 
  QueueImageGenerationResponse, 
  ProcessingJob,
  Prompt 
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

    const requestData: QueueImageGenerationRequest = await req.json()

    if (!requestData.prompt_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required field: prompt_id',
          success: false 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get prompt with scene context to verify ownership
    const { data: promptData, error: promptError } = await supabaseClient
      .from('prompts')
      .select(`
        *,
        scene:scenes (
          id,
          chapter:chapters (
            story:stories (
              user_id
            )
          )
        )
      `)
      .eq('id', requestData.prompt_id)
      .single()

    if (promptError || !promptData) {
      return new Response(
        JSON.stringify({ 
          error: 'Prompt not found',
          success: false 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user ownership
    if (promptData.scene.chapter.story.user_id !== user.id) {
      return new Response(
        JSON.stringify({ 
          error: 'Access denied',
          success: false 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if prompt is ready for generation
    if (promptData.generation_status !== 'pending') {
      return new Response(
        JSON.stringify({ 
          error: `Prompt is not ready for generation (status: ${promptData.generation_status})`,
          success: false 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check user credits
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('generation_credits, subscription_tier')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ 
          error: 'User data not found',
          success: false 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate credit cost based on parameters and subscription
    const parameters = requestData.parameters || {}
    const width = parameters.width || 768
    const height = parameters.height || 1024
    const steps = parameters.steps || 25

    let creditCost = 1 // Base cost
    
    // Higher resolution costs more
    if (width > 768 || height > 1024) {
      creditCost += 1
    }
    
    // More steps cost more
    if (steps > 30) {
      creditCost += 1
    }
    
    // Pro/Premium users get discounts
    if (userData.subscription_tier === 'pro') {
      creditCost = Math.max(1, Math.floor(creditCost * 0.8))
    } else if (userData.subscription_tier === 'premium') {
      creditCost = Math.max(1, Math.floor(creditCost * 0.6))
    }

    if (userData.generation_credits < creditCost) {
      return new Response(
        JSON.stringify({ 
          error: `Insufficient credits. Required: ${creditCost}, Available: ${userData.generation_credits}`,
          success: false 
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current queue position
    const { data: queueData, error: queueError } = await supabaseClient
      .from('processing_jobs')
      .select('id')
      .eq('job_type', 'generate_images')
      .in('status', ['pending', 'processing'])
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true })

    const queuePosition = queueData ? queueData.length + 1 : 1

    // Estimate completion time (rough calculation)
    const avgProcessingTimeMs = 45000 // 45 seconds average per image
    const estimatedCompletionMs = Date.now() + (queuePosition * avgProcessingTimeMs)
    const estimatedCompletion = new Date(estimatedCompletionMs).toISOString()

    // Create processing job
    const jobMetadata = {
      prompt_id: requestData.prompt_id,
      scene_id: promptData.scene.id,
      generation_parameters: {
        ...promptData.technical_parameters,
        ...parameters
      },
      credit_cost: creditCost,
      ip_adapter_images: promptData.character_references || [],
      estimated_processing_time_ms: avgProcessingTimeMs
    }

    const { data: processingJob, error: jobError } = await supabaseClient
      .from('processing_jobs')
      .insert({
        job_type: 'generate_images',
        entity_type: 'scene',
        entity_id: promptData.scene.id,
        user_id: user.id,
        status: 'pending',
        priority: requestData.priority || 5,
        metadata: jobMetadata
      })
      .select()
      .single()

    if (jobError) {
      console.error('Error creating processing job:', jobError)
      throw new Error('Failed to queue image generation job')
    }

    // Update prompt status to queued
    await supabaseClient
      .from('prompts')
      .update({ generation_status: 'queued' })
      .eq('id', requestData.prompt_id)

    // Deduct credits (optimistic - will be refunded if generation fails)
    await supabaseClient
      .from('users')
      .update({ 
        generation_credits: userData.generation_credits - creditCost 
      })
      .eq('id', user.id)

    const response: QueueImageGenerationResponse = {
      processing_job: processingJob as ProcessingJob,
      estimated_completion: estimatedCompletion,
      queue_position: queuePosition,
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
    console.error('Error in queue-image-generation:', error)
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
curl -X POST 'https://your-project.supabase.co/functions/v1/queue-image-generation' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt_id": "123e4567-e89b-12d3-a456-426614174000",
    "priority": 3,
    "parameters": {
      "width": 1024,
      "height": 1024,
      "steps": 30,
      "cfg_scale": 8.0
    }
  }'
*/