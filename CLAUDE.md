# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL: NO MOCKING APPROACH

**NEVER USE MOCKING OR LOCALSTORAGE FOR DATABASE OPERATIONS**

The user has explicitly stated multiple times to NOT use mocking approaches. Always use real Supabase database operations. If there are RLS policy issues, fix the policies or permissions, do not work around them with mocks.

This applies to:
- Enhanced copies saving
- Job creation and tracking
- Any database operations

Use real Supabase client calls only. Fix authentication and RLS policies properly.

## Project Overview

Novel Enchant is an AI-powered storytelling platform that transforms written novels into immersive visual experiences. The platform automatically extracts key scenes from uploaded books, generates stunning visual representations using AI image generation, and creates an interactive gallery for readers to explore their favorite stories visually.

## Architecture

### Frontend Structure

- **React + TypeScript + Vite** application in `frontend/`
- **Feature-based organization** with kebab-case folder structure:
  - `src/app/` - Main application component
  - `src/features/file-upload/` - Book upload functionality
  - `src/features/book-management/` - Book library and processing
  - `src/features/scene-extraction/` - AI scene detection and extraction
  - `src/features/image-generation/` - AI image generation from scenes
  - `src/shared/ui-components/` - Reusable UI components
  - `src/shared/utilities/` - Shared utility functions
  - `src/shared/type-definitions/` - TypeScript type definitions
- **Tailwind CSS** for styling and responsive design

### Core Features

- **File Upload**: Support for various book formats (PDF, EPUB, TXT)
- **Text Processing**: AI-powered text analysis and scene extraction
- **Scene Detection**: Intelligent identification of key narrative moments
- **Image Generation**: AI-generated visuals using SDXL/Stable Diffusion
- **Gallery View**: Interactive display of book scenes with generated images
- **Book Management**: Library for managing uploaded books and generated content
- **Reader Enhance** (NEW): Simple flow for readers to enhance stories with auto-generated images
  - Entry from My Shelf only (no navbar item)
  - Automatic scene detection (3-5 scenes per 1k words)
  - One-click accept/retry for each image
  - Private enhanced copies saved to My Shelf

### State Management

- React contexts for global state (auth, upload progress, generation status)
- Feature-specific hooks for data fetching and mutations
- No global store like Redux - state kept close to components
- Complex UI uses `useReducer` pattern

### Data Layer

- **Supabase** for database, auth, and serverless functions
- Edge functions for complex operations:
  - `ingest-text`: Process uploaded books and extract text content
  - `extract-scenes`: AI-powered scene detection and extraction
  - `track-entities`: Character and entity tracking across scenes
  - `generate-image`: AI image generation using SDXL/Stable Diffusion
- TypeScript types generated from Supabase schema

## Recent Changes

### AI-Powered Story Illustration System (Spec 003) - Mock Services Implemented ✅
- **Core Features**:
  - Auto-generate 2-3 illustrations per chapter with character consistency
  - Manual image insertion at specific cursor positions
  - Create images from highlighted text selections
  - Character registry with candidate management (confirm/ignore/merge)
  - Retry/accept mechanisms for generated images
- **Implementation Status**:
  - ✅ MockEnhancementService - Auto-enhance, manual insert, retry workflows
  - ✅ MockCharacterService - Character detection, resolution, consistency checking
  - ✅ MockAnchorService - Position validation, anchor management, text reordering
  - ✅ Contract tests for all service interfaces (majority passing)
  - ✅ Integration tests for complete user workflows
  - 🔄 React hooks and context providers (next: T016-T018)
  - 🔄 UI components and integration (pending)
- **Mock Implementation Details**:
  - Deterministic placeholders using picsum.photos with seeded randomization
  - Character names follow "Character A/B/C" patterns for UX consistency
  - Realistic processing delays and quality scores
  - Interface-compatible for future AI service swapping
- **Key Entities**:
  - `Work` - Author's complete story with style preferences
  - `Chapter` - Individual chapter with text content
  - `Character` - Named entity with consistency tracking
  - `Anchor` - Stable position marker for image placement
  - `Image` - Generated illustration with quality scores
  - `Prompt` - Text description with character references
