# Research Document: Reader Enhance Flow

**Feature**: Reader Enhance Flow
**Date**: 2025-09-13
**Status**: Complete

## Executive Summary
Research completed for implementing a reader-focused story enhancement system with automatic scene detection and AI image generation. All technical decisions finalized based on existing codebase patterns and Novel Enchant architecture.

## Technical Decisions

### 1. File Upload Architecture
**Decision**: React-dropzone + Supabase Storage
**Rationale**:
- Existing pattern in codebase for file handling
- Supabase storage provides secure, scalable file storage
- Signed URLs for temporary access
- Automatic cleanup policies available

**Alternatives Considered**:
- Direct Base64 encoding: Rejected - memory inefficient for large files
- Client-side only: Rejected - no persistence, lost on refresh
- AWS S3 direct: Rejected - adds complexity, Supabase already integrated

### 2. Text Processing & Scene Extraction
**Decision**: Supabase Edge Function with streaming processing
**Rationale**:
- Serverless execution for scalability
- Can handle large text files without client memory issues
- Streaming prevents timeouts on long documents
- Natural language processing via chunking algorithm

**Implementation Approach**:
```
- Chunk text into logical segments (paragraphs/sections)
- Identify scene boundaries using:
  - Chapter breaks
  - Scene breaks (*** or ---)
  - Significant time/location changes
  - Target 3-5 scenes per 1000 words
```

**Alternatives Considered**:
- Client-side processing: Rejected - performance issues on mobile
- GPT-based extraction: Rejected - cost and latency concerns
- Fixed interval chunking: Rejected - breaks narrative flow

### 3. Image Generation Service
**Decision**: SDXL via Supabase Edge Function
**Rationale**:
- Already integrated in Novel Enchant platform
- Consistent with existing image generation patterns
- Edge function handles API keys securely
- Supports retry logic and error handling

**Generation Parameters**:
- Model: SDXL 1.0
- Resolution: 1024x1024 (optimal for reading view)
- Style: Cinematic, story-appropriate
- Negative prompts: Avoid text, logos, watermarks

**Alternatives Considered**:
- DALL-E 3: Rejected - different API, would require new integration
- Midjourney: Rejected - no API available
- Stable Diffusion local: Rejected - infrastructure complexity

### 4. State Management
**Decision**: React Context + Local Component State
**Rationale**:
- Consistent with existing patterns in codebase
- No need for global store (Redux/Zustand)
- Enhancement flow is self-contained
- Progress tracking via local state

**State Structure**:
```typescript
interface EnhanceState {
  uploadProgress: number
  extractionStatus: 'idle' | 'processing' | 'complete' | 'error'
  scenes: Scene[]
  generationProgress: { current: number, total: number }
  enhancedCopy: EnhancedCopy | null
}
```

**Alternatives Considered**:
- Redux: Rejected - overkill for feature scope
- Zustand: Rejected - not currently in tech stack
- URL state: Rejected - too much data for URL params

### 5. Database Schema
**Decision**: Single table with JSONB for nested data
**Rationale**:
- Simplified queries for reading enhanced copies
- JSONB supports nested scenes/chapters efficiently
- Consistent with existing content storage patterns
- Easy to extend without migrations

**Schema Design**:
```sql
enhanced_copies (
  id uuid primary key,
  user_id uuid references users,
  title text,
  source_type text, -- 'paste', 'file', 'import'
  source_file_url text,
  chapters jsonb, -- Array of chapters with scenes
  cover_image_url text,
  private boolean default true,
  created_at timestamp,
  updated_at timestamp
)
```

**Alternatives Considered**:
- Normalized tables (copies/chapters/scenes): Rejected - complex joins
- NoSQL document store: Rejected - PostgreSQL JSONB sufficient
- File-based storage: Rejected - no query capabilities

### 6. File Format Support
**Decision**: Initial support for .txt, .md, .docx, .pdf
**Rationale**:
- Covers 90% of user needs
- Libraries available for each format
- Progressive enhancement possible

**Processing Libraries**:
- .txt/.md: Native JavaScript
- .docx: mammoth.js
- .pdf: pdf.js

