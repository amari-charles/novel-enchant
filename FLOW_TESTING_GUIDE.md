# Flow Testing Guide

How to verify that the Novel Enchant orchestration flows work in the UI using mock Edge Function handlers.

## Quick Start

### 1. Start the Frontend 
```bash
cd frontend
npm run dev
```
This starts the React app (usually on http://localhost:5173)

### 2. Navigate to Test Page
- Go to http://localhost:5173
- Click the "Test Flows" button in the top right
- Or navigate directly to http://localhost:5173/test-flows

### 3. Test the Flows
No backend server needed! The tests call Edge Function handlers directly with mock data.

## What You Can Test

### 🔹 Create Story Flow
Tests the complete story creation pipeline:
- File parsing and text extraction
- Chapter detection and structure analysis  
- Story record creation
- Chapter record creation
- Sequential processing queue setup

**Expected Result**: Story with 3 chapters created, processing sequence queued

### 🔹 Process Chapter Flow  
Tests the chapter processing pipeline:
- Text chunking into sections
- Scene extraction with AI
- Entity identification and tracking
- Reference image generation
- Image prompt construction
- Scene image generation
- Quality assessment

**Expected Result**: Chapter processed with scenes, entities, and images generated

### 🔹 Full Pipeline
Tests both flows in sequence:
- Creates a story with chapters
- Processes the first chapter completely
- Shows end-to-end workflow

**Expected Result**: Complete story creation → chapter processing pipeline

## What You'll See

### ✅ Success Indicators
- Green checkmarks for successful operations
- Detailed response data showing:
  - Story and chapter IDs
  - Scene extraction results
  - Entity discovery
  - Generated image URLs
  - Quality assessment scores

### ❌ Error Indicators  
- Red X marks for failed operations
- Error messages explaining what went wrong
- Stack traces for debugging

### 📊 Response Data
Each test shows expandable response data including:
- **Story Data**: IDs, titles, metadata
- **Chapter Data**: Content, word counts, processing status
- **Scene Data**: Descriptions, visual scores, emotional tone
- **Entity Data**: Characters and locations discovered
- **Image Data**: Generated URLs and quality metrics

## Architecture Overview

```
Frontend (React)          →    Mock Test Helpers        →    Edge Function Handlers (TypeScript)
/test-flows page          →    flow-test-helpers.ts    →    Mock database operations

┌─────────────────┐       ┌─────────────────┐         ┌─────────────────┐
│ Flow Tester UI  │  →    │ testCreateStory │    →    │ createStoryFlow │
│                 │       │ FlowHandler     │         │ Edge Function   │
├─────────────────┤  →    ├─────────────────┤    →    ├─────────────────┤
│ Test Buttons    │       │ testProcessChap │         │ processChapter  │
│                 │       │ terFlowHandler  │         │ Flow Function   │
├─────────────────┤  →    ├─────────────────┤    →    ├─────────────────┤
│ Results Display │       │ testFullPipeline│         │ Full Pipeline   │
└─────────────────┘       │ Handler         │         └─────────────────┘
                          └─────────────────┘
```

## Mock Data vs Real Data

Currently using **mock implementations** for:
- ✅ File parsing (simulated text extraction)
- ✅ Database operations (in-memory mock responses)
- ✅ AI API calls (mock scene extraction, entity detection)
- ✅ Image generation (mock URLs and metadata)

To connect **real implementations**:
1. Replace mock database helpers with actual Supabase calls
2. Connect to real OpenAI API for text processing
3. Connect to real SDXL API for image generation
4. Add proper authentication and error handling

## Troubleshooting

### Tests Not Running
- Make sure frontend development server is running (`npm run dev`)
- Check browser console for JavaScript errors
- Verify imports in flow-tester.tsx are correct

### Flow Test Helpers Not Found
- Check that `flow-test-helpers.ts` exists in the testing directory
- Verify the import paths in flow-tester.tsx are correct

### Flow Tests Failing
- Check browser console for JavaScript errors
- Look at the error details in the UI test results
- Verify mock data structure matches expected types

### TypeScript Errors
```bash
# Check for import/type errors
cd frontend
npm run type-check
```

## Next Steps

Once basic flow testing works:

1. **Replace Mocks**: Connect real Supabase database and AI APIs
2. **Add Authentication**: Implement proper user auth for API calls  
3. **Error Handling**: Add retry logic and better error messages
4. **Progress Tracking**: Show real-time progress for long operations
5. **Unit Tests**: Add proper Jest/Vitest tests for functions

## File Structure

```
backend/functions/orchestration/
├── create-story-flow/
│   ├── index.ts                         # Story creation Edge Function
│   └── database-helpers.ts              # Mock DB operations
└── process-chapter-flow/
    ├── index.ts                         # Chapter processing Edge Function  
    └── database-helpers.ts              # Mock DB operations

frontend/src/features/testing/
├── flow-tester.tsx                      # Test UI component
├── flow-test-helpers.ts                 # Mock test helper functions
└── (app.tsx updated with /test-flows route)
```

## Success Criteria

You'll know the flows are working when:
- ✅ All three test buttons complete successfully
- ✅ Response data shows realistic story/chapter/scene information
- ✅ No errors in browser console
- ✅ Processing times are reasonable (2-5 seconds per flow)
- ✅ UI updates show clear success/failure states

This testing setup gives you confidence that the orchestration logic works correctly before connecting real AI APIs and databases. The Edge Function handlers you're testing are the same ones you'll deploy to Supabase, just using mock data for now.