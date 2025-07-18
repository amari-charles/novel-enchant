# Novel Enchant Backend

A comprehensive AI-powered storytelling platform that transforms written novels into immersive visual experiences through automated scene extraction and SDXL image generation.

## 🏗️ Architecture Overview

Novel Enchant uses a modern serverless architecture built on Supabase with the following components:

- **Database**: PostgreSQL with Row Level Security (RLS)
- **Edge Functions**: TypeScript-based serverless functions for AI processing
- **Storage**: Supabase Storage for images and reference materials
- **AI Integration**: OpenAI GPT-4 for text analysis, SDXL for image generation

## 📁 Project Structure

```
backend/
├── schema.sql                           # Complete database schema
├── types.ts                            # TypeScript type definitions
├── functions/                          # Supabase Edge Functions
│   ├── upload-chapter/                 # Chapter upload and processing
│   ├── extract-scenes/                 # GPT-powered scene extraction
│   ├── extract-entities/               # Character/location extraction
│   ├── build-prompt/                   # Prompt construction for images
│   ├── queue-image-generation/         # Async image generation queue
│   └── get-reading-view/               # Reading interface data
├── prompt-construction-algorithm.md    # Detailed prompt logic
├── extensibility-and-future-features.md # Architecture evolution
└── README.md                          # This file
```

## 🗄️ Database Schema

The schema supports the complete story visualization pipeline:

### Core Entities
- **users** - Extended Supabase auth users with subscription tiers
- **stories** - Story containers with style preferences
- **chapters** - Text content with processing status
- **scenes** - AI-extracted visual moments (2-5 per chapter)

### Character & Location Tracking
- **characters** - Persistent entities with multiple reference images
- **character_reference_images** - Multiple references per entity with temporal tracking
- **character_states** - Evolving descriptions by chapter with priority-based management
- **locations** + **location_states** - Place tracking with temporal changes and reference evolution

### Image Generation Pipeline
- **prompts** - Constructed prompts with metadata and modification history
- **prompt_retries** - Alternative prompts for regeneration
- **images** - Final SDXL outputs with version tracking and quality metrics
- **processing_jobs** - Sequential chapter processing management

### Enhanced Reference Image System

