# Tasks: Reader Enhance Flow

**Input**: Design documents from `/specs/001-reader-enhance-flow/`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓)

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Implementation plan loaded successfully
   → Extracted: React 18, Vite, Supabase, TailwindCSS stack
   → Structure: Web application (frontend + Supabase functions)
2. Load optional design documents:
   → data-model.md: EnhancedCopy, Chapter, Scene, Image entities extracted
   → contracts/: 5 API endpoints identified
   → research.md: Technical decisions for file upload, scene extraction loaded
3. Generate tasks by category:
   → Setup: Supabase migrations, feature directories, dependencies
   → Tests: 5 contract tests, 7 integration tests
   → Core: 3 entities, 4 services, 5 API endpoints
   → Integration: Supabase functions, storage, authentication
   → Polish: unit tests, performance validation, documentation
4. Apply task rules:
   → Contract tests marked [P] (different files)
   → Model tasks marked [P] (different entities)
   → API endpoints sequential (shared routes file)
5. Number tasks sequentially (T001-T035)
6. Generate dependency graph with TDD enforcement
7. Create parallel execution examples for [P] tasks
8. Validate task completeness: All requirements covered
9. Return: SUCCESS (35 tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Frontend**: `frontend/src/`
- **Supabase**: `supabase/functions/`, `supabase/migrations/`
- **Tests**: `frontend/tests/`

## Phase 3.1: Setup
- [ ] T001 Create Supabase migration for enhanced_copies table in `supabase/migrations/20250913000001_create_enhanced_copies.sql`
- [ ] T002 Create Reader Enhance feature directory structure in `frontend/src/features/reader-enhance/`
- [ ] T003 [P] Configure TypeScript types for EnhancedCopy entities in `frontend/src/features/reader-enhance/types.ts`
- [ ] T004 [P] Set up file upload utilities in `frontend/src/features/file-upload/services/file-upload.service.ts`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T005 [P] Contract test POST /api/enhance/start in `frontend/tests/contract/enhance-start.test.ts`
- [ ] T006 [P] Contract test GET /api/enhance/status in `frontend/tests/contract/enhance-status.test.ts`
- [ ] T007 [P] Contract test POST /api/enhance/accept in `frontend/tests/contract/enhance-accept.test.ts`
- [ ] T008 [P] Contract test POST /api/enhance/retry in `frontend/tests/contract/enhance-retry.test.ts`
- [ ] T009 [P] Contract test POST /api/shelf/save in `frontend/tests/contract/shelf-save.test.ts`
- [ ] T010 [P] Integration test: paste text enhancement flow in `frontend/tests/integration/enhance-paste-flow.test.ts`
- [ ] T011 [P] Integration test: file upload enhancement flow in `frontend/tests/integration/enhance-file-flow.test.ts`
- [ ] T012 [P] Integration test: accept/retry image interaction in `frontend/tests/integration/image-review-flow.test.ts`
- [ ] T013 [P] Integration test: save to My Shelf flow in `frontend/tests/integration/save-to-shelf-flow.test.ts`
- [ ] T014 [P] Integration test: enhanced copy reading view in `frontend/tests/integration/reading-view.test.ts`
- [ ] T015 [P] Integration test: rate limiting and error handling in `frontend/tests/integration/error-handling.test.ts`
- [ ] T016 [P] Integration test: file size and word count limits in `frontend/tests/integration/validation-limits.test.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Database & Models
- [ ] T017 [P] EnhancedCopy data access layer in `frontend/src/features/book-management/services/enhanced-copy.service.ts`
- [ ] T018 [P] Scene data models and validation in `frontend/src/features/scene-extraction/types/scene.types.ts`
- [ ] T019 [P] Image metadata handling in `frontend/src/features/image-generation/types/image.types.ts`

### Supabase Edge Functions
- [ ] T020 [P] Extract scenes edge function in `supabase/functions/extract-scenes/index.ts`
- [ ] T021 [P] Generate image edge function in `supabase/functions/generate-image/index.ts`
- [ ] T022 [P] Track enhancement job progress in `supabase/functions/track-job-progress/index.ts`

### Frontend Components & Services
- [ ] T023 File upload component for Reader Enhance in `frontend/src/features/file-upload/components/EnhanceUpload.tsx`
- [ ] T024 Scene extraction service in `frontend/src/features/scene-extraction/services/scene-extraction.service.ts`
- [ ] T025 Image generation service with retry logic in `frontend/src/features/image-generation/services/image-generation.service.ts`
- [ ] T026 Enhancement progress tracking hook in `frontend/src/features/reader-enhance/hooks/useEnhanceProgress.ts`
- [ ] T027 Image review component (accept/retry) in `frontend/src/features/reader-enhance/components/ImageReview.tsx`

### API Endpoints & Routes
- [ ] T028 Reader Enhance page component at `/enhance` route in `frontend/src/features/reader-enhance/pages/EnhancePage.tsx`
- [ ] T029 Enhanced copy reading view at `/shelf/:copyId` in `frontend/src/features/book-management/pages/ReadingView.tsx`
- [ ] T030 My Shelf updates to show enhanced copies in `frontend/src/features/book-management/components/MyShelf.tsx`

## Phase 3.4: Integration
- [ ] T031 Connect enhancement flow to Supabase storage for file uploads in `frontend/src/features/reader-enhance/services/enhance-integration.service.ts`
- [ ] T032 Add enhanced copy management to My Shelf service in `frontend/src/features/book-management/services/shelf.service.ts`
- [ ] T033 Implement authentication guards for all enhance endpoints in `frontend/src/features/reader-enhance/guards/auth.guard.ts`
- [ ] T034 Add error handling and user feedback throughout enhance flow in `frontend/src/features/reader-enhance/utils/error-handler.ts`

## Phase 3.5: Polish
- [ ] T035 [P] Unit tests for scene extraction algorithms in `frontend/tests/unit/scene-extraction.test.ts`
- [ ] T036 [P] Unit tests for file upload validation in `frontend/tests/unit/file-validation.test.ts`
- [ ] T037 [P] Unit tests for image generation retry logic in `frontend/tests/unit/image-retry.test.ts`
- [ ] T038 Performance validation: scene detection <500ms per 1k words in `frontend/tests/performance/scene-performance.test.ts`
- [ ] T039 Accessibility testing: alt text and keyboard navigation in `frontend/tests/accessibility/enhance-a11y.test.ts`
- [ ] T040 [P] Update CLAUDE.md with Reader Enhance development notes
- [ ] T041 Run quickstart.md validation scenarios
- [ ] T042 Code review and refactoring for maintainability

## Dependencies
**Critical Path:**
- Setup (T001-T004) before everything
- All tests (T005-T016) before ANY implementation (T017+)
- Models (T017-T019) before services (T020-T026)
- Services before components (T023, T027-T030)
- Core implementation before integration (T031-T034)
- Everything before polish (T035-T042)

**Blocking Relationships:**
- T001 (migration) blocks T017 (data access)
- T002 (directory structure) blocks all frontend tasks
- T003 (types) blocks T018, T019 (model tasks)
- T020-T022 (edge functions) block T024-T025 (services)
- T026 (progress hook) blocks T027 (review component)
- T028-T030 (UI components) block T031-T032 (integration)

## Parallel Execution Examples

### Phase 3.2: All Contract Tests (T005-T009)
```bash
# Launch all contract tests simultaneously:
Task: "Contract test POST /api/enhance/start in frontend/tests/contract/enhance-start.test.ts"
Task: "Contract test GET /api/enhance/status in frontend/tests/contract/enhance-status.test.ts"
Task: "Contract test POST /api/enhance/accept in frontend/tests/contract/enhance-accept.test.ts"
Task: "Contract test POST /api/enhance/retry in frontend/tests/contract/enhance-retry.test.ts"
Task: "Contract test POST /api/shelf/save in frontend/tests/contract/shelf-save.test.ts"
```

### Phase 3.2: All Integration Tests (T010-T016)
```bash
# Launch integration tests in parallel:
Task: "Integration test: paste text enhancement flow in frontend/tests/integration/enhance-paste-flow.test.ts"
Task: "Integration test: file upload enhancement flow in frontend/tests/integration/enhance-file-flow.test.ts"
Task: "Integration test: accept/retry image interaction in frontend/tests/integration/image-review-flow.test.ts"
Task: "Integration test: save to My Shelf flow in frontend/tests/integration/save-to-shelf-flow.test.ts"
Task: "Integration test: enhanced copy reading view in frontend/tests/integration/reading-view.test.ts"
Task: "Integration test: rate limiting and error handling in frontend/tests/integration/error-handling.test.ts"
Task: "Integration test: file size and word count limits in frontend/tests/integration/validation-limits.test.ts"
```

### Phase 3.3: Model & Type Creation (T017-T019)
```bash
# Create data models in parallel:
Task: "EnhancedCopy data access layer in frontend/src/features/book-management/services/enhanced-copy.service.ts"
Task: "Scene data models and validation in frontend/src/features/scene-extraction/types/scene.types.ts"
Task: "Image metadata handling in frontend/src/features/image-generation/types/image.types.ts"
```

### Phase 3.3: Supabase Edge Functions (T020-T022)
```bash
# Create edge functions in parallel:
Task: "Extract scenes edge function in supabase/functions/extract-scenes/index.ts"
Task: "Generate image edge function in supabase/functions/generate-image/index.ts"
Task: "Track enhancement job progress in supabase/functions/track-job-progress/index.ts"
```

### Phase 3.5: Unit Tests (T035-T037)
```bash
# Run unit test creation in parallel:
Task: "Unit tests for scene extraction algorithms in frontend/tests/unit/scene-extraction.test.ts"
Task: "Unit tests for file upload validation in frontend/tests/unit/file-validation.test.ts"
Task: "Unit tests for image generation retry logic in frontend/tests/unit/image-retry.test.ts"
```

## Notes
- [P] tasks = different files, no shared dependencies
- **CRITICAL**: Verify ALL tests fail before starting ANY implementation
- Commit after each completed task
- Run `npm run lint` and `npm run build` after each phase
- Use quickstart.md for validation scenarios after T041

## Task Generation Rules Applied

1. **From Contracts**: 5 API endpoints → 5 contract tests [P]
2. **From Data Model**: 4 entities → model/type creation tasks [P]
3. **From User Stories**: 7 user scenarios → 7 integration tests [P]
4. **TDD Enforcement**: All 12 tests before any implementation
5. **Dependency Management**: Models → Services → Components → Integration
6. **File Isolation**: Tasks modifying same files are sequential, different files marked [P]

## Validation Checklist
*GATE: Checked before execution*

- [✓] All 5 contracts have corresponding contract tests (T005-T009)
- [✓] All 4 entities have model/type tasks (T003, T017-T019)
- [✓] All 12 tests come before implementation (T005-T016 before T017+)
- [✓] Parallel tasks truly independent (different files, no shared state)
- [✓] Each task specifies exact file path with frontend/supabase prefix
- [✓] No [P] task modifies same file as another [P] task
- [✓] TDD cycle enforced: RED (failing tests) before GREEN (implementation)

---

**Ready for execution. Total: 42 tasks with 12 parallel groups.**
**Estimated timeline: 2-3 weeks with proper TDD discipline.**