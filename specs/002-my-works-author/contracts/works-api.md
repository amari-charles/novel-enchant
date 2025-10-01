# Works API Contract

**Service**: My Works Author Platform
**Version**: 1.0.0
**Base URL**: `/api/my-works`

## Work Management

### GET /api/my-works/works
**Purpose**: Retrieve author's works list with summary statistics

**Request**:
```http
GET /api/my-works/works
Authorization: Bearer {jwt_token}
```

**Query Parameters**:
- `status` (optional): Filter by work status (`draft`, `published`, `archived`)
- `limit` (optional): Number of works to return (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `sort` (optional): Sort order (`created_desc`, `updated_desc`, `title_asc`)

**Response 200**:
```json
{
  "works": [
    {
      "id": "uuid",
      "title": "Dragon's Quest",
      "description": "Epic fantasy adventure...",
      "status": "draft",
      "created_at": "2025-09-26T10:00:00Z",
      "updated_at": "2025-09-26T15:30:00Z",
      "last_edited_at": "2025-09-26T15:30:00Z",
      "chapter_count": 5,
      "word_count": 25000,
      "enhancement_count": 12,
      "character_count": 3,
      "cover_image_url": "https://...",
      "publication_status": "draft",
      "read_count": 0
    }
  ],
  "total": 1,
  "has_more": false
}
```

**Response 401**: Unauthorized
**Response 429**: Rate limit exceeded

### POST /api/my-works/works
**Purpose**: Create new work

**Request**:
```http
POST /api/my-works/works
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "title": "Dragon's Quest",
  "description": "Epic fantasy adventure about...",
  "auto_enhance_enabled": true,
  "target_scenes_per_chapter": 4
}
```

**Validation**:
- `title`: Required, 1-255 characters
- `description`: Optional, max 2000 characters
- `auto_enhance_enabled`: Optional boolean (default: true)
- `target_scenes_per_chapter`: Optional integer 1-10 (default: 4)

**Response 201**:
```json
{
  "id": "uuid",
  "title": "Dragon's Quest",
  "description": "Epic fantasy adventure about...",
  "status": "draft",
  "created_at": "2025-09-26T16:00:00Z",
  "updated_at": "2025-09-26T16:00:00Z",
  "auto_enhance_enabled": true,
  "target_scenes_per_chapter": 4
}
```

**Response 400**: Validation error
**Response 401**: Unauthorized
**Response 429**: Rate limit exceeded

### GET /api/my-works/works/{work_id}
**Purpose**: Retrieve single work with full details

**Request**:
```http
GET /api/my-works/works/{work_id}
Authorization: Bearer {jwt_token}
```

**Response 200**:
```json
{
  "id": "uuid",
  "title": "Dragon's Quest",
  "description": "Epic fantasy adventure...",
  "status": "draft",
  "created_at": "2025-09-26T10:00:00Z",
  "updated_at": "2025-09-26T15:30:00Z",
  "last_edited_at": "2025-09-26T15:30:00Z",
  "auto_enhance_enabled": true,
  "target_scenes_per_chapter": 4,
  "chapters": [
    {
      "id": "uuid",
      "title": "The Beginning",
      "order_index": 0,
      "word_count": 5000,
      "enhancement_count": 2,
      "updated_at": "2025-09-26T15:30:00Z"
    }
  ],
  "characters": [
    {
      "id": "uuid",
      "name": "Aria",
      "description": "Brave sorceress",
      "appearance_count": 3,
      "linked_images_count": 2
    }
  ]
}
```

**Response 401**: Unauthorized
**Response 403**: Not author's work
**Response 404**: Work not found

### PUT /api/my-works/works/{work_id}
**Purpose**: Update work metadata

**Request**:
```http
PUT /api/my-works/works/{work_id}
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "title": "Dragon's Quest: Updated",
  "description": "Epic fantasy adventure with new plot...",
  "auto_enhance_enabled": false
}
```

**Response 200**: Updated work object
**Response 400**: Validation error
**Response 401**: Unauthorized
**Response 403**: Not author's work
**Response 404**: Work not found

### DELETE /api/my-works/works/{work_id}
**Purpose**: Delete work and all associated data

**Request**:
```http
DELETE /api/my-works/works/{work_id}
Authorization: Bearer {jwt_token}
```

**Response 204**: No content (success)
**Response 401**: Unauthorized
**Response 403**: Not author's work
**Response 404**: Work not found

## Chapter Management

### GET /api/my-works/works/{work_id}/chapters
**Purpose**: Retrieve all chapters for a work

**Request**:
```http
GET /api/my-works/works/{work_id}/chapters
Authorization: Bearer {jwt_token}
```

**Response 200**:
```json
{
  "chapters": [
    {
      "id": "uuid",
      "title": "The Beginning",
      "order_index": 0,
      "word_count": 5000,
      "enhancement_count": 2,
      "created_at": "2025-09-26T10:00:00Z",
      "updated_at": "2025-09-26T15:30:00Z"
    }
  ]
}
```

### GET /api/my-works/chapters/{chapter_id}
**Purpose**: Retrieve single chapter with full content

**Request**:
```http
GET /api/my-works/chapters/{chapter_id}
Authorization: Bearer {jwt_token}
```

**Response 200**:
```json
{
  "id": "uuid",
  "work_id": "uuid",
  "title": "The Beginning",
  "content": "It was a dark and stormy night...",
  "order_index": 0,
  "word_count": 5000,
  "enhancement_count": 2,
  "enhancement_anchors": [
    {
      "id": "anchor_1",
      "position": 1250,
      "type": "auto",
      "enhancement_id": "uuid"
    }
  ],
  "created_at": "2025-09-26T10:00:00Z",
  "updated_at": "2025-09-26T15:30:00Z"
}
```

### POST /api/my-works/works/{work_id}/chapters
**Purpose**: Create new chapter

**Request**:
```http
POST /api/my-works/works/{work_id}/chapters
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "title": "The Beginning",
  "content": "It was a dark and stormy night...",
  "order_index": 0
}
```

**Validation**:
- `content`: Required text content
- `title`: Optional, max 255 characters
- `order_index`: Required, must maintain sequence

**Response 201**: Created chapter object
**Response 400**: Validation error
**Response 401**: Unauthorized
**Response 403**: Not author's work

### PUT /api/my-works/chapters/{chapter_id}
**Purpose**: Update chapter content and metadata

**Request**:
```http
PUT /api/my-works/chapters/{chapter_id}
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "title": "The Beginning - Revised",
  "content": "It was a dark and stormy night...",
  "enhancement_anchors": [...]
}
```

**Response 200**: Updated chapter object
**Response 400**: Validation error
**Response 401**: Unauthorized
**Response 403**: Not author's chapter

### DELETE /api/my-works/chapters/{chapter_id}
**Purpose**: Delete chapter and reorder remaining chapters

**Request**:
```http
DELETE /api/my-works/chapters/{chapter_id}
Authorization: Bearer {jwt_token}
```

**Response 204**: No content (success)
**Response 401**: Unauthorized
**Response 403**: Not author's chapter
**Response 404**: Chapter not found

### POST /api/my-works/chapters/reorder
**Purpose**: Reorder chapters within a work

**Request**:
```http
POST /api/my-works/chapters/reorder
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "work_id": "uuid",
  "chapter_orders": [
    {"chapter_id": "uuid1", "order_index": 0},
    {"chapter_id": "uuid2", "order_index": 1}
  ]
}
```

**Response 200**: Updated chapters array
**Response 400**: Invalid order sequence
**Response 401**: Unauthorized
**Response 403**: Not author's work

## Auto-Save

### PUT /api/my-works/chapters/{chapter_id}/autosave
**Purpose**: Periodic auto-save of chapter content

**Request**:
```http
PUT /api/my-works/chapters/{chapter_id}/autosave
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "content": "Current chapter text...",
  "cursor_position": 1250,
  "last_save_time": "2025-09-26T15:29:00Z"
}
```

**Response 200**:
```json
{
  "saved_at": "2025-09-26T15:30:00Z",
  "word_count": 5001,
  "conflict": false
}
```

**Response 409**: Conflict detected (newer version exists)
```json
{
  "saved_at": "2025-09-26T15:30:00Z",
  "conflict": true,
  "server_version": {
    "content": "Server version of content...",
    "updated_at": "2025-09-26T15:29:30Z"
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "validation_error",
  "message": "Invalid input data",
  "details": {
    "title": "Title must be between 1 and 255 characters",
    "content": "Content cannot be empty"
  }
}
```

### 401 Unauthorized
```json
{
  "error": "unauthorized",
  "message": "Valid authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "forbidden",
  "message": "Access denied to this resource"
}
```

### 404 Not Found
```json
{
  "error": "not_found",
  "message": "Resource not found"
}
```

### 429 Rate Limit Exceeded
```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests",
  "retry_after": 60
}
```

### 500 Internal Server Error
```json
{
  "error": "internal_error",
  "message": "An unexpected error occurred",
  "request_id": "uuid"
}
```

## Rate Limits

- **Work Creation**: 10 works per hour per user
- **Chapter Updates**: 100 updates per hour per user
- **Auto-Save**: 1 request per 30 seconds per chapter
- **API Requests**: 1000 requests per hour per user

## Authentication

All endpoints require JWT authentication via Supabase Auth. Token must be included in Authorization header as `Bearer {token}`.

## Caching

- Work listings: Cache for 5 minutes
- Chapter content: No caching (real-time editing)
- Work metadata: Cache for 1 minute
- Auto-save: No caching