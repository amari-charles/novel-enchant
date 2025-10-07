# Novel Enchant

An AI-powered storytelling platform that transforms written novels into immersive visual experiences. Authors and readers can automatically extract key scenes from uploaded books, generate stunning visual representations using AI image generation, and create an interactive gallery to explore stories visually.

## Quick Start

### Prerequisites

- Node.js 20+
- npm or pnpm
- Supabase CLI (`npm install -g supabase`)
- Git

### Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/novel-enchant.git
cd novel-enchant

# Install dependencies
npm ci
cd frontend && npm ci

# Start Supabase local development
supabase start

# Start the frontend development server
npm run dev
```

Visit http://localhost:5173 to see the application.

For detailed setup instructions, see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Project Structure

```
novel-enchant/
├── frontend/             # React + TypeScript + Vite application
│   ├── src/
│   │   ├── features/    # Feature-based organization
│   │   ├── components/  # Shared UI components (shadcn/ui)
│   │   ├── services/    # Business logic layer
│   │   ├── lib/         # Utilities and configurations
│   │   └── app/         # Application shell
│   └── tests/           # Test files
├── supabase/            # Backend infrastructure
│   ├── functions/       # Edge Functions (serverless)
│   └── migrations/      # Database migrations
├── docs/                # Documentation
└── specs/               # Feature specifications
```

## Key Features

### For Readers
- **Reader Enhance**: Upload or paste story text, automatically generate 3-5 scene illustrations
- **My Shelf**: View and read enhanced stories with inline images
- **One-click workflow**: Simple accept/retry for each generated image

### For Authors (In Development)
- **Chapter Management**: Organize works into chapters with rich text editing
- **Smart Scene Detection**: AI-powered extraction of key narrative moments
- **Character Consistency**: Track characters across scenes for visual consistency
- **Manual Image Placement**: Insert images at specific cursor positions
- **Anchor System**: Stable position tracking for images as text changes

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI + Tailwind)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Testing**: Vitest, React Testing Library
- **Rich Text**: Lexical Editor

## Documentation

- **[Development Guide](docs/DEVELOPMENT.md)** - Setup, architecture, and workflow
- **[Code Guidelines](CLAUDE.md)** - Best practices and standards
- **[Testing Guide](docs/TESTING.md)** - Testing strategy and practices
- **[Product Philosophy](docs/PRODUCT_PHILOSOPHY.md)** - Design principles
- **[Feature Specs](specs/)** - Detailed feature specifications

## Development Workflow

### Running Tests

```bash
# Unit tests
cd frontend && npm run test

# Integration tests (against real Supabase)
npm run test:integration

# Watch mode
npm run test:watch
```

### Code Quality

```bash
# Lint
npm run lint

# Build
npm run build
```

### Git Workflow

1. Create feature branch from `main`
2. Make changes following [CLAUDE.md](CLAUDE.md) guidelines
3. Ensure tests pass and build succeeds
4. Create PR to `main`
5. After review and CI passes, merge

We use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

## Architecture Highlights

- **Feature-based organization**: Code organized by feature, not layer
- **No mocking for database operations**: Integration tests use real Supabase
- **Type-safe**: Generated TypeScript types from Supabase schema
- **Branded types**: Type-safe IDs (e.g., `UserId`, `ChapterId`)
- **Clean separation**: Components → Services → Repositories → Database

## Contributing

1. Read [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for setup
2. Review [CLAUDE.md](CLAUDE.md) for code standards
3. Check [docs/TODO.md](docs/TODO.md) for active tasks
4. Follow the testing practices in [docs/TESTING.md](docs/TESTING.md)

## License

[Your License Here]

## Support

For questions or issues:
- Check [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for setup help
- Review existing [GitHub Issues](https://github.com/your-org/novel-enchant/issues)
- See [CLAUDE.md](CLAUDE.md) for code guidelines
