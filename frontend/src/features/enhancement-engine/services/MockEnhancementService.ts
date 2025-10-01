/**
 * Mock Enhancement Service
 * Provides deterministic responses for UX validation before real AI integration
 */

import type {
  EnhancementService,
  AutoEnhanceRequest,
  AutoEnhanceResponse,
  ManualInsertRequest,
  ManualInsertResponse,
  RetryEnhancementRequest,
  RetryEnhancementResponse,
  Character,
  Anchor,
  Image,
  Prompt
} from '../types'
import { EnhancementError } from '../types'

// Deterministic seed-based random number generator
class SeededRandom {
  private seed: number

  constructor(seed: string) {
    this.seed = this.hashString(seed)
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }

  integer(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  choice<T>(array: T[]): T {
    return array[this.integer(0, array.length - 1)]
  }
}

export class MockEnhancementService implements EnhancementService {
  private anchors: Map<string, Anchor> = new Map()
  private images: Map<string, Image> = new Map()
  private prompts: Map<string, Prompt> = new Map()
  private nextId = 1
  private readonly storageKey = 'novel-enchant-test-account-data'

  constructor() {
    this.loadFromStorage()
    console.log('MockEnhancementService initialized for test account with persistent data')
  }

  private generateId(prefix: string): string {
    return `${prefix}-${this.nextId++}`
  }

  private saveToStorage(): void {
    try {
      const data = {
        anchors: Array.from(this.anchors.entries()),
        images: Array.from(this.images.entries()),
        prompts: Array.from(this.prompts.entries()),
        nextId: this.nextId
      }
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save mock data to localStorage:', error)
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        this.anchors = new Map(data.anchors || [])
        this.images = new Map(data.images || [])
        this.prompts = new Map(data.prompts || [])
        this.nextId = data.nextId || 1
        console.log('Loaded mock data from localStorage')
      }
    } catch (error) {
      console.warn('Failed to load mock data from localStorage:', error)
    }
  }

