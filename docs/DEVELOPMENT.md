# Development Guide

Welcome to Novel Enchant! This guide will help you get started with development.

## Overview

Novel Enchant is an AI-powered storytelling platform that transforms written novels into immersive visual experiences. The platform automatically extracts key scenes from uploaded books, generates stunning visual representations using AI image generation, and creates an interactive reading experience.

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase CLI (installed via root `npm ci`)

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repo-url>
   cd novel-enchant
   npm ci                    # Install Supabase CLI
   cd frontend
   npm ci                    # Install frontend dependencies
   ```

2. **Start local Supabase:**
   ```bash
   supabase start           # Start local Supabase instance
   ```

3. **Run frontend:**
   ```bash
   cd frontend
   npm run dev              # Start development server (http://localhost:5173)
   ```

### Development Commands

**Frontend:**
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode
```

**Supabase:**
```bash
supabase start       # Start local Supabase instance
supabase stop        # Stop local Supabase instance
supabase db reset    # Reset local database to migrations
supabase gen types typescript --local > frontend/src/types/supabase.ts  # Generate types
```

## Architecture

### Frontend Structure

The frontend uses **React + TypeScript + Vite** with a feature-based organization:

```
frontend/
├── src/
│   ├── app/                          # Main application component
│   ├── features/                     # Feature-based organization (kebab-case)
│   │   ├── file-upload/              # Book upload functionality
│   │   ├── book-management/          # Book library and processing
│   │   ├── scene-extraction/         # AI scene detection
│   │   └── image-generation/         # AI image generation
│   ├── shared/
│   │   ├── ui-components/            # Reusable UI components
│   │   ├── utilities/                # Shared utility functions
│   │   └── type-definitions/         # TypeScript type definitions
│   └── main.tsx
```

### Backend Structure

Supabase provides database, auth, and serverless Edge Functions:

```
supabase/
├── functions/                        # Edge Functions
│   ├── ingest-text/                  # Process uploaded books
│   ├── extract-scenes/               # AI-powered scene detection
│   ├── track-entities/               # Character and entity tracking
│   └── generate-image/               # AI image generation (SDXL)
└── migrations/                       # Database schema migrations
```

## Core Concepts

### Feature Organization

Each feature follows a consistent structure:
- `components/` - Feature-specific React components
- `hooks/` - Data fetching and state management
- `services/` - Business logic and API calls
- `types.ts` - Feature-specific TypeScript types

### State Management

- React contexts for global state (auth, upload progress)
- Feature-specific hooks for data fetching
- `useReducer` pattern for complex UI state
- No global store (Redux, etc.) - keep state close to components

### Data Layer

- **Supabase client** in `src/lib/supabase-client.ts`
- Direct queries via `supabase.from()` for simple operations
- Edge Functions (via `fetch`) for complex operations
- TypeScript types generated from Supabase schema

## Testing

### Unit Tests

- **Framework**: Vitest + React Testing Library
- **Location**: `frontend/tests/`
- **Run**: `npm run test` (from frontend directory)
- **Watch mode**: `npm run test:watch`

### Test Guidelines

- Separate pure-logic unit tests from DB-touching integration tests
- Mock Supabase client for component tests
- Test actual DB operations separately
- Use property-based testing with `fast-check` when appropriate

See `CLAUDE.md` for detailed testing best practices.

## Code Quality

### Linting and Type Checking

```bash
npm run lint         # Run ESLint
npm run build        # Verify build and type checking
```

### Code Style

- Follow existing domain vocabulary for naming consistency
- Prefer simple, composable, testable functions
- Use branded types for IDs: `type UserId = Brand<string, "UserId">`
- Use `import type { ... }` for type-only imports
- Default to `type` over `interface`

See `CLAUDE.md` for comprehensive code guidelines.

## Database

### Schema

The database uses TypeScript types generated from Supabase schema:

```bash
supabase gen types typescript --local > frontend/src/types/supabase.ts
```

### Key Tables

- `enhanced_copies` - Reader's enhanced stories
- `enhance_jobs` - Enhancement progress tracking
- `uploads` - File upload metadata

### Row Level Security (RLS)

- Always use RLS policies for data protection
- Never bypass with service key in client code
- Use Edge Functions for operations requiring elevated permissions

## Debugging

### Database Issues
- Check RLS policies if queries return empty results
- Use `debug_logs` table for application logging
- Verify user authentication and JWT tokens
- Test with service role key for admin operations

### Edge Function Debugging
- Check function logs in Supabase dashboard
- Verify environment variables
- Test locally with `supabase functions serve`
- Use `console.log` for debugging (appears in logs)

### File Upload Issues
- Verify storage bucket permissions
- Check file path naming conventions (UUID-based)
- Ensure proper cleanup of old files
- Test signed URL generation and expiration

## Architecture Patterns

### Component Organization

```
src/components/ui/                           # Reusable UI (Radix + Tailwind)
src/features/[feature]/components/           # Feature-specific components
src/features/[feature]/hooks/                # Data fetching hooks
src/features/[feature]/services/             # Business logic
```

### Data Fetching

- Custom hooks for each feature (e.g., `useEnhancedCopies`)
- Direct Supabase queries for simple operations
- Edge Functions via `fetch` for complex operations

### Authentication

- `AuthProvider` wraps app and manages auth state
- `ProtectedRoute` component for route protection
- User session in React context
- Automatic user record creation on sign-in

### Styling

- Tailwind CSS with custom configuration
- Component variants using `class-variance-authority`
- Radix UI primitives with custom styling
- Theme switching with `next-themes`

## Environment Variables

Required in `frontend/.env`:

```
VITE_SUPABASE_URL
VITE_SUPABASE_KEY
```

## Key Features

### Reader Enhance Flow
- Entry from My Shelf
- Automatic scene detection (3-5 scenes per 1k words)
- One-click accept/retry for each image
- Private enhanced copies saved to My Shelf

### Routes
- `/shelf` - My Shelf listing
- `/enhance` - Reader enhance flow
- `/shelf/:copyId` - Reading view for enhanced copies

## Git Workflow

### Commit Messages

Use Conventional Commits format:
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

### Example
```
feat(enhance): add retry mechanism for failed image generation

Implements exponential backoff retry logic for image generation
failures, improving reliability for users with unstable connections.
```

## Resources

- **Product Philosophy**: See `docs/PRODUCT_PHILOSOPHY.md`
- **Code Guidelines**: See `CLAUDE.md` (comprehensive development rules)
- **Specifications**: See `specs/` directory for feature specifications
- **TODOs**: See `docs/TODO.md` for active tasks

## Getting Help

- Check existing documentation in `docs/`
- Review feature specifications in `specs/`
- Refer to `CLAUDE.md` for code guidelines
- Check Supabase documentation for database/auth questions

---

**Ready to build! 🚀**
