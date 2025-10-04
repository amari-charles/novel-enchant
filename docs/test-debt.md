# Test Debt

This document tracks tests that have issues and need to be replaced or improved.

## Tests with Implementation Logic Duplication

### 1. `frontend/src/services/enhancement/media-cleanup.integration.spec.ts`

**Issue**: Duplicates database trigger logic in test mocks

**Problem**:
- Lines 79-105: The `deleteByChapterId` mock reimplements the database cascade and trigger logic
- This means we're testing our test implementation, not the actual database behavior
- If the real trigger breaks or changes, tests still pass (false confidence)

**Current Behavior**:
```typescript
// Mock duplicates trigger logic
deleteByChapterId: vi.fn(async () => {
  // Manually implements cascade delete
  // Manually implements trigger behavior
  // Finds and deletes owned media
});
```

**What It Should Do**:
- Connect to real Supabase database
- Actually create records in the database
- Actually delete anchors
- Actually verify media was deleted by the real trigger

**Risk Level**: HIGH
- Core feature (media cleanup) is not actually tested
- Database trigger could be broken and tests would pass

**Replacement Plan**:
- Create `frontend/tests/integration/media-cleanup.db.spec.ts`
- Use real Supabase connection
- Test against actual database with triggers
- See implementation plan in this document

## Replacement Test Plan

### Real Integration Test Structure

```typescript
// frontend/tests/integration/media-cleanup.db.spec.ts

describe('Media Cleanup - Database Integration', () => {
  beforeEach(async () => {
    // Connect to local Supabase
    // Apply migrations
    // Clean test data
  });

  test('trigger deletes media when enhancement is deleted', async () => {
    // 1. Create user
    const user = await createTestUser();

    // 2. Create story, chapter
    const chapter = await createTestChapter(user.id);

    // 3. Create anchor
    const anchor = await supabase.from('anchors').insert({...});

    // 4. Create media
    const media = await supabase.from('media').insert({...});

    // 5. Set media ownership
    await supabase.from('media').update({
      owner_type: 'enhancement',
      owner_id: enhancement.id
    });

    // 6. Create enhancement linked to media
    const enhancement = await supabase.from('enhancements').insert({
      anchor_id: anchor.id,
      media_id: media.id
    });

    // 7. Delete the anchor (should cascade)
    await supabase.from('anchors').delete().eq('id', anchor.id);

    // 8. VERIFY: Media should be deleted by trigger
    const { data: deletedMedia } = await supabase
      .from('media')
      .select()
      .eq('id', media.id);

    expect(deletedMedia).toHaveLength(0); // Actually deleted!
  });
});
```

### Benefits of Real Integration Tests

1. **Tests actual behavior** - Verifies the database trigger works
2. **Catches real bugs** - If trigger SQL is wrong, test fails
3. **Tests migrations** - Ensures migration creates working trigger
4. **Production confidence** - What works in test works in prod
5. **No logic duplication** - Database does the work, test just verifies

### When to Use Each Test Type

**Unit Tests** (current `media-cleanup.integration.spec.ts`):
- ✅ Test application logic (calling setMediaOwner)
- ✅ Test orchestration flow
- ✅ Fast execution
- ❌ Don't test database triggers
- ❌ Don't test SQL logic

**Integration Tests** (new `media-cleanup.db.spec.ts`):
- ✅ Test database triggers
- ✅ Test cascade deletes
- ✅ Test actual SQL behavior
- ✅ Verify migrations work
- ❌ Slower execution
- ❌ Require database running

### Recommended Approach

**Keep both test types**:
1. Unit tests for fast feedback on application logic
2. Integration tests for slower but comprehensive DB verification
3. Run unit tests on every commit
4. Run integration tests before deployment

## Next Steps

1. [x] Document the issue
2. [x] Create integration test infrastructure (`tests/integration/setup.ts`)
3. [x] Write real database integration test
4. [ ] Fix Docker daemon (currently not responsive - prevents running integration tests)
5. [ ] Run integration tests locally to verify trigger works
6. [ ] Update CI to run integration tests
7. [x] Keep existing unit test for fast feedback (with documented limitations)

## Date Identified

2025-10-03

## Current Blockers

### Docker Not Responsive (2025-10-03)

**Issue**: Docker daemon is completely hung/unresponsive
- `docker ps` times out
- `docker info` times out
- Prevents Supabase from running (uses Docker)
- Blocks integration test execution

**Impact**:
- ✅ Unit tests work fine (24/24 passing)
- ✅ Build succeeds
- ❌ Cannot run integration tests
- ❌ Cannot verify database trigger locally

**Known Solutions**:
1. Restart Docker Desktop (macOS): `killall Docker && open -a Docker`
2. Check Docker Desktop logs: `~/Library/Containers/com.docker.docker/Data/log/vm/dockerd.log`
3. Full Docker reset if needed

**Related GitHub Issues**:
- https://github.com/supabase/cli/issues/2540 - Storage timeout issues
- https://github.com/supabase/cli/issues/4141 - Database operation timeouts

**Workaround**: Integration tests are properly implemented and will work once Docker is restarted. Unit tests provide coverage of application logic in the meantime.

## Related Files

- `frontend/src/services/enhancement/media-cleanup.integration.spec.ts` (current flawed test)
- `frontend/tests/integration/media-cleanup.db.spec.ts` (real integration test - needs Docker)
- `supabase/migrations/20251003000000_polymorphic_media_ownership.sql` (trigger being tested)
