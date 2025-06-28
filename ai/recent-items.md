# Recent Commands Feature - Implementation Plan

## Current Progress (As of 2025-06-28)

### Completed Cycles
- ✅ **Cycle 1**: Recent Commands Manager with Data Migration Support
- ✅ **Cycle 2**: Validation Logic  
- ✅ **Cycle 3**: Track Command Execution with Concurrent Access Safety
- ✅ **Cycle 4**: Create Recent Items for Quick Pick
- ✅ **Cycle 5**: Integrate with Script Picker
- ✅ **Cycle 6**: Visual Polish with Accessibility

### Implementation Details

#### Created Files
- `src/types/recent-command.ts` - Type definitions for RecentCommand and RecentCommandsStorage
- `src/recent-commands/recent-commands-manager.ts` - Core manager with data migration support
- `src/recent-commands/recent-commands-validator.ts` - Validation logic for stale entries
- `src/recent-commands/create-recent-quick-pick-items.ts` - Visual formatting with icons and time display
- `src/script-execution/execute-script.ts` - Enhanced with executeScriptWithRecent function
- `src/script-quick-pick/show-script-picker.ts` - Added showScriptPickerWithRecent function

#### Test Coverage
- `src/__tests__/recent-commands/recent-commands-manager.spec.ts` - 11 tests
- `src/__tests__/recent-commands/recent-commands-validator.spec.ts` - 7 tests  
- `src/__tests__/recent-commands/create-recent-quick-pick-items.spec.ts` - 6 tests
- `src/__tests__/recent-commands/visual-accessibility.spec.ts` - 9 tests
- `src/__tests__/script-quick-pick/show-script-picker-with-recent.spec.ts` - 6 tests

### Key Implementation Decisions

1. **Visual Enhancements**: 
   - Script-specific icons (beaker for test, package for build, play for dev, etc.)
   - Time-based descriptions ("Just now", "5 minutes ago", "Yesterday", etc.)
   - Removed tooltip/ariaLabel properties as VS Code generates these from label/description/detail

2. **Fire-and-Forget Pattern**: 
   - Command tracking doesn't block script execution
   - Errors in saving recent commands are logged but don't affect functionality

3. **Type Safety**: 
   - Using type guards for mixed QuickPickItem types
   - Strict TypeScript with no any types

4. **Data Migration**: 
   - Implemented version-based migration from unversioned to versioned format
   - Future-proof structure for additional migrations

### Remaining Work

- **Cycle 7**: Edge Cases & Performance with Storage Limits
- **Cycle 8**: Error Handling and Robustness with Offline Scenarios  
- **Cycle 9**: Performance Considerations (Validation and Storage)
- **Cycle 10**: Documentation
- **Cycle 11**: Privacy Controls and Command Palette Integration
- **Cycle 12**: User Configuration

## Feature Analysis
Excellent UX improvement with clear benefits:
- Significant time savings for repetitive tasks
- Reduced cognitive load
- Enhanced discoverability of frequently used scripts
- Improved workflow efficiency

## Revised Design Decisions

1. **Storage Scope**: Use `workspaceState` instead of `globalState` to keep recent commands workspace-specific
2. **Data Structure**:
   ```typescript
   type RecentCommand = {
     scriptName: string
     packageName: string
     packagePath: string      // Relative to workspace root
     scriptCommand: string    // For display
     timestamp: number
     workspaceFolder?: string // For multi-root workspace support
   }
   
   type RecentCommandsStorage = {
     version: number         // For future migration support
     commands: RecentCommand[]
   }
   // Note: All updates to RecentCommand data should ensure immutability, creating new objects/arrays rather than modifying in place.
   ```
3. **Deduplication Key**: Use `packageName + scriptName` composite
4. **Storage Limit**: 15 items (good balance)
5. **Visual Design**: 
   - Use `$(history)` icon in label
   - QuickPickItemKind.Separator for section division
   - "Recently run" in description field

