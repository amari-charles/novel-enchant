# Enhancement API Contract

**Service**: AI Enhancement Pipeline for Author Platform
**Version**: 1.0.0
**Base URL**: `/api/my-works/enhancement`

## Enhancement Generation

### POST /api/my-works/enhancement/auto-enhance
**Purpose**: Automatically generate enhancements for chapter content

**Request**:
```http
POST /api/my-works/enhancement/auto-enhance
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "chapter_id": "uuid",
  "content": "Full chapter text content...",
  "target_scenes": 4,
  "character_context": [
    {
      "name": "Aria",
      "description": "Auburn-haired sorceress with green eyes"
    }
  ]
}
```

**Validation**:
- `chapter_id`: Required UUID of existing chapter
- `content`: Required text content (min 100 characters)
- `target_scenes`: Optional integer 1-10 (default: 4)
- `character_context`: Optional array of character references

**Response 202**: Generation started
```json
{
  "job_id": "uuid",
  "status": "queued",
  "estimated_completion": "2025-09-26T16:05:00Z",
  "anchor_positions": [
    {
      "id": "anchor_1",
      "position": 1250,
      "prompt_preview": "Dark forest scene with mysterious fog..."
    }
  ]
}
```

**Response 400**: Invalid content or parameters
**Response 401**: Unauthorized
**Response 403**: Not author's chapter
**Response 429**: Rate limit exceeded (max 10 per hour)

### POST /api/my-works/enhancement/manual-insert
**Purpose**: Create enhancement at specific position with custom prompt

**Request**:
```http
POST /api/my-works/enhancement/manual-insert
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "chapter_id": "uuid",
  "position": 1250,
  "prompt": "A magnificent dragon soaring over ancient ruins",
  "context_before": "The ground shook as...",
  "context_after": "...wings disappeared into the clouds",
  "linked_characters": ["uuid1", "uuid2"]
}
```

**Validation**:
- `chapter_id`: Required UUID
- `position`: Required text position (0-based index)
- `prompt`: Required text prompt (10-1000 characters)
- `context_before/after`: Optional context text (max 500 chars each)
- `linked_characters`: Optional array of character UUIDs

**Response 202**: Generation started
```json
{
  "enhancement_id": "uuid",
  "anchor_id": "anchor_manual_1",
  "status": "queued",
  "estimated_completion": "2025-09-26T16:05:00Z"
}
```

### POST /api/my-works/enhancement/highlight-insert
**Purpose**: Create enhancement from highlighted text as prompt

**Request**:
```http
POST /api/my-works/enhancement/highlight-insert
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "chapter_id": "uuid",
  "position_start": 1200,
  "position_end": 1350,
  "highlighted_text": "the ancient dragon with scales like emeralds",
  "enhance_prompt": true,
  "additional_context": "fantasy medieval setting",
  "linked_characters": ["uuid1"]
}
```

**Validation**:
- `position_start/end`: Required valid text range
- `highlighted_text`: Must match text at specified positions
- `enhance_prompt`: Optional boolean to enhance the prompt text
- `additional_context`: Optional context to add to prompt

**Response 202**: Generation started
```json
{
  "enhancement_id": "uuid",
  "anchor_id": "anchor_highlight_1",
  "final_prompt": "A magnificent ancient dragon with scales like emeralds in a fantasy medieval setting",
  "status": "queued"
}
```

## Enhancement Management

### GET /api/my-works/enhancement/status/{job_id}
**Purpose**: Check status of auto-enhancement job

**Request**:
```http
GET /api/my-works/enhancement/status/{job_id}
Authorization: Bearer {jwt_token}
```

**Response 200**:
```json
{
  "job_id": "uuid",
  "status": "completed",
  "progress": 100,
  "completed_at": "2025-09-26T16:04:30Z",
  "enhancements": [
    {
      "enhancement_id": "uuid",
      "anchor_id": "anchor_1",
      "status": "completed",
      "image_url": "https://...",
      "thumbnail_url": "https://..."
    }
  ],
  "failed_enhancements": [],
  "total_generated": 4
}
```