**Alternatives Considered**:
- EPUB support: Deferred - complex format, v2 feature
- RTF support: Deferred - rare usage
- HTML: Deferred - security concerns need addressing

### 7. Rate Limiting & Quotas
**Decision**: Configurable limits via environment variables
**Rationale**:
- Easy to adjust without code changes
- Can implement tiered limits later
- Consistent with platform approach

**Initial Limits**:
- Max file size: 2MB
- Max word count: 50,000
- Max scenes: 30 per copy
- Rate limit: 5 enhancements per hour

**Alternatives Considered**:
- Hard-coded limits: Rejected - inflexible
- Database-driven: Rejected - over-engineering for v1
- No limits: Rejected - abuse potential

### 8. Image Storage & CDN
**Decision**: Supabase Storage with CDN
**Rationale**:
- Integrated with existing infrastructure
- Automatic image optimization
- CDN for performance
- Secure signed URLs

**Storage Structure**:
```
/enhanced-copies/
  /{user_id}/
    /{copy_id}/
      /scenes/
        /{scene_id}.webp
```

**Alternatives Considered**:
- Cloudinary: Rejected - additional service dependency
- Local storage: Rejected - not scalable
- Base64 in database: Rejected - database bloat

## Integration Points

### With Existing Features
1. **Navigation (Spec 000)**:
   - Entry from My Shelf empty state
   - Entry from My Shelf header button
   - No navbar entry (reader-only flow)

2. **Authentication**:
   - Reuse existing auth context
   - User ID for copy ownership
   - Private copy enforcement

3. **UI Components**:
   - Reuse existing button styles
   - Consistent loading states
   - Toast notifications for feedback

### API Endpoints Required
1. `POST /api/enhance/upload` - Handle file uploads
2. `POST /api/enhance/extract-scenes` - Process text into scenes
3. `POST /api/enhance/generate-image` - Generate image for scene
4. `PUT /api/enhance/scene/:id` - Update scene (accept/retry)
5. `POST /api/shelf/copies` - Save enhanced copy
6. `GET /api/shelf/copies` - List user's copies
7. `GET /api/shelf/copies/:id` - Get specific copy

## Performance Considerations

### Client-Side
- Lazy load images in reading view
- Virtual scrolling for long documents
- Progressive scene generation (show as ready)
- Debounced retry actions

### Server-Side
- Stream large file processing
- Queue image generation requests
- Cache generated images
- Database indexes on user_id, created_at

## Security Considerations

1. **File Upload Security**:
   - Validate file types server-side
   - Scan for malicious content
   - Size limits enforced
   - Sandboxed processing

2. **Content Privacy**:
   - RLS policies for enhanced_copies
   - Private by default
   - User can only see own copies
   - No public indexing in v1

3. **Rate Limiting**:
   - Per-user limits
   - IP-based fallback
   - Exponential backoff on errors

## Testing Strategy

### Unit Tests
- File type detection
- Text chunking algorithm
- Scene boundary detection
- State management hooks

### Integration Tests
- File upload flow
- Scene extraction pipeline
- Image generation with retry
- Save to shelf flow

### E2E Tests
- Complete enhancement flow
- Error handling paths
- Rate limit enforcement
- Reading view functionality

## Migration Path

### From MVP to Production
1. Start with conservative limits
2. Monitor usage patterns
3. Adjust limits based on data
4. Add paid tiers if needed

### Future Enhancements
- Author enhance flow (Spec 002)
- EPUB support
- Collaborative features
- Style consistency
- Batch processing

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large file processing timeout | High | Stream processing, progress indicators |
| Image generation costs | Medium | Rate limits, quotas, monitoring |
| Storage costs | Medium | Cleanup policies, compression |
| Abuse/spam | Low | Auth required, rate limits |

## Conclusion

All technical decisions have been made based on:
1. Existing codebase patterns
2. Novel Enchant platform capabilities
3. Simplicity and maintainability
4. User experience requirements

No outstanding NEEDS CLARIFICATION items remain. Ready to proceed with Phase 1 design and contract generation.