## Implementation Plan

### Cycle 1: Create Recent Commands Manager with Data Migration Support
- RED: Write tests for storing/retrieving recent commands with workspace scope and version handling
- GREEN: Implement recent-commands-manager.ts with workspaceState and migration logic
- REFACTOR: Extract constants (STORAGE_KEY, MAX_ITEMS, CURRENT_VERSION)
- CONSIDERATIONS: 
  - Store data with version field for future migrations
  - Handle multi-root workspace contexts
  - Test migration from unversioned to versioned format, and from specific older versions (e.g., `version: 1` to `version: 2`) or when the `version` field is absent.
- VERIFY: Run tests, lint, types:check

### Cycle 2: Add Validation Logic
- RED: Write tests for validating stale entries
- GREEN: Implement validation against current package.json files
- REFACTOR: Extract validation functions
- CONSIDERATIONS:
  - If the `scriptCommand` for an existing entry has changed in `package.json`, update the stored `scriptCommand` to reflect the latest version.
- VERIFY: All checks pass

### Cycle 3: Track Command Execution with Concurrent Access Safety
- RED: Write tests for tracking executed scripts and concurrent access scenarios
- GREEN: Update executeScript to save to recent commands using safe read-modify-write pattern
- REFACTOR: Ensure clean separation of concerns
- CONSIDERATIONS:
  - Implement atomic updates to handle concurrent VS Code windows
  - Use update callbacks instead of direct get/set where possible
- VERIFY: All checks pass

### Cycle 4: Create Recent Items for Quick Pick
- RED: Write tests for creating recent QuickPickItems
- GREEN: Implement createRecentQuickPickItems function
- REFACTOR: Extract item formatting logic
- VERIFY: All checks pass

### Cycle 5: Integrate with Script Picker
- RED: Write tests for conditional display logic
- GREEN: Update showScriptPicker to show recent items when search empty
- REFACTOR: Ensure clean code structure
- VERIFY: All checks pass

### Cycle 6: Visual Polish with Accessibility
- RED: Write tests for separator, formatting, and screen reader compatibility
- GREEN: Add separator, icons, proper ordering, and ARIA labels
- REFACTOR: Extract visual constants
- CONSIDERATIONS:
  - Test with screen readers for proper announcements
  - Ensure keyboard navigation is intuitive
  - Add appropriate ARIA labels for recent items section
- VERIFY: All checks pass

### Cycle 7: Edge Cases & Performance with Storage Limits
- RED: Write tests for edge cases and storage size validation
- GREEN: Handle all edge cases (empty state, max items, invalid paths, storage size)
- REFACTOR: Optimize if needed
- CONSIDERATIONS:
  - Validate total storage size, not just item count
  - Test with extremely long script names/paths
  - Implement truncation strategy if storage exceeds limits (e.g., 100KB)
  - Consider serialization size of the entire storage object
- VERIFY: Full test coverage

### Cycle 8: Error Handling and Robustness with Offline Scenarios
- RED: Write tests for `workspaceState` read/write errors, unexpected data formats, and offline scenarios
- GREEN: Implement robust error handling with graceful degradation
- REFACTOR: Ensure clear error reporting without disrupting user experience
- CONSIDERATIONS:
  - Handle workspace state unavailability gracefully
  - Continue extension functionality without recent commands if storage fails
  - Log errors appropriately without showing error dialogs
  - Implement fallback behavior for all storage operations
  - Handle race conditions from concurrent access
- VERIFY: All checks pass

### Cycle 9: Performance Considerations (Validation and Storage)
- RED: Write tests to simulate large workspaces/many recent commands and large storage objects.
- GREEN: Implement performance optimizations for validation (e.g., debouncing, asynchronous validation, caching, incremental validation) and for `workspaceState` serialization/deserialization.
- REFACTOR: Ensure minimal impact on UI responsiveness.
- CONSIDERATIONS:
  - Optimize serialization/deserialization of the `RecentCommandsStorage` object to and from `workspaceState`.
  - Consider the impact of deep cloning if immutability is strictly enforced during read operations.
