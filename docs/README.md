# Novel Enchant Documentation

Central hub for all project documentation.

## Getting Started

- **[Development Guide](DEVELOPMENT.md)** - Setup, architecture, and development workflow
- **[Product Philosophy](PRODUCT_PHILOSOPHY.md)** - Design principles and product vision

## For Developers

### Essential Reading

1. **[DEVELOPMENT.md](DEVELOPMENT.md)** - Start here for setup and architecture overview
2. **[CLAUDE.md](../CLAUDE.md)** - Comprehensive code guidelines and best practices (in root)
3. **[TODO.md](TODO.md)** - Active tasks and known issues

### Code Guidelines

For detailed coding standards, testing practices, and implementation patterns, see:
- **[CLAUDE.md](../CLAUDE.md)** in the repository root

Key highlights:
- TDD approach with Vitest + React Testing Library
- Feature-based organization with kebab-case naming
- Branded types for IDs, type-only imports
- No mocking for database operations (use real Supabase)

### Specifications

Feature specifications are organized in the `specs/` directory:

```
specs/
├── 000-navigation-entry-flow/    # Navigation and entry points
├── 001-reader-enhance-flow/      # Reader enhancement feature
├── 002-my-works-author/          # Author workspace
└── 003-business-context-target/  # AI illustration system
```

Each spec includes:
- `spec.md` - Feature specification
- `plan.md` - Implementation plan
- `tasks.md` - Task breakdown
- `data-model.md` - Database schema
- Contract definitions (where applicable)

## Project Structure

```
novel-enchant/
├── docs/                  # Documentation (you are here)
│   ├── README.md         # This file
│   ├── DEVELOPMENT.md    # Development guide
│   ├── PRODUCT_PHILOSOPHY.md
│   └── TODO.md           # Active tasks
├── CLAUDE.md             # Code guidelines for Claude Code
├── specs/                # Feature specifications
├── frontend/             # React + TypeScript + Vite app
│   ├── src/
│   │   ├── features/    # Feature-based organization
│   │   ├── shared/      # Shared components and utilities
│   │   └── app/         # Main application
│   └── tests/           # Test files
├── supabase/             # Database and Edge Functions
│   ├── functions/       # Serverless Edge Functions
│   └── migrations/      # Database schema
├── packages/             # Shared packages
└── scripts/              # Build and deployment scripts
```

## Documentation Philosophy

### What Goes Where

**Root Level:**
- `CLAUDE.md` - Code guidelines (Claude Code convention)
- `README.md` - Project introduction (standard)

**docs/ Directory:**
- `README.md` - Documentation index (this file)
- `DEVELOPMENT.md` - Development setup and architecture
- `PRODUCT_PHILOSOPHY.md` - Product vision and design principles
- `TODO.md` - Active tasks and issues

**specs/ Directory:**
- Feature-specific specifications
- Implementation plans and tasks
- Contract definitions
- Data models

**.specify/ and .claude/ Directories:**
- Template and configuration files
- Internal tooling configuration

## Quick Links

- [Development Setup](DEVELOPMENT.md#quick-start)
- [Architecture Overview](DEVELOPMENT.md#architecture)
- [Testing Guide](DEVELOPMENT.md#testing)
- [Code Quality Standards](../CLAUDE.md#implementation-best-practices)
- [Git Workflow](DEVELOPMENT.md#git-workflow)
- [Product Philosophy](PRODUCT_PHILOSOPHY.md)

## Contributing

1. Read [DEVELOPMENT.md](DEVELOPMENT.md) for setup and architecture
2. Review [CLAUDE.md](../CLAUDE.md) for code standards
3. Check [TODO.md](TODO.md) for active tasks
4. Follow the Git workflow and commit conventions

## Need Help?

- **Setup issues?** → [DEVELOPMENT.md](DEVELOPMENT.md#quick-start)
- **Code standards?** → [CLAUDE.md](../CLAUDE.md)
- **Feature specs?** → `specs/` directory
- **Product questions?** → [PRODUCT_PHILOSOPHY.md](PRODUCT_PHILOSOPHY.md)
