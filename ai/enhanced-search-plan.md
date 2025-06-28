# Enhanced Search Implementation Plan

## Problem Summary

The current partial word matching implementation needs enhancements for:
1. **Error Handling**: Robust handling of edge cases in search terms
2. **Performance**: Measurable performance targets for large monorepos
3. **User Experience**: Better feedback when searches yield no results

## Goals

- **Business Goal**: Provide a fast, reliable, and user-friendly search experience that scales to large monorepos
- **Technical Goal**: Enhance the search implementation with proper error handling, performance benchmarks, and improved UX feedback

## Context

**Required Files**:
- `src/script-quick-pick/show-script-picker.ts` - Main search implementation
- `src/__tests__/script-quick-pick/show-script-picker.spec.ts` - Test file
- `src/utils/error-handling.ts` - Existing error handling patterns
- `src/__tests__/test-utils/performance-helpers.ts` - New file for performance utilities

**Key Findings**:
- VS Code QuickPick provides `busy` property for loading states
- Empty search results currently show blank list
- Existing error handling uses ApplicationError pattern

## Implementation Plan

### Cycle 1: Add Robust Error Handling for Search Terms

**RED Phase**:
- Write tests for edge cases:
  - Empty string after trim: "   "
  - Very long search strings (>1000 chars)
  - Special regex characters that could break split
  - Search terms with only separators: "---"
  - Unicode characters and emojis

**GREEN Phase**:
- Add input validation to matchesAllSearchTerms
- Sanitize search terms before processing
- Handle edge cases gracefully

**REFACTOR Phase**:
- Extract validation logic into pure functions
- Create constants for limits

**VERIFY Phase**:
- Run: `pnpm test -- show-script-picker.spec.ts`
- Run: `pnpm lint`
- Run: `pnpm types:check`

### Cycle 2: Create Performance Benchmarking Infrastructure

**RED Phase**:
- Write performance test utilities
- Create test for 1000+ package scenario
- Define performance targets:
  - Search should complete in <100ms for 1000 packages
  - Search should complete in <200ms for 5000 packages

**GREEN Phase**:
- Implement performance measurement helpers
- Add console.time/timeEnd for development
- Create mock data generator for large repos

**REFACTOR Phase**:
- Extract reusable performance testing utilities
- Document performance targets

**VERIFY Phase**:
- Run performance tests
- Verify targets are met

### Cycle 3: Optimize Search Performance

**RED Phase**:
- Write tests that fail current performance targets
- Test with realistic package/script distributions

**GREEN Phase**:
- Implement search optimizations:
  - Cache lowercased text and word splits
  - Use early termination in matching logic
  - Consider debouncing search input
  - Optimize regex for word splitting

**REFACTOR Phase**:
- Extract caching logic if beneficial
- Simplify any complex optimizations

**VERIFY Phase**:
- Re-run performance benchmarks
- Ensure all functional tests still pass

### Cycle 4: Improve User Experience for No Results

**RED Phase**:
- Write tests for "no results" scenarios:
  - Search with no matches should show helpful message
  - Message should be non-selectable
  - Should use VS Code icons for consistency

**GREEN Phase**:
- Implement "no results" feedback:
  ```typescript
  const NO_RESULTS_ITEM: Partial<ScriptQuickPickItem> = {
    label: '$(search) No scripts found',
    description: 'Try adjusting your search terms',
    alwaysShow: true
  }
  ```
- Add to search results when empty

**REFACTOR Phase**:
- Extract UI constants
- Ensure consistent messaging

**VERIFY Phase**:
- Manual testing with VS Code
- Verify accessibility with screen readers

### Cycle 5: Add Loading States for Better UX

**RED Phase**:
- Write tests for loading states:
  - QuickPick should show busy during initial load
  - Should handle async package discovery

**GREEN Phase**:
- Implement busy state:
  ```typescript
  quickPick.busy = true
  const allItems = await createScriptQuickPickItems(packages)
  quickPick.busy = false
  ```

**REFACTOR Phase**:
- Consider if async is beneficial
- Keep implementation simple

**VERIFY Phase**:
- Test with slow package discovery
- Ensure smooth user experience

## Performance Measurement Details

### Benchmark Structure
```typescript
type PerformanceBenchmark = {
  packageCount: number
  scriptPerPackage: number
  searchQuery: string
  expectedMaxMs: number
}

const benchmarks: PerformanceBenchmark[] = [
  { packageCount: 100, scriptPerPackage: 10, searchQuery: "test dev", expectedMaxMs: 50 },
  { packageCount: 1000, scriptPerPackage: 10, searchQuery: "build prod", expectedMaxMs: 100 },
  { packageCount: 5000, scriptPerPackage: 10, searchQuery: "start mob", expectedMaxMs: 200 }
]
```

### Measurement Approach
- Use performance.now() for precise timing
- Run each benchmark multiple times and average
- Fail tests if 95th percentile exceeds target
- Log results for CI tracking

## Error Handling Details

### Input Validation
```typescript
const validateSearchInput = (input: string): string => {
  // Trim whitespace
  const trimmed = input.trim()
  
  // Enforce max length
  if (trimmed.length > MAX_SEARCH_LENGTH) {
    return trimmed.slice(0, MAX_SEARCH_LENGTH)
  }
  
  return trimmed
}
```

### Edge Cases to Handle
1. **Empty/Whitespace**: Return all results
2. **Very Long Input**: Truncate to reasonable length (e.g., 200 chars)
3. **Special Characters**: Should not break regex
4. **Unicode/Emoji**: Should work correctly
5. **Performance**: Should not freeze UI even with pathological input

## Final Verification

1. **Functional Tests**
   - All existing tests pass
   - New edge case tests pass
   - Performance benchmarks meet targets

2. **Manual Testing**
   - Test with real VS Code instance
   - Verify with large monorepo
   - Check accessibility
   - Test on different platforms

3. **Code Quality**
   - Run: `pnpm validate`
   - No TypeScript errors
   - Clean lint results
   - Well-structured code

## Success Criteria

- Search remains fast even with 5000+ packages
- Edge cases don't crash or freeze the extension  
- Users get helpful feedback when no results found
- Loading states provide good perceived performance
- All tests pass with 100% behavior coverage