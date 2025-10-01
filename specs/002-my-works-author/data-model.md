# Data Model: My Works (Author) Platform

**Feature**: Author platform with work management, enhancement, and publishing
**Database**: PostgreSQL via Supabase
**Date**: 2025-09-26

## Entity Relationship Overview

```
User (Supabase Auth)
  ↓ 1:n
Work ← author_user_id
  ↓ 1:n
Chapter ← work_id
  ↓ 1:n
Enhancement ← chapter_id
  ↓ 1:n
ImageVersion ← enhancement_id

Work
  ↓ 1:n
Character ← work_id

Work
  ↓ 1:1
Publication ← work_id
```

## Core Entities

### Work
**Purpose**: Container for an author's creative project (novel, story collection, etc.)

```sql
CREATE TABLE works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_edited_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata
  word_count INTEGER DEFAULT 0,
  chapter_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),

  -- Settings
  auto_enhance_enabled BOOLEAN DEFAULT true,
  target_scenes_per_chapter INTEGER DEFAULT 4,

  -- Constraints
  CONSTRAINT valid_title_length CHECK (LENGTH(title) >= 1 AND LENGTH(title) <= 255),
  CONSTRAINT valid_description_length CHECK (LENGTH(description) <= 2000)
);

-- Indexes
CREATE INDEX idx_works_author ON works(author_user_id);
CREATE INDEX idx_works_status ON works(status);
CREATE INDEX idx_works_updated ON works(updated_at DESC);
```

**Key Attributes**:
- `title`: Work display name (required, 1-255 chars)
- `description`: Author's summary (optional, max 2000 chars)
- `word_count`: Calculated from all chapters
- `auto_enhance_enabled`: Default enhancement behavior
- `target_scenes_per_chapter`: AI guidance for enhancement density

### Chapter
**Purpose**: Individual text unit within a work, containing author's written content

```sql
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  title VARCHAR(255),
  content TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata
  word_count INTEGER DEFAULT 0,
  enhancement_count INTEGER DEFAULT 0,

  -- Content structure
  enhancement_anchors JSONB DEFAULT '[]'::jsonb,

  -- Constraints
  CONSTRAINT valid_order_index CHECK (order_index >= 0),
  CONSTRAINT valid_title_length CHECK (title IS NULL OR LENGTH(title) <= 255),
  CONSTRAINT valid_content_length CHECK (LENGTH(content) >= 0),
  CONSTRAINT unique_chapter_order UNIQUE (work_id, order_index)
);

-- Indexes
CREATE INDEX idx_chapters_work ON chapters(work_id, order_index);
CREATE INDEX idx_chapters_updated ON chapters(updated_at DESC);
CREATE INDEX idx_chapters_anchors ON chapters USING gin(enhancement_anchors);
```

**Key Attributes**:
- `content`: Raw text content (no HTML/markdown)
- `order_index`: Position within work (0-based, unique per work)
- `enhancement_anchors`: JSON array of image insertion points
  ```json
  [
    {
      "id": "anchor_1",
      "position": 1250,
      "type": "auto|manual|highlight",
      "enhancement_id": "uuid"
    }
  ]
  ```

### Character
**Purpose**: Named entities within a work's universe for consistency tracking

```sql
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata
  appearance_count INTEGER DEFAULT 0,
  linked_images_count INTEGER DEFAULT 0,

  -- Character data
  attributes JSONB DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT valid_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 100),
  CONSTRAINT valid_description_length CHECK (description IS NULL OR LENGTH(description) <= 1000),
  CONSTRAINT unique_character_name UNIQUE (work_id, name)
);

-- Indexes
CREATE INDEX idx_characters_work ON characters(work_id);
CREATE INDEX idx_characters_name ON characters(work_id, name);
CREATE INDEX idx_characters_attributes ON characters USING gin(attributes);
```

**Key Attributes**:
- `name`: Character identifier (unique per work)
- `description`: Author's character notes
- `attributes`: Flexible JSON for character details
  ```json
  {
    "physical": {
      "hair": "auburn",
      "eyes": "green",
      "height": "tall"
    },
    "personality": ["brave", "stubborn"],
    "role": "protagonist"
  }
  ```

### Enhancement
**Purpose**: AI-generated image tied to specific text position with metadata

