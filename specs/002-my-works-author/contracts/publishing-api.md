# Publishing API Contract

**Service**: Work Publishing and Analytics for Author Platform
**Version**: 1.0.0
**Base URL**: `/api/my-works/publishing`

## Publishing Management

### POST /api/my-works/publishing/publish
**Purpose**: Publish a work to make it publicly discoverable

**Request**:
```http
POST /api/my-works/publishing/publish
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "work_id": "uuid",
  "visibility": "public",
  "seo_title": "Dragon's Quest - Epic Fantasy Adventure",
  "seo_description": "Follow Aria's journey through magical realms in this epic fantasy novel with stunning AI-generated illustrations.",
  "custom_slug": "dragons-quest-aria-adventure"
}
```

**Validation**:
- `work_id`: Required UUID of existing work
- `visibility`: Required enum (`public`, `unlisted`)
- `seo_title`: Optional, max 60 characters (auto-generated if omitted)
- `seo_description`: Optional, max 160 characters (auto-generated if omitted)
- `custom_slug`: Optional, URL-safe string (auto-generated if omitted)

**Response 201**: Publication created
```json
{
  "publication_id": "uuid",
  "work_id": "uuid",
  "visibility": "public",
  "published_at": "2025-09-26T16:00:00Z",
  "slug": "dragons-quest-aria-adventure",
  "seo_title": "Dragon's Quest - Epic Fantasy Adventure",
  "seo_description": "Follow Aria's journey through magical realms...",
  "public_url": "https://novelenchant.com/read/dragons-quest-aria-adventure",
  "preview_url": "https://novelenchant.com/preview/dragons-quest-aria-adventure",
  "og_image_url": "https://...",
  "estimated_indexing": "2025-09-26T16:15:00Z"
}
```

**Response 400**: Validation error or work not ready for publishing
```json
{
  "error": "work_not_ready",
  "message": "Work must have at least one chapter to publish",
  "details": {
    "chapter_count": 0,
    "minimum_chapters": 1
  }
}
```

**Response 409**: Slug already exists
```json
{
  "error": "slug_exists",
  "message": "The requested slug is already in use",
  "details": {
    "requested_slug": "dragons-quest",
    "suggested_slugs": [
      "dragons-quest-2025",
      "dragons-quest-aria",
      "dragons-quest-fantasy"
    ]
  }
}
```

### GET /api/my-works/publishing/preview/{work_id}
**Purpose**: Generate preview of how work will appear when published

**Request**:
```http
GET /api/my-works/publishing/preview/{work_id}
Authorization: Bearer {jwt_token}
```

**Query Parameters**:
- `visibility` (optional): Preview visibility setting (`public`, `unlisted`)

**Response 200**:
```json
{
  "work": {
    "title": "Dragon's Quest",
    "description": "Epic fantasy adventure...",
    "author_name": "Author Name",
    "chapter_count": 5,
    "word_count": 25000,
    "estimated_read_time": "2 hours 5 minutes",
    "cover_image_url": "https://...",
    "first_enhancement_url": "https://..."
  },
  "seo_preview": {
    "title": "Dragon's Quest - Epic Fantasy Adventure | Novel Enchant",
    "description": "Follow Aria's journey through magical realms...",
    "slug": "dragons-quest-epic-fantasy",
    "og_image_url": "https://...",
    "canonical_url": "https://novelenchant.com/read/dragons-quest-epic-fantasy"
  },
  "chapters_preview": [
    {
      "title": "The Beginning",
      "word_count": 5000,
      "enhancement_count": 2,
      "excerpt": "It was a dark and stormy night..."
    }
  ]
}
```

### PUT /api/my-works/publishing/{publication_id}
**Purpose**: Update publication settings (SEO, visibility)

**Request**:
```http
PUT /api/my-works/publishing/{publication_id}
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "visibility": "unlisted",
  "seo_title": "Dragon's Quest - Updated Title",
  "seo_description": "Updated description for better SEO...",
  "slug": "dragons-quest-updated"
}
```

**Response 200**: Updated publication object
**Response 400**: Validation error
**Response 409**: Slug conflict

### DELETE /api/my-works/publishing/{publication_id}
**Purpose**: Unpublish a work (remove from public discovery)

**Request**:
```http
DELETE /api/my-works/publishing/{publication_id}
Authorization: Bearer {jwt_token}
```