  clearStorage(): void {
    localStorage.removeItem(this.storageKey)
    this.anchors.clear()
    this.images.clear()
    this.prompts.clear()
    this.nextId = 1
    console.log('Cleared mock data storage')
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private generateImageUrl(seed: string, width = 1024, height = 768): string {
    return `https://picsum.photos/seed/${seed}/${width}/${height}`
  }


  private detectCharactersFromText(text: string, existingCharacters: Character[]): Character[] {
    const rng = new SeededRandom(text)
    const candidates: Character[] = []

    // Common character name patterns for detection
    const namePatterns = [
      /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g, // First Last
      /\b(Sir [A-Z][a-z]+)\b/g,         // Sir Name
      /\b(Princess [A-Z][a-z]+)\b/g,    // Princess Name
      /\b(Lord [A-Z][a-z]+)\b/g,        // Lord Name
      /\b([A-Z][a-z]+)\b/g              // Single names
    ]

    const foundNames = new Set<string>()
    namePatterns.forEach(pattern => {
      const matches = text.matchAll(pattern)
      for (const match of matches) {
        foundNames.add(match[1])
      }
    })

    // Filter out existing character names
    const existingNames = new Set(
      existingCharacters.flatMap(char => [char.name, ...char.aliases])
    )

    const uniqueNames = Array.from(foundNames).filter(name =>
      !existingNames.has(name) && name.length > 2
    )

    // Generate candidates for detected names
    uniqueNames.slice(0, 3).forEach((name, index) => {
      const confidence = 0.7 + rng.next() * 0.25 // 0.7-0.95
      const characterId = this.generateId('candidate')

      candidates.push({
        id: characterId,
        workId: 'work-mock', // Will be overridden by actual workId
        name: `Character ${String.fromCharCode(65 + index)}`, // A, B, C
        status: 'candidate',
        aliases: [name],
        confidence: Math.round(confidence * 100) / 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    })

    return candidates
  }

  private suggestAnchorPositions(text: string, targetCount: number): number[] {
    const rng = new SeededRandom(text)
    const textLength = text.length

    // Look for natural break points
    const sentences = text.split(/[.!?]+/)
    let currentPos = 0
    const sentenceEnds: number[] = []

    sentences.forEach(sentence => {
      currentPos += sentence.length + 1
      if (currentPos < textLength) {
        sentenceEnds.push(currentPos)
      }
    })

    // Select positions with some randomness but prefer sentence boundaries
    const candidatePositions = sentenceEnds.length > 0 ? sentenceEnds : [
      Math.floor(textLength * 0.25),
      Math.floor(textLength * 0.5),
      Math.floor(textLength * 0.75)
    ]

    // Shuffle and take requested count
    for (let i = candidatePositions.length - 1; i > 0; i--) {
      const j = rng.integer(0, i)
      ;[candidatePositions[i], candidatePositions[j]] = [candidatePositions[j], candidatePositions[i]]
    }

    return candidatePositions.slice(0, Math.min(targetCount, candidatePositions.length))
  }

  async autoEnhance(request: AutoEnhanceRequest): Promise<AutoEnhanceResponse> {
    // Validate input
    if (!request.chapterId || request.text.length < 50) {
      throw new EnhancementError(
        'INVALID_INPUT',
        'Chapter text is too short for auto-enhancement'
      )
    }

    // Simulate processing time
    await this.delay(2000 + Math.random() * 1000)

    const rng = new SeededRandom(request.chapterId + request.text)
    const workId = request.chapterId.split('-')[0] || 'work-456'

    // Generate 2-3 anchor positions
    const targetAnchors = rng.integer(2, 3)
    const positions = this.suggestAnchorPositions(request.text, targetAnchors)

    const anchors: Anchor[] = []
    const candidateCharacters = this.detectCharactersFromText(request.text, request.existingCharacters)

    // Update candidates with correct workId
    candidateCharacters.forEach(char => {
      char.workId = workId
    })

    // Create anchors with images
    for (const position of positions) {
      const anchorId = this.generateId('anchor')
      const imageId = this.generateId('image')
      const promptId = this.generateId('prompt')

      const seed = `auto-${anchorId}-${Date.now()}`

      const image: Image = {
        id: imageId,
        anchorId,
        promptId,
        url: this.generateImageUrl(seed),
        status: 'completed',
        metadata: {
          width: 1024,
          height: 768,
          format: 'jpg',
          generationTime: rng.integer(2000, 4000)
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const prompt: Prompt = {
        id: promptId,
        anchorId,
        version: 1,
        body: this.generatePromptForPosition(request.text, position, request.existingCharacters),
        refIds: request.existingCharacters.slice(0, rng.integer(0, 2)).map(char => char.id).filter(Boolean),
        meta: {
          type: 'auto',
          characterNames: request.existingCharacters.slice(0, rng.integer(0, 2)).map(char => char.name).filter((name): name is string => Boolean(name))
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const anchor: Anchor = {
        id: anchorId,
        chapterId: request.chapterId,
        position,
        activeImageId: imageId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      this.anchors.set(anchorId, anchor)
      this.images.set(imageId, image)
      this.prompts.set(promptId, prompt)

      anchors.push(anchor)
    }

    // Save to localStorage
    this.saveToStorage()

    return {
      anchors,
      candidateCharacters,
      jobId: this.generateId('job'),
      estimatedDuration: 3000
    }
  }

  async manualInsert(request: ManualInsertRequest): Promise<ManualInsertResponse> {
    // Validate position - typical chapter length is under 5000 characters
    if (request.position < 0 || request.position > 5000) {
      throw new EnhancementError(
        'OUT_OF_BOUNDS',
        'OUT_OF_BOUNDS: Position cannot be negative or beyond reasonable text length'
      )
    }

    // Simulate processing time
    await this.delay(1500 + Math.random() * 1000)

    const rng = new SeededRandom(`${request.chapterId}-${request.position}-${request.mode}`)
    const anchorId = this.generateId('anchor')
    const imageId = this.generateId('image')
    const promptId = this.generateId('prompt')

    const seed = `manual-${anchorId}-${Date.now()}`

    const image: Image = {
      id: imageId,
      anchorId,
      promptId,
      url: this.generateImageUrl(seed),
      status: 'completed',
      metadata: {
        width: 1024,
        height: 768,
        format: 'jpg',
        generationTime: rng.integer(1800, 3500)
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    let promptBody: string
    let refIds: string[] = []
    let characterNames: string[] = []

    switch (request.mode) {
      case 'existing':
        refIds = request.characterIds || []
        characterNames = refIds.map(id => `Character-${id}`)
        promptBody = `Characters ${characterNames.join(', ')} in an epic scene, detailed realistic style`
        break

      case 'auto':
        promptBody = `Scene from: ${request.contextText || 'epic fantasy moment'}, auto-detected characters, realistic style`
        break

      case 'new':
        promptBody = `${request.contextText || 'Epic fantasy scene'}, no specific characters, cinematic style`
        break

      default:
        promptBody = 'Epic fantasy scene, realistic style'
    }

    const prompt: Prompt = {
      id: promptId,
      anchorId,
      version: 1,
      body: promptBody,
      refIds,
      meta: {
        type: 'manual',
        sourceText: request.contextText,
        characterNames
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const anchor: Anchor = {
      id: anchorId,
      chapterId: request.chapterId,
      position: request.position,
      activeImageId: imageId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.anchors.set(anchorId, anchor)
    this.images.set(imageId, image)
    this.prompts.set(promptId, prompt)

    // Save to localStorage
    this.saveToStorage()

    const response: ManualInsertResponse = {
      anchor,
      image,
      prompt
    }

    // Add candidate characters for auto mode
    if (request.mode === 'auto' && request.contextText) {
      response.candidateCharacters = this.detectCharactersFromText(request.contextText, [])
    }

    return response
  }

  async retryEnhancement(request: RetryEnhancementRequest): Promise<RetryEnhancementResponse> {
    const anchor = this.anchors.get(request.anchorId)
    if (!anchor) {
      throw new EnhancementError(
        'ANCHOR_NOT_FOUND',
        `ANCHOR_NOT_FOUND: Anchor ${request.anchorId} not found`
      )
    }

    // Simulate retry processing time
    await this.delay(2000 + Math.random() * 1000)

    const rng = new SeededRandom(`${request.anchorId}-retry-${Date.now()}`)
    const newImageId = this.generateId('image')
    const newPromptId = this.generateId('prompt')

    const seed = `retry-${newImageId}-${Date.now()}`

    const newImage: Image = {
      id: newImageId,
      anchorId: request.anchorId,
      promptId: newPromptId,
      url: this.generateImageUrl(seed),
      status: 'completed',
      metadata: {
        width: 1024,
        height: 768,
        format: 'jpg',
        generationTime: rng.integer(2200, 3800)
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const promptBody = request.modifyPrompt && request.newPrompt
      ? request.newPrompt
      : 'Retry: Enhanced epic fantasy scene, improved composition'

    const newPrompt: Prompt = {
      id: newPromptId,
      anchorId: request.anchorId,
      version: 2,
      body: promptBody,
      refIds: [],
      meta: {
        type: 'retry',
        originalPromptId: anchor.activeImageId // Reference to original
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Update anchor with new image
    const updatedAnchor: Anchor = {
      ...anchor,
      activeImageId: newImageId,
      updatedAt: new Date().toISOString()
    }

    this.anchors.set(request.anchorId, updatedAnchor)
    this.images.set(newImageId, newImage)
    this.prompts.set(newPromptId, newPrompt)

    // Save to localStorage
    this.saveToStorage()

    return {
      anchor: updatedAnchor,
      image: newImage,
      prompt: newPrompt
    }
  }

  async acceptEnhancement(anchorId: string): Promise<Anchor> {
    const anchor = this.anchors.get(anchorId)
    if (!anchor) {
      throw new EnhancementError(
        'ANCHOR_NOT_FOUND',
        `ANCHOR_NOT_FOUND: Anchor ${anchorId} not found`
      )
    }

    // Simulate acceptance processing
    await this.delay(500)

    // Mark as accepted (in real implementation, this would update DB)
    const acceptedAnchor: Anchor = {
      ...anchor,
      updatedAt: new Date().toISOString()
    }

    this.anchors.set(anchorId, acceptedAnchor)

    // Save to localStorage
    this.saveToStorage()

    return acceptedAnchor
  }

  private generatePromptForPosition(text: string, position: number, existingCharacters: Character[]): string {
    const rng = new SeededRandom(`${text}-${position}`)

    // Extract context around position
    const contextStart = Math.max(0, position - 100)
    const contextEnd = Math.min(text.length, position + 100)
    // Extract context around position for prompt generation
    text.slice(contextStart, contextEnd)

    // Basic prompt templates
    const templates = [
      'Epic fantasy scene with detailed characters in dramatic lighting',
      'Cinematic fantasy moment with rich environmental details',
      'Dramatic character interaction in fantasy setting',
      'Action-packed fantasy scene with dynamic composition'
    ]

    const basePrompt = rng.choice(templates)

    // Add character references if available
    if (existingCharacters.length > 0) {
      const usedCharacters = existingCharacters.slice(0, rng.integer(1, 2))
      const characterNames = usedCharacters.map(char => char.name).join(' and ')
      return `${basePrompt} featuring ${characterNames}`
    }

    return basePrompt
  }
}