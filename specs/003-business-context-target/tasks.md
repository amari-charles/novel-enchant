# Tasks: AI-Powered Story Illustration System

**Input**: Design documents from `/specs/003-business-context-target/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: TypeScript 5.x, React 19.1, Vite, Tailwind CSS
   → Libraries: enhancement-engine, character-registry, anchor-manager
   → Structure: frontend/src/features/*, frontend/tests/*
2. Load design documents:
   → data-model.md: 6 entities (Work, Chapter, Character, Anchor, Image, Prompt)
   → contracts/: 4 files (enhancement-service, character-service, anchor-service, types)
   → research.md: Mock service patterns, React Context + useReducer approach
   → quickstart.md: 4 user scenarios for integration tests
3. Generate tasks by category:
   → Setup: feature structure, type definitions
   → Tests: contract tests [P], integration tests [P]
   → Core: mock services [P], hooks [P], components
   → Integration: context providers, UI integration
   → Polish: unit tests [P], error handling
4. Apply task rules:
   → Each contract file → contract test task [P]
   → Each entity → type definition [P]
   → Each user scenario → integration test [P]
   → Different files = parallel [P], same file = sequential
5. Order by dependencies: Setup → Tests → Core → Integration → Polish
6. Number sequentially T001-T035
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- All file paths are absolute from repository root

## Phase 3.1: Setup
- [ ] T001 Create feature directory structure: frontend/src/features/{enhancement-engine,character-registry,anchor-manager}
- [ ] T002 Create test directory structure: frontend/tests/{enhancement-engine,character-registry,anchor-manager}
- [ ] T003 [P] Copy shared types from contracts/types.ts to frontend/src/features/enhancement-engine/types.ts
- [ ] T004 [P] Copy character types to frontend/src/features/character-registry/types.ts
- [ ] T005 [P] Copy anchor types to frontend/src/features/anchor-manager/types.ts

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (One per service interface)
- [ ] T006 [P] Contract test for EnhancementService interface in frontend/tests/enhancement-engine/services/enhancement-service.contract.test.ts
- [ ] T007 [P] Contract test for CharacterService interface in frontend/tests/character-registry/services/character-service.contract.test.ts
- [ ] T008 [P] Contract test for AnchorService interface in frontend/tests/anchor-manager/services/anchor-service.contract.test.ts

### Integration Tests (One per user scenario from quickstart.md)
- [ ] T009 [P] Integration test for auto-generate chapter flow in frontend/tests/enhancement-engine/integration/auto-generate-flow.test.tsx
- [ ] T010 [P] Integration test for manual insert at cursor in frontend/tests/enhancement-engine/integration/manual-insert-flow.test.tsx
- [ ] T011 [P] Integration test for create from selection in frontend/tests/enhancement-engine/integration/highlight-insert-flow.test.tsx
- [ ] T012 [P] Integration test for character management flow in frontend/tests/character-registry/integration/character-management-flow.test.tsx

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Mock Services (One per contract file)
- [ ] T013 [P] MockEnhancementService implementation in frontend/src/features/enhancement-engine/services/MockEnhancementService.ts
- [ ] T014 [P] MockCharacterService implementation in frontend/src/features/character-registry/services/MockCharacterService.ts
- [ ] T015 [P] MockAnchorService implementation in frontend/src/features/anchor-manager/services/MockAnchorService.ts

### React Hooks (State management per feature)
- [ ] T016 [P] useEnhancement hook for enhancement state in frontend/src/features/enhancement-engine/hooks/useEnhancement.ts
- [ ] T017 [P] useCharacterRegistry hook for character state in frontend/src/features/character-registry/hooks/useCharacterRegistry.ts
- [ ] T018 [P] useAnchorManager hook for anchor state in frontend/src/features/anchor-manager/hooks/useAnchorManager.ts

### UI Components (Sequential - may share files)
- [ ] T019 AutoEnhanceButton component in frontend/src/features/enhancement-engine/components/AutoEnhanceButton.tsx
- [ ] T020 EnhancementContextMenu component in frontend/src/features/enhancement-engine/components/EnhancementContextMenu.tsx
- [ ] T021 InlineImageRenderer component in frontend/src/features/enhancement-engine/components/InlineImageRenderer.tsx
- [ ] T022 ImageRetryAcceptControls component in frontend/src/features/enhancement-engine/components/ImageRetryAcceptControls.tsx
- [ ] T023 CharacterCandidateCard component in frontend/src/features/character-registry/components/CharacterCandidateCard.tsx
- [ ] T024 CharacterRegistryPanel component in frontend/src/features/character-registry/components/CharacterRegistryPanel.tsx
- [ ] T025 AnchorPositionMarker component in frontend/src/features/anchor-manager/components/AnchorPositionMarker.tsx

## Phase 3.4: Integration
### Context Providers (State management integration)
- [ ] T026 EnhancementProvider context provider in frontend/src/features/enhancement-engine/contexts/EnhancementProvider.tsx
- [ ] T027 CharacterProvider context provider in frontend/src/features/character-registry/contexts/CharacterProvider.tsx

### UI Integration (Modify existing components)
- [ ] T028 Integrate enhancement features into existing ChapterEditor component
- [ ] T029 Add context menu handlers for cursor position and text selection
- [ ] T030 Update text rendering to support inline images with position tracking

## Phase 3.5: Polish
- [ ] T031 [P] Component unit tests for AutoEnhanceButton in frontend/tests/enhancement-engine/components/AutoEnhanceButton.test.tsx
- [ ] T032 [P] Component unit tests for CharacterCandidateCard in frontend/tests/character-registry/components/CharacterCandidateCard.test.tsx
- [ ] T033 [P] Error boundary for enhancement failures in frontend/src/features/enhancement-engine/components/EnhancementErrorBoundary.tsx
- [ ] T034 [P] Loading state components and progress indicators
- [ ] T035 Update CLAUDE.md with implementation status and new feature documentation

## Dependencies
```
Setup (T001-T005) → Tests (T006-T012) → Core (T013-T025) → Integration (T026-T030) → Polish (T031-T035)