**Response 200**: Unpublish confirmation
```json
{
  "publication_id": "uuid",
  "work_id": "uuid",
  "unpublished_at": "2025-09-26T16:30:00Z",
  "status": "unpublished",
  "analytics_preserved": true,
  "message": "Work removed from public discovery. Analytics data preserved."
}
```

## Public Reading API

### GET /api/public/read/{slug}
**Purpose**: Public endpoint for reading published works

**Request**:
```http
GET /api/public/read/{slug}
```

**Query Parameters**:
- `chapter` (optional): Chapter index (0-based, default: 0)
- `session_id` (optional): Anonymous session for analytics

**Response 200**:
```json
{
  "work": {
    "title": "Dragon's Quest",
    "description": "Epic fantasy adventure...",
    "author_name": "Author Name",
    "published_at": "2025-09-26T16:00:00Z",
    "chapter_count": 5,
    "word_count": 25000,
    "cover_image_url": "https://...",
    "og_image_url": "https://..."
  },
  "chapter": {
    "index": 0,
    "title": "The Beginning",
    "content": "It was a dark and stormy night...",
    "word_count": 5000,
    "estimated_read_time": "20 minutes",
    "enhancements": [
      {
        "anchor_id": "anchor_1",
        "position": 1250,
        "image_url": "https://...",
        "thumbnail_url": "https://...",
        "alt_text": "Dark forest scene with mysterious fog"
      }
    ]
  },
  "navigation": {
    "previous_chapter": null,
    "next_chapter": {
      "index": 1,
      "title": "The Journey Begins",
      "url": "/read/dragons-quest?chapter=1"
    }
  },
  "seo": {
    "title": "Chapter 1: The Beginning - Dragon's Quest",
    "description": "Read the opening chapter of Dragon's Quest...",
    "canonical_url": "https://novelenchant.com/read/dragons-quest?chapter=0"
  }
}
```

**Response 404**: Work not found or not public

### POST /api/public/track-view
**Purpose**: Track reading analytics for published works

**Request**:
```http
POST /api/public/track-view
Content-Type: application/json

{
  "publication_id": "uuid",
  "chapter_id": "uuid",
  "session_id": "anonymous_session_uuid",
  "read_duration_seconds": 120,
  "scroll_percentage": 85.5,
  "user_agent": "Mozilla/5.0...",
  "referrer": "https://google.com/search"
}
```

**Validation**:
- `session_id`: Required for unique visitor tracking
- `read_duration_seconds`: Optional, time spent reading
- `scroll_percentage`: Optional, how far user scrolled (0-100)

**Response 200**: View tracked
```json
{
  "tracked": true,
  "session_id": "anonymous_session_uuid",
  "unique_view": true,
  "total_views": 15,
  "timestamp": "2025-09-26T16:35:00Z"
}
```

**Response 429**: Rate limit exceeded (max 1 view per session per minute)

## Analytics API

### GET /api/my-works/analytics/{work_id}
**Purpose**: Get analytics dashboard data for a work

**Request**:
```http
GET /api/my-works/analytics/{work_id}
Authorization: Bearer {jwt_token}
```

**Query Parameters**:
- `period` (optional): Time period (`24h`, `7d`, `30d`, `all`) (default: `7d`)
- `include_chapters` (optional): Include per-chapter breakdown (default: `true`)

**Response 200**:
```json
{
  "work": {
    "id": "uuid",
    "title": "Dragon's Quest",
    "publication_status": "public",
    "published_at": "2025-09-26T16:00:00Z"
  },
  "period": {
    "start": "2025-09-19T16:00:00Z",
    "end": "2025-09-26T16:00:00Z",
    "duration_days": 7
  },
  "summary": {
    "total_views": 245,
    "unique_visitors": 89,
    "average_read_time": "18 minutes",
    "completion_rate": 67.4,
    "bounce_rate": 23.6,
    "top_referrer": "google.com"
  },
  "daily_stats": [
    {
      "date": "2025-09-26",
      "views": 45,
      "unique_visitors": 23,
      "average_read_time": 1080
    }
  ],
  "chapters": [
    {
      "chapter_id": "uuid",
      "title": "The Beginning",
      "views": 245,
      "unique_views": 89,
      "average_read_time": 1200,
      "completion_rate": 89.2,
      "drop_off_points": [
        {"position": 2500, "percentage": 15.2},
        {"position": 4000, "percentage": 8.7}
      ]
    }
  ],
  "geographic": {
    "top_countries": [
      {"country": "United States", "views": 145, "percentage": 59.2},
      {"country": "United Kingdom", "views": 34, "percentage": 13.9}
    ]
  },
  "devices": {
    "mobile": {"views": 147, "percentage": 60.0},
    "desktop": {"views": 78, "percentage": 31.8},
    "tablet": {"views": 20, "percentage": 8.2}
  }
}
```

