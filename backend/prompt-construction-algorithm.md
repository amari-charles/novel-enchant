# Novel Enchant - Prompt Construction Algorithm

## Overview

The prompt construction system is the heart of Novel Enchant's image generation pipeline. It transforms extracted story scenes into detailed, contextually-aware prompts that produce visually consistent and narratively appropriate illustrations.

## Core Algorithm Flow

### 1. Context Gathering Phase

```typescript
async function gatherPromptContext(sceneId: UUID, chapterNumber: number) {
  // 1. Get scene details
  const scene = await getSceneById(sceneId)
  
  // 2. Get involved characters
  const sceneCharacters = await getSceneCharacters(sceneId)
  
  // 3. Get involved locations  
  const sceneLocations = await getSceneLocations(sceneId)
  
  // 4. Get latest character states (≤ current chapter)
  const characterStates = await Promise.all(
    sceneCharacters.map(sc => 
      getLatestCharacterState(sc.character_id, chapterNumber)
    )
  )
  
  // 5. Get latest location states (≤ current chapter)
  const locationStates = await Promise.all(
    sceneLocations.map(sl => 
      getLatestLocationState(sl.location_id, chapterNumber)
    )
  )
  
  // 6. Get story style preferences
  const storyStyle = await getStoryStylePreferences(scene.story_id)
  
  return {
    scene,
    characters: sceneCharacters,
    locations: sceneLocations,
    characterStates,
    locationStates,
    storyStyle
  }
}
```

### 2. Character Description Assembly

The algorithm constructs character descriptions by layering information in priority order:

```typescript
function assembleCharacterDescription(
  character: Character,
  characterState: CharacterState | null,
  sceneCharacter: SceneCharacter
): string {
  const elements = [character.name]
  
  // Priority 1: Current state appearance (most recent)
  if (characterState?.appearance_description) {
    elements.push(characterState.appearance_description)
  } else {
    // Fallback: Base character description
    elements.push(character.base_description)
  }
  
  // Priority 2: Current clothing/attire
  if (characterState?.clothing_description) {
    elements.push(`wearing ${characterState.clothing_description}`)
  }
  
  // Priority 3: Current emotional state
  if (characterState?.emotional_state) {
    elements.push(characterState.emotional_state)
  } else if (sceneCharacter.emotional_state) {
    elements.push(sceneCharacter.emotional_state)
  }
  
  // Priority 4: Scene-specific appearance notes
  if (sceneCharacter.specific_appearance_notes) {
    elements.push(sceneCharacter.specific_appearance_notes)
  }
  
  // Priority 5: Injuries or temporary changes
  if (characterState?.injuries_or_changes) {
    elements.push(characterState.injuries_or_changes)
  }
  
  return elements.join(', ')
}
```

### 3. Location Description Assembly

```typescript
function assembleLocationDescription(
  location: Location,
  locationState: LocationState | null,
  sceneLocation: SceneLocation
): string {
  const elements = [location.name]
  
  // Priority 1: Current visual state
  if (locationState?.visual_description) {
    elements.push(locationState.visual_description)
  } else {
    elements.push(location.base_description)
  }
  
  // Priority 2: Lighting conditions
  if (locationState?.lighting_conditions) {
    elements.push(locationState.lighting_conditions)
  }
  
  // Priority 3: Weather (state takes precedence over scene)
  const weather = locationState?.weather || scene.weather
  if (weather) {
    elements.push(`${weather} weather`)
  }
  
  // Priority 4: Time-based changes
  if (locationState?.time_of_day) {
    elements.push(`${locationState.time_of_day} lighting`)
  }
  
  // Priority 5: Seasonal or damage changes
  if (locationState?.seasonal_changes) {
    elements.push(locationState.seasonal_changes)
  }
  if (locationState?.damage_or_changes) {
    elements.push(locationState.damage_or_changes)
  }
  
  // Priority 6: Scene-specific details
  if (sceneLocation.specific_details) {
    elements.push(sceneLocation.specific_details)
  }
  
  return elements.join(', ')
}
```