- **Service Interfaces**:
  - `EnhancementService` - Auto/manual generation with retry
  - `CharacterService` - Detection, resolution, consistency
  - `AnchorService` - Position tracking and validation

### Reader Enhance Feature (Spec 001)
- **Routes**:
  - `/shelf` - My Shelf listing (enhanced copies + bookmarks)
  - `/enhance` - Reader enhance flow (paste/upload → process → save)
  - `/shelf/:copyId` - Reading view for enhanced copies
- **API Endpoints**:
  - `POST /api/enhance/start` - Begin enhancement job
  - `GET /api/enhance/status` - Check job progress
  - `POST /api/enhance/accept` - Accept generated image
  - `POST /api/enhance/retry` - Regenerate scene image
  - `POST /api/shelf/save` - Save completed enhancement
- **New Tables**:
  - `enhanced_copies` - Stores reader's enhanced stories
  - `enhance_jobs` - Tracks enhancement progress
  - `uploads` - File upload metadata

## Development Commands

### Frontend Development

```bash
cd frontend
npm ci                # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode
```

### Root Level

```bash
npm ci               # Install root dependencies (Supabase CLI)
```

### Supabase Development

```bash
supabase start       # Start local Supabase instance
supabase stop        # Stop local Supabase instance
supabase db reset    # Reset local database to migrations
supabase gen types typescript --local > frontend/src/types/supabase.ts  # Generate types
```

## Testing

- **Frontend**: Vitest + React Testing Library
- **Location**: `frontend/tests/`
- **Run**: `npm run test` (from frontend directory)
- **Watch**: `npm run test:watch`

## Debugging and Troubleshooting

### Database Issues
- Check RLS policies if queries return empty results
- Use `debug_logs` table for application logging
- Verify user authentication and JWT tokens
- Test with service role key for admin operations

### Edge Function Debugging
- Check function logs in Supabase dashboard
- Verify environment variables are set correctly
- Test locally with `supabase functions serve`
- Use `console.log` for debugging (appears in logs)

### File Upload Issues
- Verify storage bucket permissions
- Check file path naming conventions (UUID-based)
- Ensure proper cleanup of old files
- Test signed URL generation and expiration

### Transcription Issues
- Check credit availability before transcription
- Verify audio file format compatibility
- Monitor transcription status updates
- Check edge function logs for OpenAI errors

## Key Architecture Patterns

### Component Organization

- UI components in `src/components/ui/`
- Feature components in `src/features/[feature]/components/`
- Hooks in `src/features/[feature]/hooks/`
- Services in `src/features/[feature]/services/`

### Data Fetching

- Custom hooks for each feature (e.g., `useTreeData`, `useMemoryData`)
- Supabase client in `src/lib/supabase-client.ts`
- Direct queries via `supabase.from()`
- Edge functions called via `fetch` for complex operations

### Authentication

- `AuthProvider` wraps the app and manages auth state
- `ProtectedRoute` component for route protection
- User session stored in React context
- Automatic user record creation on sign-in

### Styling

- Tailwind CSS with custom configuration
- Component variants using `class-variance-authority`
- Radix UI primitives with custom styling
- Theme switching with `next-themes`

## Environment Setup

