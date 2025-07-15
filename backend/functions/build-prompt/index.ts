/**
 * Edge Function: build-prompt
 * Constructs structured prompts for image generation using scene + character/location states
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { 
  GeneratePromptsRequest, 
  GeneratePromptsResponse, 
  Prompt,
  Scene,
  Character,
  Location,
  CharacterState,
  LocationState,
  CharacterReferenceImage,
  PromptConstructionContext,
  ConstructedPrompt
} from '../shared/types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Style preset configurations
const STYLE_CONFIGURATIONS = {
  fantasy: {
    base_modifiers: ['fantasy art', 'magical atmosphere', 'ethereal lighting', 'detailed fantasy illustration'],
    lighting: 'dramatic lighting with magical undertones',
    color_palette: 'rich jewel tones with mystical highlights',
    art_style: 'fantasy concept art, digital painting'
  },
  scifi: {
    base_modifiers: ['science fiction', 'futuristic technology', 'cyberpunk atmosphere', 'detailed sci-fi illustration'],
    lighting: 'neon lighting and holographic effects',
    color_palette: 'cool blues and teals with metallic accents',
    art_style: 'sci-fi concept art, digital illustration'
  },
  romance: {
    base_modifiers: ['romantic atmosphere', 'soft lighting', 'elegant composition', 'beautiful illustration'],
    lighting: 'soft romantic lighting with warm undertones',
    color_palette: 'warm pastels and soft romantic tones',
    art_style: 'romantic illustration, soft digital painting'
  },
  thriller: {
    base_modifiers: ['dark atmosphere', 'suspenseful mood', 'dramatic shadows', 'noir illustration'],
    lighting: 'dramatic chiaroscuro lighting with deep shadows',
    color_palette: 'dark muted tones with stark contrasts',
    art_style: 'thriller concept art, dramatic illustration'
  },
  historical: {
    base_modifiers: ['historical accuracy', 'period-appropriate details', 'classical composition', 'detailed historical illustration'],
    lighting: 'natural period-appropriate lighting',
    color_palette: 'authentic historical color palette',
    art_style: 'historical illustration, classical painting style'
  },
  contemporary: {
    base_modifiers: ['modern setting', 'realistic style', 'contemporary atmosphere', 'detailed modern illustration'],
    lighting: 'natural modern lighting',
    color_palette: 'realistic contemporary colors',
    art_style: 'modern illustration, realistic digital art'
  }
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

    const requestData: GeneratePromptsRequest = await req.json()

    if (!requestData.scene_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required field: scene_id',
          success: false 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get scene with full context
    const { data: sceneData, error: sceneError } = await supabaseClient
      .from('scenes')
      .select(`
        *,
        chapter:chapters (
          id,
          chapter_number,
          story:stories (
            id,
            user_id,
            title,
            style_preset,
            custom_style_prompt
          )
        )
      `)
      .eq('id', requestData.scene_id)
      .single()

    if (sceneError || !sceneData) {
      return new Response(
        JSON.stringify({ 
          error: 'Scene not found',
          success: false 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user ownership
    if (sceneData.chapter.story.user_id !== user.id) {
      return new Response(
        JSON.stringify({ 
          error: 'Access denied',
          success: false 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get characters involved in this scene
    const { data: sceneCharacters, error: charactersError } = await supabaseClient
      .from('scene_characters')
      .select(`
        *,
        character:characters (
          *,
          reference_images:character_reference_images (*)
        )
      `)
      .eq('scene_id', requestData.scene_id)

    if (charactersError) {
      console.error('Error fetching scene characters:', charactersError)
    }

    // Get locations involved in this scene
    const { data: sceneLocations, error: locationsError } = await supabaseClient
      .from('scene_locations')
      .select(`
        *,
        location:locations (*)
      `)
      .eq('scene_id', requestData.scene_id)

    if (locationsError) {
      console.error('Error fetching scene locations:', locationsError)
    }

    // Get character states for the current chapter
    const characterStates: CharacterState[] = []
    const locationStates: LocationState[] = []

    if (sceneCharacters) {
      for (const sceneChar of sceneCharacters) {
        const { data: latestState } = await supabaseClient
          .rpc('get_latest_character_state', {
            p_character_id: sceneChar.character.id,
            p_chapter_number: sceneData.chapter.chapter_number
          })
        
        if (latestState) {
          characterStates.push(latestState)
        }
      }
    }

    if (sceneLocations) {
      for (const sceneLoc of sceneLocations) {
        const { data: latestState } = await supabaseClient
          .rpc('get_latest_location_state', {
            p_location_id: sceneLoc.location.id,
            p_chapter_number: sceneData.chapter.chapter_number
          })
        
        if (latestState) {
          locationStates.push(latestState)
        }
      }
    }

    // Construct the prompt
    const constructedPrompt = await constructImagePrompt({
      scene: sceneData,
      characters: sceneCharacters?.map(sc => sc.character) || [],
      character_states: characterStates,
      locations: sceneLocations?.map(sl => sl.location) || [],
      location_states: locationStates,
      story_style: {
        preset: sceneData.chapter.story.style_preset,
        custom_prompt: sceneData.chapter.story.custom_style_prompt,
        artistic_modifiers: requestData.artistic_style ? [requestData.artistic_style] : []
      }
    }, requestData)

    // Insert prompt into database
    const { data: insertedPrompt, error: promptError } = await supabaseClient
      .from('prompts')
      .insert({
        scene_id: requestData.scene_id,
        version: 1,
        prompt_text: constructedPrompt.main_prompt,
        negative_prompt: constructedPrompt.negative_prompt,
        style_modifiers: constructedPrompt.style_modifiers,
        character_references: sceneCharacters?.map(sc => sc.character.id) || [],
        location_references: sceneLocations?.map(sl => sl.location.id) || [],
        technical_parameters: constructedPrompt.technical_parameters,
        generation_status: 'pending'
      })
      .select()
      .single()

    if (promptError) {
      console.error('Error inserting prompt:', promptError)
      throw new Error('Failed to save generated prompt')
    }

    // Update scene status
    await supabaseClient
      .from('scenes')
      .update({ processing_status: 'completed' })
      .eq('id', requestData.scene_id)

    const response: GeneratePromptsResponse = {
      prompt: insertedPrompt as Prompt,
      character_states: characterStates,
      location_states: locationStates,
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
    console.error('Error in build-prompt:', error)
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

/**
 * Core prompt construction logic
 */