### 4. Style and Atmosphere Integration

```typescript
const STYLE_TEMPLATES = {
  fantasy: {
    base_modifiers: ['fantasy art', 'magical atmosphere', 'ethereal lighting'],
    lighting_style: 'dramatic magical lighting',
    color_palette: 'rich jewel tones with mystical highlights',
    art_direction: 'fantasy concept art, digital painting',
    negative_modifiers: ['modern technology', 'contemporary clothing']
  },
  
  scifi: {
    base_modifiers: ['science fiction', 'futuristic technology', 'cyberpunk'],
    lighting_style: 'neon and holographic lighting',
    color_palette: 'cool blues and teals with metallic accents',
    art_direction: 'sci-fi concept art, digital illustration',
    negative_modifiers: ['medieval', 'fantasy elements', 'magic']
  },
  
  // ... other style presets
}

function applyStylePreset(
  prompt: PromptBuilder,
  stylePreset: StylePreset,
  customStyle?: string
) {
  const template = STYLE_TEMPLATES[stylePreset]
  
  prompt.addStyleModifiers(template.base_modifiers)
  prompt.setLightingStyle(template.lighting_style)
  prompt.setColorPalette(template.color_palette)
  prompt.setArtDirection(template.art_direction)
  prompt.addNegativePrompts(template.negative_modifiers)
  
  if (customStyle) {
    prompt.addCustomStyleElements(customStyle)
  }
}
```

### 5. Prompt Assembly and Optimization

```typescript
function assemblePrompt(context: PromptContext): ConstructedPrompt {
  const promptBuilder = new PromptBuilder()
  
  // 1. Scene foundation
  promptBuilder.setSceneDescription(context.scene.description)
  
  // 2. Character assembly (ordered by importance)
  const characterDescs = context.characters
    .sort((a, b) => getImportanceWeight(a.importance) - getImportanceWeight(b.importance))
    .map(sc => assembleCharacterDescription(
      sc.character, 
      context.characterStates.find(cs => cs.character_id === sc.character_id),
      sc
    ))
  
  if (characterDescs.length > 0) {
    promptBuilder.addCharacters(characterDescs)
  }
  
  // 3. Location assembly (primary location first)
  const locationDescs = context.locations
    .sort((a, b) => getProminenceWeight(a.prominence) - getProminenceWeight(b.prominence))
    .map(sl => assembleLocationDescription(
      sl.location,
      context.locationStates.find(ls => ls.location_id === sl.location_id),
      sl
    ))
  
  if (locationDescs.length > 0) {
    promptBuilder.addLocations(locationDescs)
  }
  
  // 4. Atmosphere and mood
  promptBuilder.addAtmosphere({
    timeOfDay: context.scene.time_of_day,
    emotionalTone: context.scene.emotional_tone,
    weather: context.scene.weather
  })
  
  // 5. Style application
  applyStylePreset(
    promptBuilder, 
    context.storyStyle.preset, 
    context.storyStyle.custom_prompt
  )
  
  // 6. Technical parameters
  promptBuilder.setTechnicalParams({
    width: 768,
    height: 1024,
    steps: 25,
    cfg_scale: 7.5,
    sampler: 'DPM++ 2M Karras'
  })
  
  // 7. Quality and final touches
  promptBuilder.addQualityModifiers([
    'highly detailed', 'masterpiece', 'best quality', 
    '8k resolution', 'professional illustration'
  ])
  
  return promptBuilder.build()
}
```

## Character State Evolution Logic

### State Priority Resolution

```typescript
function getCharacterStateForChapter(
  characterId: UUID, 
  targetChapter: number
): CharacterState | null {
  
  // Get all states for this character up to target chapter
  const states = getAllCharacterStates(characterId)
    .filter(state => state.chapter_number <= targetChapter)
    .sort((a, b) => b.chapter_number - a.chapter_number) // Most recent first
  
  return states[0] || null // Return most recent state or null
}
```

