# Novel Enchant - Architectural Decisions

This document captures key architectural decisions that guide the implementation and design of the Novel Enchant backend system.

## 📋 Decision Status

- **✅ Approved**: Final decisions that are implemented
- **🔄 Under Review**: Decisions being evaluated
- **❌ Rejected**: Decisions that were considered but not adopted

---

## 🧱 Story & Chapter Handling

### **Decision ADR-001: Content-Based Chapter Detection**

**Status**: ✅ Approved

**Context**: The system needs to determine whether uploaded content contains a full book or a single chapter.

**Decision**: Use content structure detection logic (heading patterns, word count, formatting) rather than file extension to determine content type.

**Rationale**: 
- File extensions are unreliable (users might upload .txt files containing full books)
- Content analysis provides more accurate detection
- Supports various file formats consistently

**Implementation**:
- Update `parseUploadedText` function with content analysis
- Detect chapter boundaries using heading patterns (e.g., "Chapter 1", "Chapter One", etc.)
- Use word count and structural patterns as indicators
- Fallback to single chapter if no clear structure detected

**Impact**: 
- More reliable chapter detection
- Better user experience with automatic content organization
- Reduced need for manual chapter splitting

---

## 🔁 Chapter Processing Order

### **Decision ADR-002: Sequential Chapter Processing**

**Status**: ✅ Approved

**Context**: Chapters can theoretically be processed in parallel, but this creates consistency issues.

**Decision**: Chapters must be processed sequentially to maintain visual and narrative consistency.

**Rationale**:
- **Style Consistency**: Later chapters build on visual elements from earlier ones
- **Entity Evolution**: Characters age, change appearance, gain scars, etc.
- **Reference Reuse**: Later chapters should use updated entity references

**Implementation**:
- Chapter queue enforces in-order execution
- Each `processChapterFlow(chapterId)` accepts `previousChapterId` parameter
- Entity references from previous chapters are loaded before processing
- Sequential processing ensures consistent entity evolution tracking

**Impact**:
- Improved visual consistency across the story
- Better character development tracking
- Slightly longer processing time (offset by better quality)

---

## 🖼️ Reference Images

### **Decision ADR-003: Multiple Reference Images per Entity**

**Status**: ✅ Approved

**Context**: Originally designed for one reference image per entity per style, but entities evolve throughout stories.

**Decision**: Store multiple reference images per entity with temporal and contextual metadata.

**Rationale**:
- Characters change appearance throughout stories (aging, injuries, clothing)
- Different reference images may be needed for different time periods
- Multiple references improve generation consistency via image averaging

**Implementation**:
```typescript
interface Entity {
  id: string;
  name: string;
  type: 'character' | 'location';
  description: string;
  referenceImages: EntityReference[];
  // ... other fields
}

interface EntityReference {
  id: string;
  imageUrl: string;
  addedAtChapter: number;
  ageTag?: string; // 'young', 'adult', 'elderly'
  stylePreset: string;
  description: string;
  isActive: boolean;
  metadata: {
    generatedAt: string;
    modelVersion: string;
    qualityScore?: number;
  };
}
```

**Usage Strategy**:
- MVP: Use latest 3 reference images during prompt construction
- Advanced: Implement image averaging/blending for consistency
- Future: Support IP-Adapter with multiple reference fusion

**Impact**:
- Better visual consistency as characters evolve
- More sophisticated reference management
- Foundation for advanced consistency features

---

## 🧾 Image Versioning

### **Decision ADR-004: Single Active Version per Scene**

**Status**: ✅ Approved

**Context**: When regenerating scene images, we need to decide whether to keep old versions.

**Decision**: Only store one active version per scene, with regenerations replacing the previous version.

**Rationale**:
- Simplifies user interface (no version confusion)
- Reduces storage costs
- Aligns with user expectation of "improvement" rather than "alternatives"

