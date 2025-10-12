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

### Phase 4: Service Layer File Naming & Layering ✅ COMPLETED
- [x] **Rename all service files to kebab-case**
  - All 21 files in `services/enhancement/` renamed to kebab-case
  - `EnhancementOrchestrator.ts` → `enhancement-orchestrator.ts`
  - `AnchorService.ts` → `anchor.service.ts`
  - `CharacterRegistry.ts` → `character-registry.ts`
  - `ImageGenerator.ts` → `image-generator.ts`
  - All internal imports updated
  - All builds and tests passing

- [x] **Reorganize services/enhancement/ with proper layering**
  ```
  services/enhancement/
  ├── services/            # Application services (orchestrators, domain logic)
  ├── adapters/            # External integrations (AI clients, storage)
  │   └── ai-clients/      # AI provider implementations
  └── factory/             # Dependency injection
  ```
  - Moved all AI clients to `adapters/ai-clients/`
  - Moved storage and image generation to `adapters/`
  - Kept orchestrators and business logic in `services/`
  - Factory for wiring dependencies in `factory/`

### Phase 5: Tooling & Linting ✅ COMPLETED
- [x] **Set up pre-commit hooks**
  - Installed husky and lint-staged
  - Auto-run linting on staged files
  - Prevent commits with linting errors

- [x] **Add import ordering linting**
  - Installed `eslint-plugin-simple-import-sort` (ESLint 9 compatible)
  - Enforces consistent import order automatically
  - Sorted all imports across entire codebase
  - Runs automatically on commit via lint-staged

### Phase 6: Architecture Improvements (Future PR)
- [ ] **Create API abstraction layer**
  - Create `shared/api/` directory
  - Move `lib/supabase.ts` to `shared/api/supabase/client.ts`
  - Create interfaces: `StoryAPI`, `ChapterAPI`, `EnhancementAPI`
  - Decouple features from Supabase implementation

- [ ] **Replace manual routing with react-router-dom**
  - Already have `react-router-dom` installed but not using it
  - Currently using manual route state management (~100+ lines)
  - Use `createBrowserRouter` with proper route definitions

- [ ] **Create Architecture Decision Records (ADRs)**
  - Document in `docs/architecture/` directory
  - Record key architectural decisions and rationale

### Phase 7: Documentation Consolidation (Future PR)
- [ ] **Reorganize specs/ directory**
  - Current: `specs/000-navigation-entry-flow/`, `specs/001-reader-enhance-flow/`, etc.
  - Reorganize into: `specs/features/` and `specs/business/`
  - Better separation of concerns

- [ ] **Consolidate documentation structure**
  - Ensure all docs are properly linked from `docs/README.md`
  - Create `docs/development/` subdirectory
  - Move testing docs to `docs/development/testing.md`

### Phase 8: RunPod SDXL Integration ✅ COMPLETED
- [x] **Create Supabase Edge Function for secure RunPod API calls**
  - Created `supabase/functions/generate-image/index.ts`
  - Handles job submission, polling with backoff, and output parsing
  - API keys kept server-side for security (not exposed to browser)
  - Returns base64-encoded images to frontend

- [x] **Implement RunPodImageAIClient**
  - Created `frontend/src/services/enhancement/adapters/ai-clients/runpod-image-ai-client.ts`
  - Implements `IImageAIClient` interface
  - Calls Supabase Edge Function instead of RunPod directly
  - Converts base64 response to data URLs

- [x] **Update factory to use RunPod client**
  - Modified `create-enhancement-orchestrator.ts` to use `RunPodImageAIClient`
  - Replaced `StubImageAIClient` with production-ready implementation

- [x] **Write comprehensive unit tests**
  - Created `tests/unit/core/enhancement/runpod-image-ai-client.spec.ts`
  - Tests Edge Function invocation, error handling, and data URL conversion
  - All tests passing (6/6)

- [x] **Update environment configuration**
  - Updated `.env.example` with server-side RunPod credentials
  - Documented that `RUNPOD_API_KEY` and `RUNPOD_ENDPOINT_ID` are NOT prefixed with `VITE_`
  - Credentials set in Supabase Edge Function secrets

## Security & Error Handling
- [ ] **Do not expose internal errors to the user** - Currently showing raw database error messages like "new row violates row-level security policy". Should show user-friendly messages and log technical details server-side.
