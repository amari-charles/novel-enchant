# Windows Development Guide

This guide covers Windows-specific issues and solutions when developing Novel Enchant.

## Supabase CLI on Windows

### Critical Issue: Path Conversion in Git Bash/MSYS

When using the Supabase CLI in Git Bash or MSYS environments on Windows, you may encounter glob pattern errors like:

```
glob supabase\migrations\20251002055502_*.sql: file does not exist
```

This occurs because MSYS automatically converts Unix-style paths to Windows paths, which breaks glob pattern matching in the CLI.

### Solution: MSYS_NO_PATHCONV=1

**Always prefix Supabase CLI commands with `MSYS_NO_PATHCONV=1`** when running in Git Bash or MSYS:

```bash
# Migration repair
MSYS_NO_PATHCONV=1 npx supabase migration repair --status reverted <timestamp>
MSYS_NO_PATHCONV=1 npx supabase migration repair --status applied <timestamp>

# Migration operations
MSYS_NO_PATHCONV=1 npx supabase migration list
MSYS_NO_PATHCONV=1 npx supabase db push
MSYS_NO_PATHCONV=1 npx supabase db push --include-all
MSYS_NO_PATHCONV=1 npx supabase db pull

# Project linking
MSYS_NO_PATHCONV=1 npx supabase link --project-ref <project-ref>
```

### What MSYS_NO_PATHCONV Does

- **Without it**: MSYS converts paths like `/supabase/migrations` to `C:\supabase\migrations`
- **With it**: Paths are left unchanged, allowing the Supabase CLI to handle them correctly
- **Scope**: Only affects the single command it prefixes

### Alternative: Use PowerShell or CMD

If you prefer not to use `MSYS_NO_PATHCONV=1`, run Supabase CLI commands in PowerShell or CMD where path conversion doesn't occur:

```powershell
# PowerShell
npx supabase migration list
npx supabase db push
```

```cmd
# CMD
npx supabase migration list
npx supabase db push
```

## Common Windows Issues & Solutions

### Migration History Sync Issues

When local and remote migration histories are out of sync:

1. **Check the status:**
   ```bash
   MSYS_NO_PATHCONV=1 npx supabase migration list
   ```

2. **Revert remote migrations:**
   ```bash
   MSYS_NO_PATHCONV=1 npx supabase migration repair --status reverted <timestamp>
   ```

3. **Mark migrations as applied (if already in DB):**
   ```bash
   MSYS_NO_PATHCONV=1 npx supabase migration repair --status applied <timestamp>
   ```

4. **Push new migrations:**
   ```bash
   MSYS_NO_PATHCONV=1 npx supabase db push --include-all
   ```

### Integration Tests Setup

When running integration tests on Windows:

1. **Environment variables are loaded correctly** with `dotenv` in the vitest config
2. **Test user must exist** in Supabase with credentials from `.env`:
   - `TEST_USER_EMAIL`
   - `TEST_USER_PASSWORD`
3. **Service role key required** for admin operations:
   - `SUPABASE_SERVICE_ROLE_KEY`

### File Path Issues in Scripts

When writing Node.js scripts that interact with the file system:

- **Use forward slashes** in paths, even on Windows (Node.js handles this correctly)
- **Use `path.join()`** for cross-platform compatibility
- **Avoid hardcoded backslashes** in glob patterns

Example:
```javascript
// Good
const migrationPath = path.join(__dirname, '../supabase/migrations/');
const files = glob.sync('supabase/migrations/*.sql');

// Bad
const migrationPath = __dirname + '\\..\\supabase\\migrations\\';
const files = glob.sync('supabase\\migrations\\*.sql');
```

## Environment Setup Best Practices

### .env File Organization

Structure your `.env` file with clear sections:

```env
# =============================================================================
# Supabase Configuration
# =============================================================================
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# =============================================================================
# OpenAI Configuration
# =============================================================================
VITE_OPENAI_API_KEY=xxxxx
VITE_OPENAI_TEXT_MODEL=gpt-4o-mini

# =============================================================================
# Application Configuration
# =============================================================================
VITE_APP_ENV=development

# =============================================================================
# Development & Testing
# =============================================================================
# Auto-login credentials for development
VITE_TEST_USER_EMAIL=test@example.com
VITE_TEST_USER_PASSWORD=testpassword123

# Integration test user (must exist in Supabase)
TEST_USER_EMAIL=integration-test@novelenchant.com
TEST_USER_PASSWORD=integration-test-password-123
```

### Git Bash vs PowerShell vs CMD

**For Supabase CLI operations:**
- ✅ **Git Bash**: Use with `MSYS_NO_PATHCONV=1` prefix
- ✅ **PowerShell**: Works without modification
- ✅ **CMD**: Works without modification

**For npm scripts:**
- ✅ All shells work equally well

**For file operations:**
- ✅ Use Node.js `path` module for cross-platform compatibility

## Debugging Tips

### Check if MSYS is the Issue

If a Supabase CLI command fails:

1. **Check for path-related errors** in the output
2. **Look for backslashes** in error messages (indicates MSYS conversion)
3. **Try the same command in PowerShell** - if it works there, use `MSYS_NO_PATHCONV=1` in Git Bash

### Migration Troubleshooting

When migrations fail:

1. **Always run with `--debug` flag** for detailed output:
   ```bash
   MSYS_NO_PATHCONV=1 npx supabase db push --debug
   ```

2. **Check migration list** to see sync status:
   ```bash
   MSYS_NO_PATHCONV=1 npx supabase migration list
   ```

3. **Review migration history** in Supabase dashboard:
   - Go to Database → Migration History
   - Verify which migrations are actually applied

## Shell Configuration

### Persistent MSYS_NO_PATHCONV Setting

To avoid typing `MSYS_NO_PATHCONV=1` every time, add an alias to your `.bashrc` or `.bash_profile`:

```bash
# ~/.bashrc or ~/.bash_profile
alias supabase='MSYS_NO_PATHCONV=1 npx supabase'
```

Then you can use:
```bash
supabase migration list
supabase db push
```

### Function for Migration Operations

Add this to your `.bashrc` for convenient migration commands:

```bash
# Supabase migration helpers
sb-migrate() {
  MSYS_NO_PATHCONV=1 npx supabase "$@"
}

sb-repair-revert() {
  MSYS_NO_PATHCONV=1 npx supabase migration repair --status reverted "$1"
}

sb-repair-apply() {
  MSYS_NO_PATHCONV=1 npx supabase migration repair --status applied "$1"
}
```

Usage:
```bash
sb-migrate migration list
sb-repair-revert 20251002055502
sb-repair-apply 20251002055502
```

## Summary

**Key Takeaway**: When using Supabase CLI on Windows in Git Bash/MSYS, always use `MSYS_NO_PATHCONV=1` to prevent path conversion issues.

This is the primary fix for glob pattern errors and migration sync problems on Windows.