async function constructImagePrompt(
  context: PromptConstructionContext,
  request: GeneratePromptsRequest
): Promise<ConstructedPrompt> {
  const { scene, characters, character_states, locations, location_states, story_style } = context
  
  // Get style configuration
  const styleConfig = STYLE_CONFIGURATIONS[story_style.preset]
  
  // Build character descriptions
  const characterDescriptions: string[] = []
  characters.forEach((character, index) => {
    const state = character_states.find(cs => cs.character_id === character.id)
    const sceneCharacter = context.characters.find(c => c.id === character.id)
    
    if (request.character_focus && !request.character_focus.includes(character.id)) {
      return // Skip non-focused characters if focus is specified
    }
    
    let description = character.name
    
    // Use state description if available, otherwise base description
    const appearanceDesc = state?.appearance_description || character.base_description
    description += `, ${appearanceDesc}`
    
    // Add clothing if specified
    if (state?.clothing_description) {
      description += `, wearing ${state.clothing_description}`
    }
    
    // Add emotional state if specified
    if (state?.emotional_state) {
      description += `, ${state.emotional_state}`
    }
    
    // Add any scene-specific notes
    if (sceneCharacter && sceneCharacter.specific_appearance_notes) {
      description += `, ${sceneCharacter.specific_appearance_notes}`
    }
    
    characterDescriptions.push(description)
  })
  
  // Build location descriptions  
  const locationDescriptions: string[] = []
  locations.forEach(location => {
    const state = location_states.find(ls => ls.location_id === location.id)
    
    let description = location.name
    
    // Use state description if available, otherwise base description
    const visualDesc = state?.visual_description || location.base_description
    description += `, ${visualDesc}`
    
    // Add lighting conditions
    if (state?.lighting_conditions) {
      description += `, ${state.lighting_conditions}`
    }
    
    // Add weather if specified and matches scene
    if (state?.weather || scene.weather) {
      const weather = state?.weather || scene.weather
      description += `, ${weather} weather`
    }
    
    locationDescriptions.push(description)
  })
  
  // Build main prompt components
  const promptParts: string[] = []
  
  // Scene description
  promptParts.push(scene.description)
  
  // Characters
  if (characterDescriptions.length > 0) {
    promptParts.push(`Characters: ${characterDescriptions.join('; ')}`)
  }
  
  // Setting/Location
  if (locationDescriptions.length > 0) {
    promptParts.push(`Setting: ${locationDescriptions.join(', ')}`)
  }
  
  // Time and atmosphere
  const atmosphereElements: string[] = []
  if (scene.time_of_day && scene.time_of_day !== 'unknown') {
    atmosphereElements.push(`${scene.time_of_day} time`)
  }
  if (scene.emotional_tone) {
    atmosphereElements.push(`${scene.emotional_tone} mood`)
  }
  if (scene.weather) {
    atmosphereElements.push(`${scene.weather} weather`)
  }
  
  if (atmosphereElements.length > 0) {
    promptParts.push(`Atmosphere: ${atmosphereElements.join(', ')}`)
  }
  
  // Style and artistic direction
  const styleElements = [...styleConfig.base_modifiers]
  if (story_style.custom_prompt) {
    styleElements.push(story_style.custom_prompt)
  }
  if (story_style.artistic_modifiers.length > 0) {
    styleElements.push(...story_style.artistic_modifiers)
  }
  if (request.artistic_style) {
    styleElements.push(request.artistic_style)
  }
  
  promptParts.push(`Style: ${styleConfig.art_style}, ${styleElements.join(', ')}`)
  promptParts.push(`Lighting: ${styleConfig.lighting}`)
  promptParts.push(`Colors: ${styleConfig.color_palette}`)
  
  // Final quality modifiers
  promptParts.push('highly detailed, masterpiece, best quality, 8k resolution')
  
  const mainPrompt = promptParts.join('. ')
  
  // Build negative prompt
  const negativePrompt = [
    'low quality', 'blurry', 'ugly', 'bad anatomy', 'bad hands', 'text', 'watermark', 
    'signature', 'username', 'low resolution', 'worst quality', 'jpeg artifacts',
    'duplicate', 'multiple characters' + (characters.length === 1 ? '' : ' beyond specified'),
    'deformed', 'disfigured', 'mutation', 'mutated'
  ].join(', ')
  
  // Collect IP-Adapter reference images
  const characterIpAdapterImages: string[] = []
  characters.forEach(character => {
    const primaryRef = character.reference_images?.find(img => img.is_primary)
    if (primaryRef) {
      characterIpAdapterImages.push(primaryRef.image_url)
    }
  })
  
  return {
    main_prompt: mainPrompt,
    negative_prompt: negativePrompt,
    style_modifiers: styleConfig.base_modifiers,
    technical_parameters: {
      width: 768,
      height: 1024,
      steps: 25,
      cfg_scale: 7.5,
      sampler: 'DPM++ 2M Karras'
    },
    character_ip_adapter_images: characterIpAdapterImages,
    metadata: {
      character_references: characters.map(c => c.id),
      location_references: locations.map(l => l.id),
      construction_notes: [
        `Generated for scene: ${scene.title}`,
        `Style preset: ${story_style.preset}`,
        `Characters included: ${characters.length}`,
        `Locations included: ${locations.length}`
      ]
    }
  }
}

/* Sample usage:
curl -X POST 'https://your-project.supabase.co/functions/v1/build-prompt' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "scene_id": "123e4567-e89b-12d3-a456-426614174000",
    "artistic_style": "cinematic composition",
    "character_focus": ["character-uuid-1", "character-uuid-2"]
  }'
*/