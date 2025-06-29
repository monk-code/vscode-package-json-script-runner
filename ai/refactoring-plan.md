# Refactoring Plan: Consolidate Duplicate Functions

## Goal
Refactor the duplicated functions to have a single function with optional recent commands support.

## Implementation Plan

### Cycle 1: Refactor executeScript to support optional recent commands
- RED: Write tests for executeScript with optional recent commands parameter
- GREEN: Modify executeScript to accept optional recentCommandsManager and workspaceFolder
- REFACTOR: Remove executeScriptWithRecent function
- VERIFY: Run tests, lint, format, and types:check
- REPEAT until all checks pass

### Cycle 2: Update all executeScript callers
- RED: Write tests ensuring backward compatibility
- GREEN: Update extension.ts to use the refactored executeScript
- REFACTOR: Update imports and remove references to executeScriptWithRecent
- VERIFY: Run all tests
- REPEAT until clean

### Cycle 3: Refactor showScriptPicker to support optional recent commands
- RED: Write tests for showScriptPicker with optional recent commands
- GREEN: Modify showScriptPicker to accept optional workspaceRoot and recentCommandsManager
- REFACTOR: Extract common logic, remove showScriptPickerWithRecent
- VERIFY: Run tests, lint, format, and types:check
- REPEAT until all checks pass

### Cycle 4: Update all showScriptPicker callers
- RED: Write tests ensuring backward compatibility
- GREEN: Update extension.ts to use the refactored showScriptPicker
- REFACTOR: Update imports and exports
- VERIFY: Run all tests
- REPEAT until clean

### Cycle 5: Clean up test files
- RED: Consolidate test files for the unified functions
- GREEN: Ensure all test cases from both versions are covered
- REFACTOR: Remove duplicate test files
- VERIFY: Ensure 100% coverage maintained
- REPEAT until all tests pass

### Final Verification
- Run full validation suite with `pnpm validate`
- Ensure all tests pass
- Verify no breaking changes to public API
- Check that recent commands feature still works in VS Code