### GET /api/my-works/analytics/summary
**Purpose**: Get summary analytics across all author's published works

**Request**:
```http
GET /api/my-works/analytics/summary
Authorization: Bearer {jwt_token}
```

**Response 200**:
```json
{
  "author": {
    "total_published_works": 3,
    "total_chapters": 15,
    "total_word_count": 75000
  },
  "performance": {
    "total_views": 1250,
    "unique_visitors": 445,
    "average_engagement": "15 minutes",
    "top_performing_work": {
      "title": "Dragon's Quest",
      "views": 245,
      "engagement_rate": 67.4
    }
  },
  "recent_activity": {
    "views_last_7_days": 89,
    "new_readers_last_7_days": 34,
    "trending_work": "Dragon's Quest"
  },
  "works_summary": [
    {
      "work_id": "uuid",
      "title": "Dragon's Quest",
      "published_at": "2025-09-26T16:00:00Z",
      "views": 245,
      "unique_visitors": 89,
      "status": "public"
    }
  ]
}
```

## Explore Integration

### GET /api/explore/works
**Purpose**: Public endpoint for Explore page (published works discovery)

**Request**:
```http
GET /api/explore/works
```

**Query Parameters**:
- `category` (optional): Filter by genre/category
- `sort` (optional): Sort order (`popular`, `recent`, `trending`) (default: `popular`)
- `limit` (optional): Number of works (default: 20, max: 100)
- `offset` (optional): Pagination offset

**Response 200**:
```json
{
  "works": [
    {
      "id": "uuid",
      "title": "Dragon's Quest",
      "description": "Epic fantasy adventure...",
      "author_name": "Author Name",
      "published_at": "2025-09-26T16:00:00Z",
      "cover_image_url": "https://...",
      "slug": "dragons-quest",
      "chapter_count": 5,
      "word_count": 25000,
      "estimated_read_time": "2 hours 5 minutes",
      "view_count": 245,
      "enhancement_preview": [
        {
          "image_url": "https://...",
          "thumbnail_url": "https://..."
        }
      ],
      "tags": ["fantasy", "adventure", "magic"]
    }
  ],
  "total": 1,
  "has_more": false,
  "filters": {
    "available_categories": ["fantasy", "sci-fi", "romance", "mystery"],
    "sort_options": ["popular", "recent", "trending"]
  }
}
```

## Error Responses

### 400 Bad Request - Work Not Ready
```json
{
  "error": "work_not_ready",
  "message": "Work cannot be published in current state",
  "details": {
    "chapter_count": 0,
    "minimum_chapters": 1,
    "missing_requirements": ["at_least_one_chapter"]
  }
}
```

### 403 Forbidden - Already Published
```json
{
  "error": "already_published",
  "message": "Work is already published",
  "details": {
    "publication_id": "uuid",
    "published_at": "2025-09-26T16:00:00Z",
    "current_slug": "dragons-quest"
  }
}
```

### 429 Rate Limit - Publishing
```json
{
  "error": "publish_rate_limit",
  "message": "Publishing rate limit exceeded",
  "details": {
    "limit": 5,
    "window": "1 hour",
    "reset_at": "2025-09-26T17:00:00Z"
  }
}
```

## Rate Limits

- **Publishing**: 5 publications per hour per user
- **SEO Updates**: 10 updates per hour per publication
- **Analytics Requests**: 100 requests per hour per user
- **Public Reading**: 1000 views per hour per IP (anonymous)
- **View Tracking**: 1 track per session per minute per chapter

## SEO Features

### Automatic Optimization
- **Title Generation**: Work title + author + platform branding
- **Description Generation**: First 160 characters of work description
- **Slug Generation**: URL-safe version of work title
- **OG Image**: First enhancement image or default cover
- **Structured Data**: JSON-LD markup for rich snippets

### Performance
- **Server-Side Rendering**: Full HTML with meta tags for crawlers
- **Image Optimization**: WebP format with fallbacks
- **Lazy Loading**: Progressive image loading for large works
- **Caching**: CDN caching for published content

### Analytics Integration
- **Search Console**: Automatic sitemap submission
- **Click Tracking**: UTM parameter support
- **Social Sharing**: Open Graph and Twitter Card optimization
- **Performance Monitoring**: Core Web Vitals tracking