Within Core:
- Services (T013-T015) must complete before hooks (T016-T018)
- Hooks must complete before components (T019-T025)
- Components before integration (T026-T030)
```

## Parallel Execution Examples

### Setup Types (T003-T005)
```bash
Task: "Copy shared types from contracts/types.ts to frontend/src/features/enhancement-engine/types.ts"
Task: "Copy character types to frontend/src/features/character-registry/types.ts"
Task: "Copy anchor types to frontend/src/features/anchor-manager/types.ts"
```

### Contract Tests (T006-T008)
```bash
Task: "Contract test for EnhancementService interface in frontend/tests/enhancement-engine/services/enhancement-service.contract.test.ts"
Task: "Contract test for CharacterService interface in frontend/tests/character-registry/services/character-service.contract.test.ts"
Task: "Contract test for AnchorService interface in frontend/tests/anchor-manager/services/anchor-service.contract.test.ts"
```

### Integration Tests (T009-T012)
```bash
Task: "Integration test for auto-generate chapter flow in frontend/tests/enhancement-engine/integration/auto-generate-flow.test.tsx"
Task: "Integration test for manual insert at cursor in frontend/tests/enhancement-engine/integration/manual-insert-flow.test.tsx"
Task: "Integration test for create from selection in frontend/tests/enhancement-engine/integration/highlight-insert-flow.test.tsx"
Task: "Integration test for character management flow in frontend/tests/character-registry/integration/character-management-flow.test.tsx"
```

### Mock Services (T013-T015)
```bash
Task: "MockEnhancementService implementation in frontend/src/features/enhancement-engine/services/MockEnhancementService.ts"
Task: "MockCharacterService implementation in frontend/src/features/character-registry/services/MockCharacterService.ts"
Task: "MockAnchorService implementation in frontend/src/features/anchor-manager/services/MockAnchorService.ts"
```

### Hooks (T016-T018)
```bash
Task: "useEnhancement hook for enhancement state in frontend/src/features/enhancement-engine/hooks/useEnhancement.ts"
Task: "useCharacterRegistry hook for character state in frontend/src/features/character-registry/hooks/useCharacterRegistry.ts"
Task: "useAnchorManager hook for anchor state in frontend/src/features/anchor-manager/hooks/useAnchorManager.ts"
```

## Task Details

### Mock Implementation Requirements
- All services return deterministic results based on input
- Use picsum.photos with seed for consistent image URLs
- Character names follow "Character A/B/C" pattern
- Quality scores: textAlign: 0.8, refSim: 0.7, verdict: 'ok'
- Realistic async delays (1-3 seconds) for UX validation

### Test Requirements
- Contract tests verify service interfaces match contracts exactly
- Integration tests follow quickstart.md scenarios step-by-step
- All tests must initially FAIL before implementation
- Use React Testing Library for component interactions
- Mock external dependencies (image loading, timers)

### Component Requirements
- Follow existing design system patterns from codebase
- Use TypeScript strict mode with proper type definitions
- Implement error boundaries for graceful failure handling
- Include loading states for all async operations
- Support keyboard navigation and ARIA labels

### Context Menu Requirements
- Right-click detection on text areas
- Cursor position tracking for precise image insertion
- Text selection detection for highlight-based generation
- Integration with existing chapter editor without breaking changes

## Success Criteria
- All contract tests pass with mock implementations
- Integration tests validate all 4 user scenarios from quickstart.md
- Images appear at exact cursor positions (character-level accuracy)
- Character consistency maintained across multiple generations
- UI responds within 100ms, mock services within 3 seconds
- Error handling prevents crashes and shows user-friendly messages
- Zero breaking changes to existing chapter editing functionality

## Notes
- Follow TDD strictly: RED (test fails) → GREEN (make it pass) → REFACTOR
- [P] tasks can run simultaneously - different files, no shared dependencies
- Sequential tasks modify same files or have direct dependencies
- All file paths are absolute from repository root for consistency
- Each task should be completable in 30-60 minutes by an experienced developer