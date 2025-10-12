# Immediate TODO - RunPod SDXL Integration Deployment

## Status
PR #7 created and ready: https://github.com/amari-charles/novel-enchant/pull/7
All code changes complete and tested ✅
**Waiting on deployment steps below** ⏳

## Prerequisites
- [ ] Docker is running (required for Supabase CLI)
- [ ] You have RunPod credentials ready:
  - `RUNPOD_API_KEY` - from RunPod dashboard → Settings → API Keys
  - `RUNPOD_ENDPOINT_ID` - from RunPod dashboard → Serverless → Endpoints → (your endpoint ID)

## Deployment Steps

### 1. Deploy the Edge Function
```bash
cd /Users/amaricharles/Code/novel-enchant
supabase functions deploy generate-image
```

**Expected output:**
```
Deploying function generate-image...
Function generate-image deployed successfully
Version: 7
Updated at: [timestamp]
```

### 2. Set RunPod Secrets
```bash
# Set your RunPod API key (from RunPod dashboard)
supabase secrets set RUNPOD_API_KEY=your_actual_key_here

# Set your RunPod endpoint ID (from RunPod dashboard)
supabase secrets set RUNPOD_ENDPOINT_ID=your_actual_endpoint_id_here
```

**Expected output:**
```
Finished supabase secrets set.
```

### 3. Verify Deployment
```bash
# Check function is deployed with new version
supabase functions list | grep generate-image

# Check secrets are set
supabase secrets list | grep RUNPOD
```

**Expected output:**
```
generate-image | ACTIVE | 7 | [today's date]
RUNPOD_API_KEY | [hash]
RUNPOD_ENDPOINT_ID | [hash]
```

### 4. Test the Function (Optional)
```bash
# Get your Supabase anon key
SUPABASE_ANON_KEY=$(supabase status | grep "anon key" | awk '{print $3}')

# Get your Supabase URL
SUPABASE_URL=$(supabase status | grep "API URL" | awk '{print $3}')

# Test the function
curl -X POST "$SUPABASE_URL/functions/v1/generate-image" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a cozy reading nook, cinematic"}'
```

**Expected output:**
```json
{
  "imageData": "iVBORw0KGgo...[base64 string]...",
  "mimeType": "image/png",
  "jobId": "job-abc123"
}
```

### 5. Clean Up Unused Edge Functions
These functions are from an old job queue system and are no longer used:

```bash
supabase functions delete worker-analyze
supabase functions delete worker-dispatch
supabase functions delete worker-finalize
supabase functions delete worker-generate
supabase functions delete enhance-start
supabase functions delete enhance-status
supabase functions delete fetch-chapter
supabase functions delete track-job-progress
supabase functions delete setup-jobs-table
supabase functions delete fix-rls-policies
supabase functions delete apply-restructure
supabase functions delete apply-user-id-migration
supabase functions delete create-dev-user
```

**Or delete all at once:**
```bash
supabase functions delete \
  worker-analyze \
  worker-dispatch \
  worker-finalize \
  worker-generate \
  enhance-start \
  enhance-status \
  fetch-chapter \
  track-job-progress \
  setup-jobs-table \
  fix-rls-policies \
  apply-restructure \
  apply-user-id-migration \
  create-dev-user
```

**Note:** Only `extract-scenes` is still used, so keep that one!

### 6. Merge PR (After Testing)
Once deployment and testing are successful:

```bash
# Merge PR via GitHub UI or CLI
gh pr merge 7 --squash

# Or merge locally
git checkout main
git merge feat/runpod-sdxl-integration
git push
```

## Troubleshooting

### Deploy Hangs/Times Out
- **Issue:** Docker is not running
- **Solution:** Start Docker Desktop and wait for it to be fully running
- **Verify:** Run `docker ps` - should show running containers

### "Function not found" Error
- **Issue:** Function wasn't deployed or deployment failed
- **Solution:** Check `supabase functions list` to see if it's there
- **Retry:** Run deploy command again

### "Secrets not set" Error
- **Issue:** RunPod secrets weren't saved
- **Solution:** Run the `supabase secrets set` commands again
- **Verify:** Run `supabase secrets list | grep RUNPOD`

### Test Returns Error
- **Issue:** RunPod credentials are invalid or endpoint is wrong
- **Solution:**
  - Check your RunPod dashboard for correct credentials
  - Verify the endpoint ID matches your SDXL-Turbo endpoint
  - Make sure the endpoint is active in RunPod

### Image Generation Fails
- **Issue:** RunPod endpoint is down or out of credits
- **Solution:**
  - Check RunPod dashboard for endpoint status
  - Verify you have credits/compute available
  - Check Supabase function logs: `supabase functions logs generate-image`

## What This Does

The RunPod integration:
1. **Frontend** calls `supabase.functions.invoke('generate-image', { body: { prompt } })`
2. **Edge Function** securely calls RunPod API with server-side credentials
3. **RunPod** generates image using SDXL-Turbo
4. **Edge Function** polls until complete, returns base64 image
5. **Frontend** displays the generated image

**Security:** API keys never touch the browser - they're stored in Supabase Edge Function secrets only.

## Files Changed in PR #7

- `frontend/.env.example` - Documentation for RunPod credentials
- `frontend/src/services/enhancement/adapters/ai-clients/runpod-image-ai-client.ts` - Frontend client
- `frontend/src/services/enhancement/factory/create-enhancement-orchestrator.ts` - Uses RunPod instead of stub
- `frontend/tests/unit/core/enhancement/runpod-image-ai-client.spec.ts` - Unit tests
- `supabase/functions/generate-image/index.ts` - Secure server-side proxy
- `docs/TODO.md` - Added Phase 8: RunPod SDXL Integration

## Current Status Summary

✅ Code complete and tested (25/25 tests passing)
✅ Lint passing (0 new errors)
✅ Build successful
✅ PR created (#7)
⏳ **Waiting on deployment** (see steps above)
⏳ **Waiting on RunPod credentials** (need API key and endpoint ID)

## Next Steps After Deployment

1. Test the integration manually in the UI
2. Monitor Supabase function logs for any issues
3. Consider setting up monitoring/alerting for function failures
4. Document RunPod costs and usage limits
5. Add integration test that calls the actual Edge Function (optional)