Required environment variables in `frontend/.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Supabase Integration

### Edge Functions

- `transcribe-audio`: Audio transcription service
- `create-checkout-session`: Stripe checkout creation
- `create-stripe-portal-session`: Stripe billing portal
- `stripe-webhook`: Stripe webhook processing

### Database Schema

The application uses **17 main tables** with a well-structured relationship system:

#### Core Tables
- **`users`**: Central user identity (links to Supabase Auth)
- **`profiles`**: Family member profiles with rich content blocks (JSON)
- **`content`**: Stories and memories with rich text content
- **`trees`**: Family tree containers with metadata

#### Relationship Tables
- **`unions`**: Represents marriages/partnerships between profiles
- **`union_profiles`**: Links profiles to unions as parents/partners  
- **`union_children`**: Links children to their parents' unions
- **`tree_profiles`**: Junction table for profiles in trees
- **`content_profiles`**: Links stories to the profiles they're about

#### Media Tables
- **`profile_images`**: Multiple images per profile with primary designation
- **`content_images`**: Images embedded in stories with positioning
- **`content_audio`**: Audio recordings with transcription capabilities

#### Billing Tables
- **`subscriptions`**: User subscriptions with transcription credit tracking
- **`user_preferences`**: User settings stored as flexible JSON

#### Utility Tables
- **`profile_pages`**: Extended profile pages beyond main profile
- **`debug_logs`**: Application logging for debugging

### Database Functions

- **`save_tree_structure`**: Atomically saves complex tree structures with all relationships
- **`prune_unions_for_tree`**: Cleanup function to remove orphaned unions from trees

### Storage Buckets

- **`profile-images`**: Profile photos and avatars
- **`content-images`**: Images in stories and content  
- **`tree-images`**: Tree cover images and visuals
- **`audio`**: Audio recordings for transcription

## Common Development Patterns

### Adding New Features

1. Create feature directory in `src/features/`
2. Add components, hooks, and services subdirectories
3. Create feature-specific types in `types.ts`
4. Add routes in main router
5. Update navigation if needed

### Working with Profiles

- Profile blocks are stored as JSON arrays with structured content
- Block types: text, image, timeline, story, tag, heading, divider
- Images uploaded to Supabase storage with UUID naming
- Multiple images per profile with primary designation
- Profile pages extend beyond main profile with additional blocks

### Family Tree Management

- Complex relationship modeling using unions system
- Unions represent marriages/partnerships between profiles
- Union-based parent-child relationships support multiple parents
- Atomic tree saving via `save_tree_structure` database function
- Deduplication logic prevents duplicate relationships
- ReactFlow for interactive tree display with Dagre layout

### Content and Story Management

- Rich text content stored as JSON (Lexical editor format)
- Stories can be linked to multiple profiles via junction table
- Content images stored with positioning data
- Tags stored as string arrays for flexible categorization
- Privacy controls with `is_private` flag

### Audio and Transcription

- Recording via browser MediaRecorder API
- Transcription through OpenAI Whisper via edge functions
- Dual credit system: free and paid transcription minutes
- Monthly reset for free credits, purchased credits persist
- Audio storage in Supabase buckets with transcript storage
- Playback with wavesurfer.js integration

### Billing and Subscriptions

- Stripe integration for subscription management
- Two-tier system: free and plus plans
- Transcription credit tracking and automatic deduction
- Webhook handlers for subscription events
- Customer portal for billing management

# Claude Code Guidelines by Sabrina Ramonov

## Implementation Best Practices

### 0 — Purpose

These rules ensure maintainability, safety, and developer velocity.
**MUST** rules are enforced by CI; **SHOULD** rules are strongly recommended.

---

### 1 — Before Coding

- **BP-1 (MUST)** Ask the user clarifying questions.
- **BP-2 (SHOULD)** Draft and confirm an approach for complex work.
- **BP-3 (SHOULD)** If ≥ 2 approaches exist, list clear pros and cons.

---

### 2 — While Coding

- **C-1 (MUST)** Follow TDD: scaffold stub -> write failing test -> implement.
- **C-2 (MUST)** Name functions with existing domain vocabulary for consistency.
- **C-3 (SHOULD NOT)** Introduce classes when small testable functions suffice.
- **C-4 (SHOULD)** Prefer simple, composable, testable functions.
- **C-5 (MUST)** Prefer branded `type`s for IDs
  ```ts
  type UserId = Brand<string, "UserId">; // ✅ Good
  type UserId = string; // ❌ Bad
  ```
- **C-6 (MUST)** Use `import type { … }` for type-only imports.
- **C-7 (SHOULD NOT)** Add comments except for critical caveats; rely on self‑explanatory code.
- **C-8 (SHOULD)** Default to `type`; use `interface` only when more readable or interface merging is required.
- **C-9 (SHOULD NOT)** Extract a new function unless it will be reused elsewhere, is the only way to unit-test otherwise untestable logic, or drastically improves readability of an opaque block.

---

### 3 — Testing

- **T-1 (MUST)** For a simple function, colocate unit tests in `*.spec.ts` in same directory as source file.
- **T-2 (MUST)** For React components, add tests in `frontend/tests/` directory.
- **T-3 (MUST)** ALWAYS separate pure-logic unit tests from DB-touching integration tests.
- **T-4 (SHOULD)** Prefer integration tests over heavy mocking.
- **T-5 (SHOULD)** Unit-test complex algorithms thoroughly.
- **T-6 (SHOULD)** Test the entire structure in one assertion if possible

  ```ts
  expect(result).toBe([value]); // Good

  expect(result).toHaveLength(1); // Bad
  expect(result[0]).toBe(value); // Bad
  ```

- **T-7 (MUST)** Mock Supabase client for component tests, test actual DB operations separately.

---

### 4 — Database

- **D-1 (MUST)** Use TypeScript types generated from Supabase schema via `supabase gen types typescript`.
- **D-2 (SHOULD)** Always handle potential null values from Supabase queries properly.
- **D-3 (MUST)** Use Row Level Security (RLS) policies for data protection - never bypass with service key in client code.
- **D-4 (SHOULD)** Use Supabase edge functions for complex database operations that require elevated permissions.

---

### 5 — Code Organization

- **O-1 (MUST)** Place shared utilities in `src/lib/` only if used by ≥ 2 features.
- **O-2 (SHOULD)** Keep feature-specific code within feature directories (`src/features/[feature]/`).

---

### 6 — Tooling Gates

- **G-1 (MUST)** `npm run lint` passes.
- **G-2 (MUST)** `npm run build` completes without errors.

---

### 7 - Git

- **GH-1 (MUST**) Use Conventional Commits format when writing commit messages: https://www.conventionalcommits.org/en/v1.0.0
- **GH-2 (SHOULD NOT**) Refer to Claude or Anthropic in commit messages.

---

## Writing Functions Best Practices

When evaluating whether a function you implemented is good or not, use this checklist:

1. Can you read the function and HONESTLY easily follow what it's doing? If yes, then stop here.
2. Does the function have very high cyclomatic complexity? (number of independent paths, or, in a lot of cases, number of nesting if if-else as a proxy). If it does, then it's probably sketchy.
3. Are there any common data structures and algorithms that would make this function much easier to follow and more robust? Parsers, trees, stacks / queues, etc.
4. Are there any unused parameters in the function?
5. Are there any unnecessary type casts that can be moved to function arguments?
6. Is the function easily testable without mocking core features (e.g. sql queries, redis, etc.)? If not, can this function be tested as part of an integration test?
7. Does it have any hidden untested dependencies or any values that can be factored out into the arguments instead? Only care about non-trivial dependencies that can actually change or affect the function.
8. Brainstorm 3 better function names and see if the current name is the best, consistent with rest of codebase.

IMPORTANT: you SHOULD NOT refactor out a separate function unless there is a compelling need, such as:

- the refactored function is used in more than one place
- the refactored function is easily unit testable while the original function is not AND you can't test it any other way
- the original function is extremely hard to follow and you resort to putting comments everywhere just to explain it

## Writing Tests Best Practices

When evaluating whether a test you've implemented is good or not, use this checklist:

1. SHOULD parameterize inputs; never embed unexplained literals such as 42 or "foo" directly in the test.
2. SHOULD NOT add a test unless it can fail for a real defect. Trivial asserts (e.g., expect(2).toBe(2)) are forbidden.
3. SHOULD ensure the test description states exactly what the final expect verifies. If the wording and assert don’t align, rename or rewrite.
4. SHOULD compare results to independent, pre-computed expectations or to properties of the domain, never to the function’s output re-used as the oracle.
5. SHOULD follow the same lint, type-safety, and style rules as prod code (prettier, ESLint, strict types).
6. SHOULD express invariants or axioms (e.g., commutativity, idempotence, round-trip) rather than single hard-coded cases whenever practical. Use `fast-check` library e.g.

```
import fc from 'fast-check';
import { describe, expect, test } from 'vitest';
import { getCharacterCount } from './string';