**Status Values**:
- `queued`: Waiting for processing
- `processing`: Currently generating images
- `completed`: All images generated successfully
- `partial`: Some images failed, some succeeded
- `failed`: All image generation failed

### GET /api/my-works/enhancement/{enhancement_id}
**Purpose**: Get full enhancement details with version history

**Request**:
```http
GET /api/my-works/enhancement/{enhancement_id}
Authorization: Bearer {jwt_token}
```

**Response 200**:
```json
{
  "id": "uuid",
  "chapter_id": "uuid",
  "anchor_id": "anchor_1",
  "position_start": 1200,
  "position_end": 1350,
  "prompt_text": "A magnificent dragon soaring over ancient ruins",
  "prompt_type": "auto",
  "generation_status": "completed",
  "created_at": "2025-09-26T16:00:00Z",
  "active_version": {
    "id": "uuid",
    "version_number": 2,
    "image_url": "https://...",
    "thumbnail_url": "https://...",
    "generation_params": {
      "model": "sdxl-1.0",
      "steps": 30,
      "guidance": 7.5
    },
    "quality_score": 0.85,
    "created_at": "2025-09-26T16:03:00Z"
  },
  "versions": [
    {
      "id": "uuid",
      "version_number": 1,
      "image_url": "https://...",
      "is_active": false,
      "quality_score": 0.72
    },
    {
      "id": "uuid",
      "version_number": 2,
      "image_url": "https://...",
      "is_active": true,
      "quality_score": 0.85
    }
  ],
  "linked_characters": [
    {
      "id": "uuid",
      "name": "Aria",
      "description": "Auburn-haired sorceress"
    }
  ]
}
```

### POST /api/my-works/enhancement/{enhancement_id}/retry
**Purpose**: Generate new version of enhancement image

**Request**:
```http
POST /api/my-works/enhancement/{enhancement_id}/retry
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "modify_prompt": false,
  "new_prompt": "Alternative prompt text...",
  "generation_params": {
    "style": "photorealistic",
    "aspect_ratio": "16:9"
  }
}
```

**Validation**:
- `modify_prompt`: Optional boolean to change prompt
- `new_prompt`: Required if modify_prompt is true
- `generation_params`: Optional generation settings

**Response 202**: Retry generation started
```json
{
  "version_id": "uuid",
  "version_number": 3,
  "status": "queued",
  "estimated_completion": "2025-09-26T16:05:00Z"
}
```

**Response 429**: Rate limit exceeded (max 5 retries per hour per enhancement)

### PUT /api/my-works/enhancement/{enhancement_id}/active-version
**Purpose**: Set which image version is active for display

**Request**:
```http
PUT /api/my-works/enhancement/{enhancement_id}/active-version
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "version_id": "uuid"
}
```

**Response 200**:
```json
{
  "enhancement_id": "uuid",
  "active_version_id": "uuid",
  "version_number": 2,
  "updated_at": "2025-09-26T16:05:00Z"
}
```

### DELETE /api/my-works/enhancement/{enhancement_id}
**Purpose**: Delete enhancement and all its versions

**Request**:
```http
DELETE /api/my-works/enhancement/{enhancement_id}
Authorization: Bearer {jwt_token}
```

**Response 204**: No content (success)
**Response 401**: Unauthorized
**Response 403**: Not author's enhancement
**Response 404**: Enhancement not found

## Character Linking

### PUT /api/my-works/enhancement/{enhancement_id}/characters
**Purpose**: Link or unlink characters from enhancement

**Request**:
```http
PUT /api/my-works/enhancement/{enhancement_id}/characters
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "character_ids": ["uuid1", "uuid2"],
  "operation": "set"
}
```

**Operations**:
- `set`: Replace all character links with provided list
- `add`: Add characters to existing links
- `remove`: Remove characters from existing links