### Automatic State Inference

```typescript
async function inferCharacterStateChanges(
  sceneId: UUID,
  extractedCharacterInfo: GPTCharacterInfo
): Promise<CharacterState[]> {
  
  const newStates: CharacterState[] = []
  
  for (const charInfo of extractedCharacterInfo) {
    const character = await findOrCreateCharacter(charInfo.name, sceneId)
    const currentChapter = await getChapterNumberForScene(sceneId)
    const lastState = await getCharacterStateForChapter(character.id, currentChapter - 1)
    
    // Detect significant changes
    const hasAppearanceChange = lastState && 
      !areDescriptionsSimilar(lastState.appearance_description, charInfo.current_description)
    
    const hasEmotionalChange = lastState &&
      lastState.emotional_state !== charInfo.emotional_state
    
    const hasClothingChange = lastState &&
      lastState.clothing_description !== charInfo.clothing_description
    
    // Create new state if significant changes detected
    if (!lastState || hasAppearanceChange || hasEmotionalChange || hasClothingChange) {
      newStates.push({
        character_id: character.id,
        chapter_number: currentChapter,
        appearance_description: charInfo.current_description,
        clothing_description: charInfo.clothing_description,
        emotional_state: charInfo.emotional_state,
        injuries_or_changes: charInfo.temporary_changes,
        notes: `Auto-generated from scene: ${sceneId}`
      })
    }
  }
  
  return newStates
}
```

## IP-Adapter Integration

### Reference Image Selection

```typescript
function selectIPAdapterImages(characters: Character[]): string[] {
  const selectedImages: string[] = []
  
  for (const character of characters) {
    // Priority 1: Primary reference image
    const primaryRef = character.reference_images
      .find(img => img.is_primary && img.source_type !== 'uploaded')
    
    if (primaryRef) {
      selectedImages.push(primaryRef.image_url)
      continue
    }
    
    // Priority 2: Highest quality generated image
    const bestGenerated = character.reference_images
      .filter(img => img.source_type === 'ai_generated')
      .sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0))[0]
    
    if (bestGenerated) {
      selectedImages.push(bestGenerated.image_url)
      continue
    }
    
    // Priority 3: Any available reference
    const anyRef = character.reference_images[0]
    if (anyRef) {
      selectedImages.push(anyRef.image_url)
    }
  }
  
  return selectedImages
}
```

## Advanced Prompt Optimization

### Dynamic Prompt Weighting

```typescript
function optimizePromptWeights(prompt: PromptBuilder, context: PromptContext) {
  // Weight characters by importance in scene
  context.characters.forEach(sc => {
    const weight = getImportanceWeight(sc.importance)
    prompt.setCharacterWeight(sc.character.name, weight)
  })
  
  // Weight locations by prominence
  context.locations.forEach(sl => {
    const weight = getProminenceWeight(sl.prominence)
    prompt.setLocationWeight(sl.location.name, weight)
  })
  
  // Emphasize emotional tone if strong
  if (context.scene.emotional_tone && 
      ['tense', 'romantic', 'action'].includes(context.scene.emotional_tone)) {
    prompt.emphasizeElement(context.scene.emotional_tone, 1.2)
  }
}

function getImportanceWeight(importance: ImportanceLevel): number {
  switch (importance) {
    case 'main': return 1.3
    case 'secondary': return 1.0
    case 'background': return 0.7
    default: return 1.0
  }
}
```

### Negative Prompt Intelligence

