# Testing Guide

## Test Types

### Unit Tests
**Location**: `frontend/src/**/*.spec.ts`

**Purpose**: Fast tests for application logic

**Run**:
```bash
npm run test          # Watch mode
npm run test:run      # Run once
```

**What they test**:
- Component behavior
- Service orchestration
- Business logic
- Error handling

**What they DON'T test**:
- Database triggers
- Cascade deletes
- RLS policies
- SQL functions

### Integration Tests
**Location**: `frontend/tests/integration/**/*.spec.ts`

**Purpose**: Test actual database behavior

**Prerequisites**:
1. Local Supabase running:
   ```bash
   supabase start
   ```

2. Migrations applied:
   ```bash
   supabase db reset
   ```

3. Environment variables:
   ```bash
   # In frontend/.env
   VITE_SUPABASE_URL=http://127.0.0.1:54321
   VITE_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

**Run**:
```bash
npm run test:integration
```

**What they test**:
- ✅ Database triggers
- ✅ Cascade deletes
- ✅ RLS policies
- ✅ SQL functions
- ✅ Actual data persistence

## Current Test Status

### ✅ Unit Tests
All passing. Run on every commit.

### ⚠️ Integration Tests
**Status**: Created but require Supabase setup

**To enable**:
1. Start local Supabase
2. Apply migrations
3. Set environment variables (see Prerequisites above)

**Current state**: Tests are properly configured and will run once Supabase is set up.

## Test Coverage

### Media Cleanup Feature

**Unit Test** (`media-cleanup.integration.spec.ts`):
- ✅ Tests application calls `setMediaOwner`
- ✅ Tests orchestration flow
- ✅ Fast execution (~10ms)
- ⚠️ Does NOT test actual database trigger (documented in `docs/test-debt.md`)

**Integration Test** (`tests/integration/media-cleanup.db.spec.ts`):
- ✅ Tests actual database trigger
- ✅ Verifies cascade deletes
- ✅ Tests media cleanup automation
- ✅ Tests edge cases (orphaned media, multiple deletes)
- ⏳ Requires Supabase running

## When to Run Which Tests

### During Development
```bash
npm run test:watch
```
Run unit tests continuously for fast feedback.

### Before Committing
```bash
npm run build
npm run lint
npm run test:run
```
Verify all unit tests pass and build succeeds.

### Before Deploying
```bash
npm run test:integration
```
Verify database behavior is correct.

### In CI/CD
```bash
# Run all tests
npm run test:run
npm run test:integration
```

## Writing Tests

### Unit Test Example
```typescript
import { describe, test, expect, vi } from 'vitest';

describe('MyService', () => {
  test('should do something', () => {
    const service = new MyService();
    const result = service.doSomething();
    expect(result).toBe(expected);
  });
});
```

### Integration Test Example
```typescript
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { getTestSupabaseClient, createTestUser, cleanupTestUser } from './setup';

describe('My Feature - Database Integration', () => {
  let client;
  let testUserId;

  beforeAll(async () => {
    client = getTestSupabaseClient();
    const { userId } = await createTestUser();
    testUserId = userId;
  });

  afterAll(async () => {
    await cleanupTestUser(testUserId);
  });

  test('database does something', async () => {
    const { data } = await client.from('table').insert({...});
    expect(data).toBeDefined();
  });
});
```

## Troubleshooting

### Unit Tests Fail
1. Check test logic
2. Verify mocks are correct
3. Run `npm run lint`

### Integration Tests Fail

**"Missing Supabase anon key"**
- Add keys to `frontend/.env`
- Get keys from `supabase status`

**"Failed to create test user"**
- Start Supabase: `supabase start`
- Check Supabase is running: `supabase status`

**Tests timeout**
- Increase timeout in `vitest.integration.config.ts`
- Check Supabase is responsive

**RLS policy errors**
- Verify policies allow test operations
- Check user authentication
- Use admin client for setup/teardown

## Best Practices

### Unit Tests
1. ✅ Fast (< 100ms per test)
2. ✅ Test one thing
3. ✅ Mock external dependencies
4. ✅ Use descriptive test names
5. ❌ Don't test implementation details

### Integration Tests
1. ✅ Test real database behavior
2. ✅ Clean up test data
3. ✅ Use unique identifiers
4. ✅ Test edge cases
5. ❌ Don't duplicate implementation logic in mocks

## See Also

- `frontend/tests/integration/README.md` - Detailed integration test guide
- `docs/test-debt.md` - Known test issues and improvements needed