**Implementation**:
- `generateImageFromPrompt` replaces existing image for the scene
- Optional audit trail in database (not exposed in UI)
- Metadata tracks regeneration count and reason
- Previous image URLs are marked as deprecated but may be retained for short periods

**Impact**:
- Cleaner user experience
- Reduced storage overhead
- Simplified image management logic

---

## 🧠 User-Specified Scenes

### **Decision ADR-005: No Manual Scene Selection in MVP**

**Status**: ✅ Approved (Not in MVP)

**Context**: Users might want to specify which scenes to visualize manually.

**Decision**: Not included in MVP, but backend remains flexible for future implementation.

**Rationale**:
- AI scene extraction provides good automatic selection
- Manual selection adds complexity to UX and processing
- Can be added later without major architectural changes

**Implementation**:
- Current AI-driven scene extraction remains primary method
- Database schema supports future manual scene flagging
- `Scene` interface includes optional `userSelected` field for future use

**Impact**:
- Simplified MVP development
- Maintains flexibility for future enhancement
- Focus on perfecting automatic scene selection

---

## 🖼️ Image Display & Metadata

### **Decision ADR-006: Clean Image Display Without Inline Text**

**Status**: ✅ Approved

**Context**: Decision on whether to show scene summaries, labels, or descriptions with images.

**Decision**: Images are displayed without inline text overlays or captions in the reading view.

**Rationale**:
- Preserves immersive reading experience
- Allows images to speak for themselves
- Metadata is available through separate detail views

**Implementation**:
- Scene metadata (text, position, emotional tone) is stored but not displayed inline
- Reader view shows pure images between text sections
- Detail view or modal can expose scene metadata when requested
- Images are positioned contextually within the text flow

**Impact**:
- More immersive visual experience
- Cleaner, magazine-like reading interface
- Metadata preserved for future features or analytics

---

## 📊 Implementation Impact Matrix

| Decision | Functions Affected | Database Changes | API Changes | UX Impact |
|----------|-------------------|------------------|-------------|-----------|
| ADR-001 | `parseUploadedText` | None | Enhanced detection | Better auto-organization |
| ADR-002 | All orchestration | Job sequencing | Processing order | Longer but consistent processing |
| ADR-003 | `generateReferenceImage`, `constructImagePrompt` | Entity schema | Reference arrays | Better visual consistency |
| ADR-004 | `generateImageFromPrompt` | Image versioning | Replace behavior | Cleaner regeneration |
| ADR-005 | None (future) | Scene flags | Future expansion | Simplified MVP |
| ADR-006 | `get-reading-view` | Metadata storage | Display fields | Immersive reading |

---

## 🔄 Migration Strategy

### **Phase 1: Core Updates (Immediate)**
1. Update type definitions for multiple references
2. Modify entity management functions
3. Update prompt construction for multiple references
4. Implement sequential processing logic

### **Phase 2: Enhanced Features (Near-term)**
1. Content-based chapter detection
2. Advanced reference image blending
3. Improved entity evolution tracking
4. Quality-based reference selection

### **Phase 3: Advanced Features (Future)**
1. User-specified scene selection
2. Advanced image versioning with history
3. Collaborative editing features
4. Performance optimizations

---

## 📈 Success Metrics

These decisions will be evaluated based on:

- **Visual Consistency**: Improved character/location consistency across chapters
- **Processing Quality**: Better automatic scene selection and content organization
- **User Experience**: Cleaner reading interface and more intuitive regeneration
- **Technical Performance**: Maintainable sequential processing without significant slowdown
- **Flexibility**: Architecture supports future enhancements without major rewrites

---

## 🔗 Related Documents

- [README.md](./README.md) - Overall system architecture
- [shared/types.ts](./shared/types.ts) - Type definitions implementing these decisions
- [functions/core/](./functions/core/) - Core function implementations
- [schema.sql](./schema.sql) - Database schema reflecting these decisions

---

**Last Updated**: December 2024  
**Next Review**: After MVP completion and initial user feedback