**Response 200**:
```json
{
  "enhancement_id": "uuid",
  "linked_characters": [
    {
      "id": "uuid1",
      "name": "Aria",
      "description": "Auburn-haired sorceress"
    }
  ],
  "updated_at": "2025-09-26T16:05:00Z"
}
```

## Batch Operations

### POST /api/my-works/enhancement/batch-retry
**Purpose**: Retry multiple enhancements at once

**Request**:
```http
POST /api/my-works/enhancement/batch-retry
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "enhancement_ids": ["uuid1", "uuid2", "uuid3"],
  "generation_params": {
    "style": "artistic",
    "quality": "high"
  }
}
```

**Response 202**: Batch retry started
```json
{
  "batch_id": "uuid",
  "total_enhancements": 3,
  "queued_enhancements": 3,
  "failed_enhancements": 0,
  "estimated_completion": "2025-09-26T16:10:00Z"
}
```

**Response 429**: Rate limit exceeded

### GET /api/my-works/enhancement/batch-status/{batch_id}
**Purpose**: Check status of batch operation

**Request**:
```http
GET /api/my-works/enhancement/batch-status/{batch_id}
Authorization: Bearer {jwt_token}
```

**Response 200**:
```json
{
  "batch_id": "uuid",
  "status": "processing",
  "progress": 66,
  "completed_count": 2,
  "failed_count": 0,
  "total_count": 3,
  "enhancements": [
    {
      "enhancement_id": "uuid1",
      "status": "completed",
      "version_number": 3
    },
    {
      "enhancement_id": "uuid2",
      "status": "completed",
      "version_number": 2
    },
    {
      "enhancement_id": "uuid3",
      "status": "processing"
    }
  ]
}
```

## Error Responses

### 400 Bad Request - Content Too Short
```json
{
  "error": "content_too_short",
  "message": "Content must be at least 100 characters for enhancement",
  "details": {
    "current_length": 85,
    "minimum_length": 100
  }
}
```

### 400 Bad Request - Invalid Position
```json
{
  "error": "invalid_position",
  "message": "Position is outside chapter content range",
  "details": {
    "position": 5000,
    "content_length": 4500
  }
}
```

### 429 Rate Limit Exceeded - Enhancement Generation
```json
{
  "error": "enhancement_rate_limit",
  "message": "Enhancement generation rate limit exceeded",
  "details": {
    "limit": 10,
    "window": "1 hour",
    "reset_at": "2025-09-26T17:00:00Z"
  }
}
```

### 503 Service Unavailable - AI Service Down
```json
{
  "error": "ai_service_unavailable",
  "message": "Image generation service temporarily unavailable",
  "details": {
    "retry_after": 300,
    "estimated_restore": "2025-09-26T16:30:00Z"
  }
}
```

## Rate Limits

- **Auto-Enhancement**: 10 jobs per hour per user
- **Manual Enhancement**: 20 enhancements per hour per user
- **Retry Generation**: 5 retries per hour per enhancement
- **Batch Operations**: 3 batch jobs per hour per user
- **API Requests**: 500 requests per hour per user

## Quality & Performance

### Image Generation Parameters
- **Default Model**: SDXL 1.0
- **Generation Time**: 30-60 seconds typical
- **Image Resolution**: 1024x1024 default, 1024x768 landscape
- **Format**: JPEG (display), WebP (thumbnails)
- **Quality Score**: AI-generated based on prompt adherence

### Content Filtering
- **Prompt Analysis**: NSFW and harmful content detection
- **Character Limits**: 10-1000 characters for prompts
- **Context Limits**: 500 characters for before/after context
- **Blocked Terms**: Comprehensive filter list applied

### Monitoring
- **Generation Success Rate**: Target >95%
- **Average Generation Time**: Target <45 seconds
- **Error Recovery**: Automatic retry with exponential backoff
- **Quality Scoring**: Automated assessment of generated images