```sql
CREATE TABLE enhancements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  anchor_id VARCHAR(50) NOT NULL,
  position_start INTEGER NOT NULL,
  position_end INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Generation metadata
  prompt_text TEXT NOT NULL,
  prompt_type VARCHAR(20) NOT NULL CHECK (prompt_type IN ('auto', 'manual', 'highlight')),
  generation_status VARCHAR(20) DEFAULT 'pending' CHECK (generation_status IN ('pending', 'generating', 'completed', 'failed')),

  -- Active version
  active_version_id UUID,
  total_versions INTEGER DEFAULT 0,

  -- Character linking
  linked_characters UUID[] DEFAULT ARRAY[]::UUID[],

  -- Constraints
  CONSTRAINT valid_position CHECK (position_start >= 0 AND position_end >= position_start),
  CONSTRAINT valid_prompt_length CHECK (LENGTH(prompt_text) >= 1 AND LENGTH(prompt_text) <= 1000),
  CONSTRAINT unique_chapter_anchor UNIQUE (chapter_id, anchor_id)
);

-- Indexes
CREATE INDEX idx_enhancements_chapter ON enhancements(chapter_id);
CREATE INDEX idx_enhancements_status ON enhancements(generation_status);
CREATE INDEX idx_enhancements_characters ON enhancements USING gin(linked_characters);
```

**Key Attributes**:
- `anchor_id`: Links to chapter's enhancement_anchors
- `position_start/end`: Text range for image context
- `prompt_text`: Text used for AI generation
- `linked_characters`: Array of character UUIDs for consistency

### ImageVersion
**Purpose**: Version history for enhancement images with retry capability

```sql
CREATE TABLE image_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enhancement_id UUID REFERENCES enhancements(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Image data
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,

  -- Generation metadata
  generation_params JSONB DEFAULT '{}'::jsonb,
  generation_time_ms INTEGER,

  -- Status
  is_active BOOLEAN DEFAULT false,
  quality_score DECIMAL(3,2),

  -- Constraints
  CONSTRAINT valid_version_number CHECK (version_number >= 1),
  CONSTRAINT valid_quality_score CHECK (quality_score IS NULL OR (quality_score >= 0.0 AND quality_score <= 1.0)),
  CONSTRAINT unique_enhancement_version UNIQUE (enhancement_id, version_number)
);

-- Indexes
CREATE INDEX idx_image_versions_enhancement ON image_versions(enhancement_id, version_number);
CREATE INDEX idx_image_versions_active ON image_versions(enhancement_id) WHERE is_active = true;
```

**Key Attributes**:
- `version_number`: Incremental version (1, 2, 3...)
- `is_active`: Only one version active per enhancement
- `generation_params`: AI model settings used
- `quality_score`: Optional scoring for future ranking

### Publication
**Purpose**: Publishing metadata and SEO for public works

```sql
CREATE TABLE publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Publishing settings
  visibility VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (visibility IN ('draft', 'unlisted', 'public')),
  published_at TIMESTAMPTZ,
  unpublished_at TIMESTAMPTZ,

  -- SEO metadata
  slug VARCHAR(100) NOT NULL,
  seo_title VARCHAR(60),
  seo_description VARCHAR(160),
  og_image_url TEXT,

  -- Reader metadata
  read_count INTEGER DEFAULT 0,
  unique_readers INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),

  -- Constraints
  CONSTRAINT valid_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT valid_seo_title_length CHECK (seo_title IS NULL OR LENGTH(seo_title) <= 60),
  CONSTRAINT valid_seo_description_length CHECK (seo_description IS NULL OR LENGTH(seo_description) <= 160),
  CONSTRAINT unique_slug UNIQUE (slug)
);

-- Indexes
CREATE INDEX idx_publications_work ON publications(work_id);
CREATE INDEX idx_publications_visibility ON publications(visibility);
CREATE INDEX idx_publications_slug ON publications(slug);
CREATE INDEX idx_publications_published ON publications(published_at DESC) WHERE visibility = 'public';
```

**Key Attributes**:
- `slug`: URL-friendly identifier (global unique)
- `visibility`: Controls public access
- `seo_title/description`: Optimized for search engines
- `read_count`: Total view tracking