```typescript
function buildIntelligentNegativePrompt(
  context: PromptContext,
  baseNegatives: string[]
): string[] {
  const negatives = [...baseNegatives]
  
  // Exclude conflicting style elements
  if (context.storyStyle.preset === 'fantasy') {
    negatives.push('modern technology', 'contemporary clothing', 'cars', 'phones')
  } else if (context.storyStyle.preset === 'historical') {
    negatives.push('modern elements', 'anachronistic items', 'digital displays')
  }
  
  // Exclude wrong character count
  const characterCount = context.characters.length
  if (characterCount === 1) {
    negatives.push('multiple people', 'crowd', 'group shot')
  } else if (characterCount > 3) {
    negatives.push('empty scene', 'single person', 'isolated character')
  }
  
  // Location-specific exclusions
  context.locations.forEach(sl => {
    if (sl.location.type === 'indoor') {
      negatives.push('outdoor background', 'sky', 'landscape')
    } else if (sl.location.type === 'outdoor') {
      negatives.push('indoor setting', 'ceiling', 'indoor furniture')
    }
  })
  
  return negatives
}
```

## Error Handling and Fallbacks

### Graceful Degradation

```typescript
async function constructPromptWithFallbacks(
  sceneId: UUID,
  options: PromptOptions = {}
): Promise<ConstructedPrompt> {
  
  try {
    // Attempt full context construction
    const context = await gatherPromptContext(sceneId)
    return assemblePrompt(context)
    
  } catch (error) {
    console.warn('Full context construction failed, attempting fallback', error)
    
    try {
      // Fallback 1: Minimal context with just scene description
      const scene = await getSceneById(sceneId)
      const story = await getStoryBySceneId(sceneId)
      
      return constructMinimalPrompt(scene, story.style_preset)
      
    } catch (fallbackError) {
      console.error('Fallback prompt construction failed', fallbackError)
      
      // Fallback 2: Generic prompt based on style preset only
      const story = await getStoryBySceneId(sceneId)
      return constructGenericPrompt(story.style_preset)
    }
  }
}

function constructMinimalPrompt(scene: Scene, stylePreset: StylePreset): ConstructedPrompt {
  const template = STYLE_TEMPLATES[stylePreset]
  
  return {
    main_prompt: `${scene.description}. ${template.art_direction}, ${template.base_modifiers.join(', ')}, highly detailed`,
    negative_prompt: 'low quality, blurry, bad anatomy',
    style_modifiers: template.base_modifiers,
    technical_parameters: DEFAULT_TECHNICAL_PARAMS,
    character_ip_adapter_images: [],
    metadata: {
      character_references: [],
      location_references: [],
      construction_notes: ['Minimal prompt construction used due to context error']
    }
  }
}
```

## Performance Optimization

### Caching Strategy

```typescript
// Cache frequently accessed data
const promptCache = new Map<string, ConstructedPrompt>()
const stateCache = new Map<string, CharacterState | LocationState>()

function getCachedCharacterState(characterId: UUID, chapter: number): CharacterState | null {
  const key = `${characterId}-${chapter}`
  return stateCache.get(key) || null
}

function cachePrompt(sceneId: UUID, prompt: ConstructedPrompt, ttl = 3600) {
  promptCache.set(sceneId, prompt)
  setTimeout(() => promptCache.delete(sceneId), ttl * 1000)
}
```

### Batch Operations

```typescript
async function constructPromptsForChapter(chapterId: UUID): Promise<ConstructedPrompt[]> {
  // Get all scenes for chapter
  const scenes = await getScenesForChapter(chapterId)
  
  // Batch load all required data
  const [
    allCharacters,
    allLocations,
    allCharacterStates,
    allLocationStates,
    storyStyle
  ] = await Promise.all([
    getCharactersForChapter(chapterId),
    getLocationsForChapter(chapterId),
    getCharacterStatesForChapter(chapterId),
    getLocationStatesForChapter(chapterId),
    getStoryStyleForChapter(chapterId)
  ])
  
  // Construct prompts in parallel
  return Promise.all(scenes.map(scene => 
    constructPromptWithPreloadedData(scene, {
      characters: allCharacters,
      locations: allLocations,
      characterStates: allCharacterStates,
      locationStates: allLocationStates,
      storyStyle
    })
  ))
}
```

This algorithm ensures that generated images maintain visual consistency while accurately reflecting the evolving narrative context throughout the story.