- VERIFY: Performance benchmarks meet expectations.

### Cycle 10: Documentation
- Update README.md with feature description
- Add usage examples
- Document keyboard behavior
- Document privacy features and clear command functionality

### Cycle 11: Privacy Controls and Command Palette Integration
- RED: Write tests for "Clear Recent Commands" functionality
- GREEN: Implement clear command with confirmation dialog
- Add command contributions to package.json:
  - "Clear Recent Commands" command
  - Optional: "Show Recent Commands" standalone command
- CONSIDERATIONS:
  - Provide user control over their command history
  - Ensure commands are discoverable in command palette
  - Add appropriate command categories and icons
  - Consider adding setting to disable recent commands feature entirely
- VERIFY: Commands work correctly from command palette

### Cycle 12: User Configuration
- RED: Write tests for reading and applying user settings (e.g., `STORAGE_LIMIT`).
- GREEN: Implement VS Code configuration options for recent commands (e.g., `packageJsonScriptRunner.recentCommands.maxItems`, `packageJsonScriptRunner.recentCommands.enabled`).
- REFACTOR: Integrate settings into the `RecentCommandsManager`.
- CONSIDERATIONS:
  - How will changes to `maxItems` affect existing stored data (e.g., if the limit is reduced, which items are kept)?
- VERIFY: Settings are applied correctly and persist across sessions.

## Technical Implementation Details

### 1. Storage Key
`vscodePackageJsonScriptRunner.recentCommands`

### 2. Visual Format
```
$(history) build (frontend)     Recently run
$(history) test (backend)       Recently run
──────────────────────────────────────────
build (frontend)
test (backend)
dev (root)
```

### 3. Deduplication Logic
- When executing: Remove existing entry, add to front
- Maintain order by most recent usage

### 4. Validation Flow
- Check if package.json exists at stored path
- Verify script still exists in that package.json
- Remove invalid entries before display

### 5. Extension Context Flow
- Pass context from activate() → showScriptPicker() → createRecentItems()
- Pass context from activate() → executeScript() → saveRecentCommand()

### 6. Command Contributions
```json
{
  "contributes": {
    "commands": [
      {
        "command": "packageJsonScriptRunner.clearRecentCommands",
        "title": "Clear Recent Commands",
        "category": "Package Script Runner"
      }
    ]
  }
}
```

## Files to Create/Modify

### New Files
- `src/recent-commands/recent-commands-manager.ts`
- `src/recent-commands/create-recent-quick-pick-items.ts`
- `src/__tests__/recent-commands/*.spec.ts`
- `src/types/recent-command.ts` (Explicitly define `RecentCommand` type here, adhering to project's TypeScript guidelines.)

### Modified Files
- `src/extension/extension.ts` (pass context)
- `src/script-execution/execute-script.ts` (save command)
- `src/script-quick-pick/show-script-picker.ts` (display recent)
- `README.md` (document feature)

## Benefits Summary
- Reduces repetitive searching
- Improves muscle memory with consistent ordering
- Makes extension feel more intelligent
- Maintains clean separation when user starts typing
- Workspace-specific history is more relevant than global

## Key Improvements from Original Design
1. **Workspace-specific storage** instead of global - more relevant history
2. **Relative paths** instead of absolute - portable across machines
3. **Include scriptCommand** in data structure for display
4. **Use workspaceState** for proper workspace isolation
5. **Clear implementation path** with TDD cycles
6. **Data migration support** with versioned storage format
7. **Privacy controls** with clear command functionality
8. **Multi-root workspace support** with workspace folder context
9. **Concurrent access safety** with atomic updates
10. **Storage size limits** beyond just item count
11. **Accessibility features** with screen reader support
12. **Graceful degradation** for offline/error scenarios
13. **Command palette integration** for user control