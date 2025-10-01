# Implementation Plan: Reader Enhance Flow

**Branch**: `001-reader-enhance-flow` | **Date**: 2025-09-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-reader-enhance-flow/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → Feature spec loaded successfully
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detected Project Type: web (React frontend + Supabase backend)
   → Set Structure Decision: Option 2 (Web application)
3. Evaluate Constitution Check section below
   → No violations detected
   → Update Progress Tracking: Initial Constitution Check PASS
4. Execute Phase 0 → research.md
   → Research complete, no NEEDS CLARIFICATION items
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
   → Design artifacts generated
6. Re-evaluate Constitution Check section
   → No new violations
   → Update Progress Tracking: Post-Design Constitution Check PASS
7. Plan Phase 2 → Task generation approach described
8. STOP - Ready for /tasks command
```

## Summary
Readers need a simple, automated way to enhance text stories with AI-generated illustrations. The solution provides a streamlined upload/paste interface, automatic scene detection, image generation per scene, and private storage in My Shelf. Users can accept/retry individual images and save enhanced copies for private reading.

## Technical Context
**Language/Version**: TypeScript 5.x / Node.js 18+
**Primary Dependencies**: React 18, Vite, Supabase, TailwindCSS
**Storage**: Supabase (PostgreSQL + Storage buckets)
**Testing**: Vitest + React Testing Library
**Target Platform**: Web browser (modern Chrome, Firefox, Safari)
**Project Type**: web - React frontend + Supabase backend
**Performance Goals**: <2s page load, <500ms scene detection per 1k words
**Constraints**: Max 50k words input, 2MB file size, 30 scenes per copy
**Scale/Scope**: 1k+ concurrent users, 10k+ enhanced copies

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 2 (frontend, supabase functions)
- Using framework directly? Yes (React, Supabase client)
- Single data model? Yes (EnhancedCopy with nested scenes)
- Avoiding patterns? Yes (no unnecessary abstractions)

**Architecture**:
- EVERY feature as library? Yes (feature modules in /features/)
- Libraries listed:
  - file-upload: Handle text/file uploads
  - scene-extraction: Parse and detect scenes
  - image-generation: Generate AI images
  - book-management: Manage enhanced copies
- CLI per library: N/A (web application)
- Library docs: Component documentation in code

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? Yes
- Git commits show tests before implementation? Yes
- Order: Contract→Integration→E2E→Unit strictly followed? Yes
- Real dependencies used? Supabase test instance
- Integration tests for: API endpoints, file uploads, storage
- FORBIDDEN: Implementation before test ✓

**Observability**:
- Structured logging included? Yes (debug_logs table)
- Frontend logs → backend? Yes (via Supabase functions)
- Error context sufficient? Yes (user actions, file info)

**Versioning**:
- Version number assigned? 1.0.0
- BUILD increments on every change? Yes
- Breaking changes handled? N/A (first version)

## Project Structure

### Documentation (this feature)
```
specs/001-reader-enhance-flow/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 2: Web application (React + Supabase)
frontend/
├── src/
│   ├── features/
│   │   ├── file-upload/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── services/
│   │   ├── scene-extraction/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── services/
│   │   ├── image-generation/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── services/
│   │   └── book-management/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── services/
│   ├── shared/
│   │   ├── ui-components/
│   │   └── utilities/
│   └── pages/
│       ├── enhance/
│       └── shelf/
└── tests/
    ├── integration/
    └── unit/

supabase/
├── functions/
│   ├── extract-scenes/
│   └── generate-image/
└── migrations/
```

**Structure Decision**: Option 2 - Web application structure (frontend + Supabase backend)

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - All technical choices defined based on existing codebase
   - No NEEDS CLARIFICATION items remain

2. **Research completed**:
   - File upload handling: React-dropzone + Supabase storage
   - Scene extraction: Edge function with text chunking algorithm
   - Image generation: SDXL via edge function
   - State management: React hooks + context

3. **Consolidate findings** in `research.md`:
   - Decision: Supabase edge functions for heavy processing
   - Rationale: Serverless, scalable, integrated with database
   - Alternatives considered: Client-side processing (rejected: performance)

**Output**: research.md with implementation approach defined

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - EnhancedCopy: Main entity with nested chapters/scenes
   - Scene: Text excerpt with generated image
   - Upload: File metadata and storage reference

2. **Generate API contracts** from functional requirements:
   - POST /api/enhance/upload - File upload endpoint
   - POST /api/enhance/extract-scenes - Scene detection
   - POST /api/enhance/generate-image - Image generation
   - GET /api/shelf/copies - List enhanced copies
   - GET /api/shelf/copies/:id - Get specific copy

3. **Generate contract tests** from contracts:
   - Upload file size validation tests
   - Scene extraction boundary tests
   - Image generation retry tests

4. **Extract test scenarios** from user stories:
   - Upload and enhance story flow
   - Accept/retry image interactions
   - Save to My Shelf validation

5. **Update CLAUDE.md incrementally**:
   - Add Reader Enhance feature documentation
   - Update development commands
   - Add new feature structure

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Generate tasks from Phase 1 design docs
- Each API endpoint → contract test task [P]
- Each entity → model/migration task [P]
- Each user story → integration test task
- UI components → component tasks with tests

**Ordering Strategy**:
- Database migrations first
- API endpoints next (with tests)
- UI components last
- Mark [P] for parallel execution

**Estimated Output**: 30-35 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*No violations - section empty*

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*