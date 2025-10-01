# Research: AI-Powered Story Illustration System

**Date**: 2025-09-27
**Feature**: Enhancement engine with character consistency

## Frontend Integration Patterns for Mock AI Services

### Decision: Service Layer with Mock Implementations
**Rationale**: Create service interfaces that can later be swapped with real AI implementations while maintaining same API contract.

**Pattern**:
```typescript
interface EnhancementService {
  autoEnhance(request: AutoEnhanceRequest): Promise<AutoEnhanceResponse>
  manualInsert(request: ManualInsertRequest): Promise<ManualInsertResponse>
  retryEnhancement(id: string): Promise<RetryResponse>
}

class MockEnhancementService implements EnhancementService {
  // Deterministic mock implementations
}
```

**Alternatives considered**:
- Inline mocks: Rejected - harder to test and swap later
- API mocking library: Rejected - adds complexity for simple deterministic responses

## State Management for Enhancement Flows

### Decision: React Context + useReducer for Complex State
**Rationale**: Enhancement flows have complex state transitions (pending → generating → retry/accept) that benefit from reducer pattern.

**Pattern**:
```typescript
type EnhancementState = {
  status: 'idle' | 'generating' | 'completed' | 'error'
  enhancements: Enhancement[]
  characters: Character[]
  activeAnchor?: string
}

const EnhancementContext = createContext<{
  state: EnhancementState
  dispatch: Dispatch<EnhancementAction>
}>()
```

**Alternatives considered**:
- useState only: Rejected - too many state variables to coordinate
- External state library: Rejected - adds dependency for single feature

## Image Positioning and Rendering Strategies

### Decision: Character-Level Position Tracking
**Rationale**: Spec requires images at exact cursor positions, not just paragraph boundaries.

**Pattern**:
```typescript
interface Anchor {
  id: string
  chapterId: string
  position: number  // character index in text
  imageId?: string
}

// Render by splitting text at anchor positions
function renderWithImages(text: string, anchors: Anchor[]) {
  // Split text at each anchor position
  // Insert images between text segments
}
```

**Alternatives considered**:
- Paragraph-based positioning: Rejected - doesn't meet spec requirement for exact positioning
- DOM manipulation: Rejected - harder to test and maintain

## Character Consistency UI Patterns

### Decision: Registry with Candidate Management
**Rationale**: Spec requires authors to review and approve detected characters before they become consistent.

**Pattern**:
```typescript
interface Character {
  id: string
  name: string
  status: 'candidate' | 'confirmed' | 'ignored' | 'merged'
  description?: string
  aliases: string[]
}

// UI Flow: Detection → Candidate Review → Confirmation → Consistency
```

**Alternatives considered**:
- Auto-approval: Rejected - spec requires author control
- Complex character modeling: Rejected - keep simple for v1 mock

## Mock Service Response Patterns

### Decision: Deterministic Responses with Realistic Delays
**Rationale**: UX validation requires realistic timing and predictable outputs for testing.

**Implementation**:
- Use setTimeout for realistic async behavior
- Deterministic image URLs (picsum.photos with seed)
- Static character names (Character A, B, C)
- Consistent quality scores for predictable UX

**Example**:
```typescript
async autoEnhance(request: AutoEnhanceRequest): Promise<AutoEnhanceResponse> {
  await delay(2000) // Simulate processing time
  return {
    anchors: generateDeterministicAnchors(request.text),
    characters: generateMockCharacters(request.text),
    images: generatePlaceholderImages()
  }
}
```

## Testing Strategy for Mock Services

### Decision: Contract Tests + Integration Tests
**Rationale**: Ensure mock services match expected real service contracts and UI flows work end-to-end.

**Approach**:
1. Contract tests: Validate service interfaces and response shapes
2. Integration tests: Test complete user flows with mocked services
3. Component tests: Test individual UI components with service mocks

## Error Handling Patterns

### Decision: Error Boundaries + User-Friendly Messages
**Rationale**: Mock services can simulate error conditions to validate error handling UX.

**Pattern**:
```typescript
// Service layer errors
class EnhancementError extends Error {
  code: 'OUT_OF_BOUNDS' | 'INVALID_INPUT' | 'GENERATION_FAILED'
  userMessage: string
}

// UI error handling
function EnhancementErrorBoundary() {
  // Convert service errors to user-friendly messages
}
```

## Performance Considerations

### Decision: Optimistic UI Updates
**Rationale**: Mock services are instant but real services will have latency. Design for async from start.

**Pattern**:
- Show loading states immediately
- Update UI optimistically where safe
- Handle rollback for failed operations
- Debounce rapid user actions

## Summary

Research confirms feasibility of mock-first approach with service layer abstraction. Key architectural decisions support future real AI integration while keeping current implementation simple and testable. All patterns align with existing React/TypeScript codebase conventions.