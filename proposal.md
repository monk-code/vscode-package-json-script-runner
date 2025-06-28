# Proposal: Improve Script Quick Pick Filtering

## Problem

The current script quick pick filter, which utilizes `Fuse.js` for fuzzy searching, is too restrictive when users attempt to search by partial package names. While exact script name matches work as expected, typing a partial package name (e.g., "mob" for a package named "mobile-app") yields no results. This behavior stems from the `Fuse.js` configuration's `threshold` parameter being set too low, preventing sufficiently "fuzzy" matches for partial inputs.

## Proposed Solution

To address this, we will adjust the `Fuse.js` configuration within the `createFuseSearch` function in `src/script-quick-pick/show-script-picker.ts`.

Specifically, we propose increasing the `threshold` option for `Fuse.js` from its current value of `0.3` to a higher value, such as `0.6` or `0.7`.

### Rationale

The `threshold` parameter in `Fuse.js` dictates how close a match must be to the search query. A value of `0.0` demands a perfect match, whereas `1.0` would match anything. The existing `0.3` threshold is too stringent for the desired behavior of matching partial package names. By increasing this value, we allow for more flexibility in the fuzzy search algorithm, enabling the quick pick to return relevant results even when the user provides only a partial segment of a package name. This change will significantly enhance the user experience by making the search more intuitive and forgiving.

### Implementation Details (High-Level)

1.  Locate the `createFuseSearch` function in `src/script-quick-pick/show-script-picker.ts`.
2.  Modify the `threshold` property within the `Fuse` constructor options.

```typescript
// Before
const createFuseSearch = (items: readonly ScriptQuickPickItem[]) => {
  return new Fuse(items, {
    keys: ['scriptName', 'description'],
    threshold: 0.3, // Current value
  })
}

// After (Example with 0.6 threshold)
const createFuseSearch = (items: readonly ScriptQuickPickItem[]) => {
  return new Fuse(items, {
    keys: ['scriptName', 'description'],
    threshold: 0.6, // Proposed new value
  })
}
```

### Testing Considerations

After implementing this change, thorough testing will be crucial to determine the optimal `threshold` value. We should test with various partial inputs for both script names and package names to ensure that the search results are relevant and that the balance between leniency and accuracy is achieved.