describe('properties', () => {
  test('concatenation functoriality', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        (a, b) =>
          getCharacterCount(a + b) ===
          getCharacterCount(a) + getCharacterCount(b)
      )
    );
  });
});
```

7. Unit tests for a function should be grouped under `describe(functionName, () => ...`.
8. Use `expect.any(...)` when testing for parameters that can be anything (e.g. variable ids).
9. ALWAYS use strong assertions over weaker ones e.g. `expect(x).toEqual(1)` instead of `expect(x).toBeGreaterThanOrEqual(1)`.
10. SHOULD test edge cases, realistic input, unexpected input, and value boundaries.
11. SHOULD NOT test conditions that are caught by the type checker.

## Code Organization

- `frontend/` - React + TypeScript + Vite application
  - `src/components/ui/` - Reusable UI components (Radix UI + Tailwind)
  - `src/features/` - Feature-based organization
    - `src/features/[feature]/components/` - Feature-specific components
    - `src/features/[feature]/hooks/` - Data fetching and state management hooks
    - `src/features/[feature]/services/` - Business logic and API calls
    - `src/features/[feature]/types.ts` - Feature-specific TypeScript types
  - `src/lib/` - Shared utilities and configurations
    - `src/lib/supabase-client.ts` - Supabase client configuration
  - `src/contexts/` - React contexts for global state
- `supabase/` - Supabase configuration and edge functions
  - `supabase/functions/` - Edge functions for serverless operations
  - `supabase/migrations/` - Database schema migrations

## Remember Shortcuts

Remember the following shortcuts which the user may invoke at any time.

### QNEW

When I type "qnew", this means:

```
Understand all BEST PRACTICES listed in CLAUDE.md.
Your code SHOULD ALWAYS follow these best practices.
```

### QPLAN

When I type "qplan", this means:

```
Analyze similar parts of the codebase and determine whether your plan:
- is consistent with rest of codebase
- introduces minimal changes
- reuses existing code
```

## QCODE

When I type "qcode", this means:

```
Implement your plan and make sure your new tests pass.
Always run tests to make sure you didn't break anything else.
Always run `npm run lint` to ensure code quality.
Always run `npm run build` to verify the build completes successfully.
```

### QCHECK

When I type "qcheck", this means:

```
You are a SKEPTICAL senior software engineer.
Perform this analysis for every MAJOR code change you introduced (skip minor changes):

1. CLAUDE.md checklist Writing Functions Best Practices.
2. CLAUDE.md checklist Writing Tests Best Practices.
3. CLAUDE.md checklist Implementation Best Practices.
```

### QCHECKF

When I type "qcheckf", this means:

```
You are a SKEPTICAL senior software engineer.
Perform this analysis for every MAJOR function you added or edited (skip minor changes):

1. CLAUDE.md checklist Writing Functions Best Practices.
```

### QCHECKT

When I type "qcheckt", this means:

```
You are a SKEPTICAL senior software engineer.
Perform this analysis for every MAJOR test you added or edited (skip minor changes):

1. CLAUDE.md checklist Writing Tests Best Practices.
```

### QUX

When I type "qux", this means:

```
Imagine you are a human UX tester of the feature you implemented.
Output a comprehensive list of scenarios you would test, sorted by highest priority.
```

### QGIT

When I type "qgit", this means:

```
Add all changes to staging, create a commit, and push to remote.

Follow this checklist for writing your commit message:
- SHOULD use Conventional Commits format: https://www.conventionalcommits.org/en/v1.0.0
- SHOULD NOT refer to Claude or Anthropic in the commit message.
- SHOULD structure commit message as follows:
<type>[optional scope]: <description>
[optional body]
[optional footer(s)]
- commit SHOULD contain the following structural elements to communicate intent:
fix: a commit of the type fix patches a bug in your codebase (this correlates with PATCH in Semantic Versioning).
feat: a commit of the type feat introduces a new feature to the codebase (this correlates with MINOR in Semantic Versioning).
BREAKING CHANGE: a commit that has a footer BREAKING CHANGE:, or appends a ! after the type/scope, introduces a breaking API change (correlating with MAJOR in Semantic Versioning). A BREAKING CHANGE can be part of commits of any type.
types other than fix: and feat: are allowed, for example @commitlint/config-conventional (based on the Angular convention) recommends build:, chore:, ci:, docs:, style:, refactor:, perf:, test:, and others.
footers other than BREAKING CHANGE: <description> may be provided and follow a convention similar to git trailer format.
```
