# TODO

## Active Refactoring (In Progress)

### Phase 3: Repository Extraction and File Naming ✅ COMPLETED
- [x] **Extract repositories from enhancement to shared infrastructure**
  - Moved `services/enhancement/repositories/*.ts` → `lib/repositories/*.ts`
  - Repositories are app-wide data access layer, not enhancement-specific
  - Fixed wrong dependency: Features now → Repositories (direct)
  - Used `git mv` to preserve history

- [x] **Rename repository files to kebab-case**
  - `StoryRepository.ts` → `story.repository.ts`
  - `IStoryRepository.ts` → `story.repository.interface.ts`
  - Applied to all 14 repository files

- [x] **Update import paths**
  - Updated 5 feature files and 4 service files
  - Changed from: `@/services/enhancement/repositories/StoryRepository`
  - Changed to: `@/lib/repositories/story.repository`
  - All builds and tests passing

### Phase 4: Service Layer File Naming ✅ COMPLETED (Partial)
- [x] **Rename all service files to kebab-case**
  - All 21 files in `services/enhancement/` renamed to kebab-case
  - `EnhancementOrchestrator.ts` → `enhancement-orchestrator.ts`
  - `AnchorService.ts` → `anchor.service.ts`
  - `CharacterRegistry.ts` → `character-registry.ts`
  - `ImageGenerator.ts` → `image-generator.ts`
  - All internal imports updated
  - All builds and tests passing

- [ ] **Reorganize services/enhancement/ with proper layering** (Future PR)
  ```
  services/enhancement/
  ├── domain/              # Pure business logic
  ├── services/            # Application services
  ├── repositories/        # (moved to lib/)
  ├── adapters/            # External integrations (AI, storage)
  └── factory/             # Dependency injection
  ```

### Phase 5: Architecture Improvements (Future PR)
- [ ] **Create API abstraction layer**
  - Create `shared/api/` directory
  - Move `lib/supabase.ts` to `shared/api/supabase/client.ts`
  - Create interfaces: `StoryAPI`, `ChapterAPI`, `EnhancementAPI`
  - Decouple features from Supabase implementation

- [ ] **Replace manual routing with react-router-dom**
  - Already have `react-router-dom` installed but not using it
  - Currently using manual route state management (~100+ lines)
  - Use `createBrowserRouter` with proper route definitions

- [ ] **Set up pre-commit hooks**
  - Install husky and lint-staged
  - Auto-run linting on staged files
  - Prevent commits with linting errors

- [ ] **Add import ordering linting**
  - Install `eslint-plugin-import`
  - Enforce consistent import order (React, external, internal, relative)

- [ ] **Create Architecture Decision Records (ADRs)**
  - Document in `docs/architecture/` directory
  - Record key architectural decisions and rationale

### Phase 6: Documentation Consolidation (Future PR)
- [ ] **Reorganize specs/ directory**
  - Current: `specs/000-navigation-entry-flow/`, `specs/001-reader-enhance-flow/`, etc.
  - Reorganize into: `specs/features/` and `specs/business/`
  - Better separation of concerns

- [ ] **Consolidate documentation structure**
  - Ensure all docs are properly linked from `docs/README.md`
  - Create `docs/development/` subdirectory
  - Move testing docs to `docs/development/testing.md`

## Security & Error Handling
- [ ] **Do not expose internal errors to the user** - Currently showing raw database error messages like "new row violates row-level security policy". Should show user-friendly messages and log technical details server-side.
