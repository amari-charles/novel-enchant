# Data Model: AI-Powered Story Illustration System

**Date**: 2025-09-27
**Feature**: Enhancement entities and relationships

## Core Entities

### Work
Represents an author's complete story/novel.

```typescript
interface Work {
  id: string
  userId: string
  title: string
  styleLock?: StylePreferences
  createdAt: string
  updatedAt: string
}

interface StylePreferences {
  artStyle?: 'realistic' | 'anime' | 'watercolor' | 'sketch'
  colorPalette?: 'warm' | 'cool' | 'monochrome' | 'vibrant'
  mood?: 'dramatic' | 'peaceful' | 'mysterious' | 'cheerful'
}
```

**Validation Rules**:
- title: required, 1-200 characters
- userId: required, must reference existing user
- styleLock: optional, used for consistent image generation

### Chapter
Individual chapter within a work containing text content.

```typescript
interface Chapter {
  id: string
  workId: string
  text: string
  title?: string
  orderIndex: number
  createdAt: string
  updatedAt: string
}
```

**Validation Rules**:
- text: required, minimum 100 characters for auto-enhancement
- workId: required, must reference existing work
- orderIndex: required, unique within work
- title: optional, 1-100 characters

### Character
Named entity in the story with description and consistency tracking.

```typescript
interface Character {
  id: string
  workId: string
  name?: string
  shortDesc?: string
  status: CharacterStatus
  aliases: string[]
  confidence: number
  createdAt: string
  updatedAt: string
}

type CharacterStatus = 'candidate' | 'confirmed' | 'ignored' | 'merged'
```

**Validation Rules**:
- workId: required, must reference existing work
- name: optional for candidates, required for confirmed
- status: required, defaults to 'candidate'
- aliases: array of alternative names/references
- confidence: 0-1, AI confidence in character detection

**State Transitions**:
- candidate → confirmed (author approval)
- candidate → ignored (author rejection)
- candidate → merged (combined with existing character)
- confirmed → merged (author consolidation)

### Anchor
Stable position marker in chapter text where images can be attached.

```typescript
interface Anchor {
  id: string
  chapterId: string
  position: number
  activeImageId?: string
  createdAt: string
  updatedAt: string
}
```

**Validation Rules**:
- chapterId: required, must reference existing chapter
- position: required, must be valid character index in chapter text
- activeImageId: optional, references current image

**Uniqueness Constraint**: (chapterId, position) must be unique

### Image
Generated illustration linked to an anchor with metadata.

```typescript
interface Image {
  id: string
  promptId: string
  url: string
  thumbnailUrl?: string
  scores: QualityScores
  metadata: ImageMetadata
  createdAt: string
}

interface QualityScores {
  textAlign: number     // 0-1, how well image matches text
  refSim: number        // 0-1, character consistency score
  overall: number       // 0-1, combined quality
  verdict: 'ok' | 'retry' | 'manual_review'
}

interface ImageMetadata {
  width: number
  height: number
  format: 'jpg' | 'png' | 'webp'
  generationTime: number
  seed?: string
}
```

**Validation Rules**:
- url: required, valid URL format
- scores: all values 0-1
- metadata: width/height positive integers

### Prompt
Text description used to generate an image with character references.

```typescript
interface Prompt {
  id: string
  body: string
  refIds: string[]      // Referenced character IDs
  seed?: string
  meta: PromptMetadata
  createdAt: string
}

interface PromptMetadata {
  type: 'auto' | 'manual' | 'highlight'
  sourceText?: string   // Original text for highlight prompts
  characterNames: string[]
  artStyle?: string
  mood?: string
}
```

**Validation Rules**:
- body: required, 10-500 characters
- refIds: array of valid character IDs
- type: required, determines generation context

## Entity Relationships

```
Work (1) ←→ (many) Chapter
Work (1) ←→ (many) Character
Chapter (1) ←→ (many) Anchor
Anchor (1) ←→ (0..1) Image (activeImageId)
Image (1) ←→ (1) Prompt
Prompt (many) ←→ (many) Character (refIds)
```

## Mock Data Patterns (v1)

### Character Names
- Default pattern: "Character A", "Character B", "Character C"
- Generated deterministically from text position
- No real entity recognition in v1

### Image URLs
- Format: `https://picsum.photos/seed/{seedValue}/1024/768`
- Seed derived from prompt content for consistency
- Thumbnail: same URL with smaller dimensions

### Quality Scores
- textAlign: always 0.8
- refSim: always 0.7
- overall: always 0.75
- verdict: always 'ok'

### Prompts
- Format: "mock prompt: {brief excerpt}"
- No real AI prompt engineering in v1
- Static templates based on enhancement type

## Persistence Strategy

### Frontend State (v1)
- All entities stored in React state/context
- No backend persistence required for mock
- State resets on page refresh

### Future Backend Integration
- Entities map directly to database tables
- Relationships enforced via foreign keys
- Audit fields (createdAt, updatedAt) for tracking

## Validation Summary

### Business Rules
- Works must have at least one chapter for enhancement
- Chapters must have minimum text length for auto-enhancement
- Anchors must reference valid text positions
- Characters can only be merged within same work
- Images must have associated prompts

### Data Integrity
- All IDs are UUIDs for uniqueness
- Timestamps in ISO 8601 format
- URLs validated for proper format
- Numeric scores within 0-1 range
- Text fields have appropriate length limits