**Entity Reference Management**:
```sql
-- Multiple reference images per entity
CREATE TABLE entity_references (
  id UUID PRIMARY KEY,
  entity_id UUID REFERENCES entities(id),
  image_url TEXT NOT NULL,
  added_at_chapter INTEGER NOT NULL,
  age_tag TEXT CHECK (age_tag IN ('young', 'adult', 'mature', 'elderly', 'child')),
  style_preset TEXT NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5,
  generation_method TEXT CHECK (generation_method IN ('ai_generated', 'user_uploaded', 'extracted')),
  quality_score FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Sequential Processing Management**:
```sql
-- Chapter processing sequence tracking
CREATE TABLE chapter_processing_jobs (
  id UUID PRIMARY KEY,
  story_id UUID REFERENCES stories(id),
  chapter_number INTEGER NOT NULL,
  status TEXT CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'waiting_for_previous')),
  prerequisite_chapter INTEGER,
  priority INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT
);
```

**Image Version Tracking**:
```sql
-- Scene images with version replacement
ALTER TABLE scene_images 
ADD COLUMN version INTEGER DEFAULT 1,
ADD COLUMN replaced_image_id UUID REFERENCES scene_images(id),
ADD COLUMN replaced_at TIMESTAMP;
```

### Junction Tables
- **scene_characters** - Many-to-many scene ↔ character relationships
- **scene_locations** - Many-to-many scene ↔ location relationships

## 🔧 Edge Functions

### 1. upload-chapter
Accepts chapter content and initiates processing pipeline with intelligent content detection.

```typescript
POST /functions/v1/upload-chapter
{
  "story_id": "uuid",
  "file": File, // TXT, PDF, DOCX, EPUB supported
  "title": "Optional title override"
}
```

**Content-Based Detection**:
- **Automatic chapter detection** using pattern recognition (Chapter 1, Chapter One, Ch. 1, etc.)
- **Content type classification**: single_chapter, multi_chapter, full_book
- **Structural analysis**: word count, formatting patterns, section breaks
- **Confidence scoring** based on detected patterns and indicators

**Response**: Parsed text + chapter structure + processing sequence initialization

### 2. extract-scenes
Uses GPT-4 to identify 2-5 key visual scenes per chapter.

```typescript
POST /functions/v1/extract-scenes
{
  "chapter_id": "uuid",
  "max_scenes": 4,
  "focus_on": "action" // optional: action|dialogue|description|emotion
}
```

**Features**:
- Context-aware extraction using existing characters/locations
- Emotional tone detection
- Time-of-day and weather analysis
- Automatic entity extraction job creation

### 3. build-prompt
Constructs detailed SDXL prompts using character states and story context.

```typescript
POST /functions/v1/build-prompt
{
  "scene_id": "uuid",
  "character_focus": ["character-uuid"], // optional
  "artistic_style": "cinematic composition" // optional
}
```

**Prompt Construction Logic**:
1. **Context Gathering**: Latest character/location states for current chapter
2. **Description Assembly**: Layered character appearance (state → base → scene-specific)
3. **Style Integration**: Genre-specific modifiers and artistic direction
4. **Technical Optimization**: SDXL parameters and negative prompts

### 4. queue-image-generation
Manages async image generation with credit system and queue management.

```typescript
POST /functions/v1/queue-image-generation
{
  "prompt_id": "uuid",
  "priority": 5, // 1-10
  "parameters": {
    "width": 768,
    "height": 1024,
    "steps": 25,
    "cfg_scale": 7.5
  }
}
```

**Features**:
- Credit cost calculation based on parameters and subscription
- Queue position estimation
- IP-Adapter reference image integration
- Automatic credit deduction with failure refunds

### 5. get-reading-view
Returns complete chapter data optimized for reading interface.

```typescript
POST /functions/v1/get-reading-view
{
  "chapter_id": "uuid",
  "include_raw_text": false // optional privacy flag
}
```

**Response**: Chapter + scenes + characters + locations + images + navigation

## 🔄 Sequential Chapter Processing

Novel Enchant processes chapters sequentially to maintain visual and narrative consistency across the story.

### **Processing Order Requirements**

- **Chapters MUST be processed in sequential order** (Chapter 1 → Chapter 2 → Chapter 3...)
- **Each chapter waits for the previous chapter to complete** before starting
- **Chapter context is preserved** and passed to subsequent chapters

### **Why Sequential Processing?**

1. **Visual Consistency**: Later chapters build on visual elements established in earlier chapters
2. **Entity Evolution**: Characters age, change appearance, gain scars, etc. over time
3. **Reference Image Management**: New reference images are created based on entity evolution
4. **Style Continuity**: Visual style evolves consistently throughout the story

### **Processing Pipeline per Chapter**

```typescript
// Sequential processing workflow
async function processChapter(chapterNumber: number, previousContext?: ChapterContext) {
  1. Load chapter text and previous chapter context
  2. Extract visual scenes with story context
  3. Identify and resolve entity mentions
  4. Track entity evolution from previous chapters
  5. Generate/update reference images as needed
  6. Construct image prompts with multiple references
  7. Generate scene images with version replacement
  8. Assess image quality and suggest improvements
  9. Pass context to next chapter
}
```

### **Chapter Context Passing**

Each chapter receives context from the previous chapter:

```typescript
interface ChapterContext {
  chapterNumber: number;
  entityStates: Record<string, EntityReference[]>; // Latest references per entity
  previousScenes: Scene[];                         // Previous chapter scenes
  styleEvolution: string[];                        // Style progression
}
```

### **Reference Image Evolution**

- **Multiple references per entity** with temporal tracking
- **Age-based progression** (young → adult → elderly)
- **Priority-based selection** for prompt construction
- **Quality-driven replacement** when better references are generated

## 🧠 AI Integration

### GPT-4 Scene Extraction
- **Model**: gpt-4-turbo-preview
- **Purpose**: Analyze chapter text and extract visual scenes
- **Output**: Structured JSON with scene descriptions, characters, locations, and emotional context

### Character State Evolution
Automatic tracking of character appearance changes across chapters:

```typescript
// Example character state evolution
Chapter 1: "tall warrior with silver armor"
Chapter 5: "tall warrior with silver armor, now bearing a scar across his left cheek"
Chapter 10: "tall warrior in tattered silver armor, scar healed but visible, wearing a black cloak"
```

### Prompt Construction Algorithm
1. **Scene Foundation**: Core scene description from GPT extraction
2. **Character Assembly**: Latest states + emotional context + scene-specific notes
3. **Location Context**: Environmental details + lighting + weather
4. **Style Application**: Genre presets + custom modifiers + technical parameters
5. **Quality Optimization**: Negative prompts + weight balancing + IP-Adapter references

## 🚀 Deployment

### Supabase Setup

1. **Initialize Supabase project**:
```bash
cd backend
supabase init
supabase start
```

2. **Apply schema**:
```bash
psql -d postgres -f schema.sql
```

3. **Deploy edge functions**:
```bash
supabase functions deploy upload-chapter
supabase functions deploy extract-scenes
supabase functions deploy build-prompt
supabase functions deploy queue-image-generation
supabase functions deploy get-reading-view
```

### Environment Variables
```env
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
SDXL_API_ENDPOINT=your-image-generation-endpoint
```

### Storage Buckets
Create in Supabase dashboard:
- `character-references` - Character reference images for IP-Adapter
- `generated-images` - AI-generated scene images  
- `story-covers` - User-uploaded story cover images

## 🔐 Security

### Row Level Security (RLS)
All tables use RLS policies ensuring users can only access their own data or public content.

### API Authentication
All edge functions validate JWT tokens from Supabase Auth.

### Data Privacy
- Optional automatic deletion of raw chapter text after processing
- Granular privacy controls for story sharing
- Secure handling of user-generated content

## 📊 Performance Optimization

### Database Indexing
- Optimized indexes for common query patterns
- Composite indexes for complex joins
- Partial indexes for filtering by status

### Caching Strategy
- Materialized views for expensive aggregations
- Application-level caching for hot data
- CDN integration for static assets

### Async Processing
- Background job queue for expensive operations
- Priority-based processing
- Automatic retry logic with exponential backoff

## 🔮 Extensibility

The architecture supports future enhancements:

### LoRA Style Training
- Custom model training for consistent artistic styles
- Integration with Stable Diffusion training pipelines
- User-specific style model management

### Advanced AI Features
- Emotion-aware character state tracking
- Intelligent content suggestions
- Automated quality enhancement
- Multi-model image generation support

### Collaboration Features
- Multi-author story editing
- Community sharing and discovery
- Advanced export formats (PDF, EPUB, video)

### Marketplace Integration
- Style model sharing
- Community content discovery
- Professional illustration services

## 🧪 Testing

### Unit Tests
```bash
# Test individual functions
npm test -- functions/upload-chapter
npm test -- functions/extract-scenes
```

### Integration Tests
```bash
# Test complete pipeline
npm run test:integration
```

### Load Testing
```bash
# Test concurrent processing
npm run test:load
```

## 📈 Monitoring

### Metrics Collection
- Processing job success/failure rates
- Image generation quality scores
- User engagement analytics
- System performance metrics

### Alerting
- Failed job notifications
- Credit balance alerts
- System health monitoring
- Error rate thresholds

## 💻 Development

### Local Development
```bash
# Start local Supabase
supabase start

# Start function development
supabase functions serve

# Run type checking
npm run type-check

# Run linting
npm run lint
```

### Code Quality
- TypeScript strict mode enabled
- ESLint configuration for edge functions
- Prettier for code formatting
- Automated testing on CI/CD

## 📚 API Documentation

Complete API documentation with examples is available in each function's directory. Key endpoints:

- `POST /upload-chapter` - Upload and process chapter content
- `POST /extract-scenes` - Extract visual scenes from chapter
- `POST /build-prompt` - Generate image prompts from scenes
- `POST /queue-image-generation` - Queue async image generation
- `POST /get-reading-view` - Retrieve reading interface data

## 🤝 Contributing

1. Follow TypeScript best practices
2. Maintain comprehensive type definitions
3. Include unit tests for new functions
4. Update documentation for API changes
5. Test RLS policies thoroughly

## 📄 License

This project implements a complete backend for AI-powered story visualization, designed to scale from personal use to a comprehensive creative platform.

---

**Novel Enchant** - Transforming stories into visual experiences through AI innovation.