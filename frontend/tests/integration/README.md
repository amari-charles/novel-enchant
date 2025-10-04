# Integration Tests

Real database integration tests that verify actual Supabase behavior including triggers, cascade deletes, and RLS policies.

## Prerequisites

1. **Local Supabase running**:
   ```bash
   supabase start
   ```

2. **Migrations applied**:
   ```bash
   supabase db reset
   ```

3. **Environment variables set**:
   - `VITE_SUPABASE_URL` or defaults to `http://127.0.0.1:54321`
   - `VITE_SUPABASE_ANON_KEY` - Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations

## Running Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific test file
npm run test:integration -- media-cleanup.db.spec.ts

# Run with watch mode
npm run test:integration -- --watch
```

## What These Tests Verify

Unlike unit tests that mock dependencies, integration tests:

- ✅ Test actual database triggers
- ✅ Test cascade deletes
- ✅ Test RLS policies
- ✅ Test SQL functions
- ✅ Test actual data persistence
- ✅ Verify migrations work correctly

## Test Structure

### `setup.ts`
Common utilities for integration tests:
- `getTestSupabaseClient()` - Get client for tests
- `getTestSupabaseAdminClient()` - Get admin client
- `createTestUser()` - Create test user
- `cleanupTestUser()` - Clean up test data
- `withTestTransaction()` - Run test with automatic cleanup

### Test Files
- `media-cleanup.db.spec.ts` - Tests database trigger for media cleanup

## Writing Integration Tests

### Example Test

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

  test('my test', async () => {
    // 1. Create test data
    const { data } = await client.from('table').insert({...});

    // 2. Perform action
    await client.from('table').delete().eq('id', data.id);

    // 3. Verify result
    const { data: result } = await client.from('table').select();
    expect(result).toHaveLength(0);
  });
});
```

### Best Practices

1. **Always clean up** - Use `afterAll` to delete test data
2. **Use unique identifiers** - Test users have emails like `test-{timestamp}@example.com`
3. **Test real behavior** - Don't mock the database layer
4. **Isolate tests** - Each test should work independently
5. **Use transactions when possible** - Use `withTestTransaction` helper

## Debugging

### Check Supabase is running:
```bash
supabase status
```

### View database logs:
```bash
supabase logs db
```

### Reset database:
```bash
supabase db reset
```

### Check test data:
```bash
# Connect to local database
psql postgresql://postgres:postgres@localhost:54322/postgres

# List test users
SELECT * FROM auth.users WHERE email LIKE 'test-%';
```

## Troubleshooting

**Error: Missing Supabase anon key**
- Set `VITE_SUPABASE_ANON_KEY` environment variable
- Check `.env` file exists

**Error: Failed to create test user**
- Make sure Supabase is running: `supabase status`
- Check auth is enabled in Supabase config

**Tests timeout**
- Check Supabase is accessible
- Increase timeout in `vitest.integration.config.ts`

**RLS policy errors**
- Check policies allow test user operations
- Use admin client for setup/teardown
- Verify user is authenticated properly

## CI/CD Integration

Integration tests should run in CI before deployment:

```yaml
# .github/workflows/test.yml
- name: Start Supabase
  run: supabase start

- name: Run integration tests
  run: npm run test:integration
  env:
    VITE_SUPABASE_URL: http://127.0.0.1:54321
    VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```