## Supporting Tables

### ViewEvents
**Purpose**: Analytics tracking for published works

```sql
CREATE TABLE view_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id UUID REFERENCES publications(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Session tracking
  session_id VARCHAR(50) NOT NULL,
  user_agent TEXT,
  ip_address INET,

  -- Reading metadata
  read_duration_seconds INTEGER,
  scroll_percentage DECIMAL(5,2),

  -- Constraints
  CONSTRAINT valid_duration CHECK (read_duration_seconds IS NULL OR read_duration_seconds >= 0),
  CONSTRAINT valid_scroll CHECK (scroll_percentage IS NULL OR (scroll_percentage >= 0.0 AND scroll_percentage <= 100.0))
);

-- Indexes
CREATE INDEX idx_view_events_publication ON view_events(publication_id, created_at);
CREATE INDEX idx_view_events_chapter ON view_events(chapter_id, created_at);
CREATE INDEX idx_view_events_session ON view_events(session_id, publication_id);
```

### RateLimits
**Purpose**: Abuse prevention for AI generation and publishing

```sql
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type VARCHAR(30) NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,

  -- Constraints
  CONSTRAINT valid_count CHECK (count >= 0),
  CONSTRAINT valid_window CHECK (window_end > window_start),
  CONSTRAINT unique_user_resource_window UNIQUE (user_id, resource_type, window_start)
);

-- Indexes
CREATE INDEX idx_rate_limits_user ON rate_limits(user_id, resource_type);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_end) WHERE window_end > NOW();
```

## Calculated Fields & Views

### WorkSummary View
**Purpose**: Aggregate work statistics for author dashboard

```sql
CREATE VIEW work_summary AS
SELECT
  w.id,
  w.title,
  w.description,
  w.status,
  w.created_at,
  w.updated_at,
  w.last_edited_at,
  COUNT(DISTINCT c.id) as chapter_count,
  COALESCE(SUM(c.word_count), 0) as total_word_count,
  COUNT(DISTINCT e.id) as enhancement_count,
  COUNT(DISTINCT ch.id) as character_count,
  p.visibility as publication_status,
  COALESCE(p.read_count, 0) as read_count
FROM works w
LEFT JOIN chapters c ON c.work_id = w.id
LEFT JOIN enhancements e ON e.chapter_id = c.id
LEFT JOIN characters ch ON ch.work_id = w.id
LEFT JOIN publications p ON p.work_id = w.id
GROUP BY w.id, p.visibility, p.read_count;
```

## Business Rules

### Work Management
1. **Chapter Ordering**: Order indices must be sequential (0, 1, 2...) within each work
2. **Word Count**: Automatically calculated from chapter content on save
3. **Last Edited**: Updated whenever any chapter is modified
4. **Status Transitions**: draft → published → archived (one-way flow)

### Enhancement Generation
1. **Rate Limiting**: Maximum 50 enhancements per user per hour
2. **Version History**: All versions preserved, only one active per enhancement
3. **Character Linking**: Characters can be linked to multiple enhancements
4. **Prompt Validation**: Content filtering applied before AI generation

### Publishing Workflow
1. **Slug Generation**: Auto-generated from title, must be globally unique
2. **SEO Optimization**: Title and description auto-generated if not provided
3. **Visibility Control**: draft → unlisted → public (can revert to draft)
4. **Analytics Tracking**: View events only recorded for public/unlisted works

### Data Integrity
1. **Cascade Deletes**: Work deletion removes all related data
2. **Character References**: Deleting characters unlinks from enhancements
3. **Active Versions**: Exactly one active image version per enhancement
4. **Session Tracking**: Anonymous session IDs for privacy-compliant analytics

## Performance Considerations

### Query Optimization
- Indexes on frequently queried columns (author, status, dates)
- Composite indexes for common filter combinations
- Partial indexes for conditional queries (published works only)
- GIN indexes for JSON column searches

### Data Growth Management
- View events partitioned by month for long-term retention
- Image versions cleaned up after 30 days (keep active + last 3)
- Rate limit records auto-expired after window

### Caching Strategy
- Work summaries cached at application level
- Public work metadata cached for Explore page
- Image URLs cached with appropriate TTL
- Analytics aggregations computed and cached daily