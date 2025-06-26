# VS Code Monorepo Script Runner Extension

## Executive Summary

### The Problem
**Developers working in monorepos waste significant time manually finding and executing package.json scripts across multiple packages.** 

In a typical monorepo with 20+ packages, developers must:
- Navigate to specific package directories in terminal
- Remember exact script names across different packages
- Type full commands repeatedly throughout the day
- Switch contexts between code editor and terminal constantly

**This results in:**
- 5-10 minutes lost per hour on script execution overhead
- Frequent errors from running scripts in wrong directories
- Cognitive load from memorizing script locations and names
- Broken development flow from constant context switching

### The Context
Modern JavaScript monorepos (using tools like pnpm workspaces, Yarn workspaces, or Lerna) contain dozens to hundreds of packages, each with their own package.json scripts. VS Code's built-in task runner only shows root-level tasks, completely missing the distributed nature of monorepo scripts.

**Current alternatives fall short:**
- **Manual terminal navigation**: Time-consuming and error-prone
- **VS Code Tasks**: Only shows root workspace scripts
- **Existing extensions**: Either lack fuzzy search (Package Scripts Runner) or are framework-specific (Nx Console)

### The Solution
**A VS Code extension that provides instant, keyboard-driven access to ALL package.json scripts across your entire monorepo with fuzzy search and one-click execution.**

**Key Value Propositions:**
1. **Save 30+ minutes per day** through instant script discovery and execution
2. **Eliminate context switching** with in-editor script running
3. **Reduce errors** by automatically executing in correct package directory
4. **Improve discoverability** of available scripts across all packages

**Core Features:**
- **Universal Script Discovery**: Automatically finds all package.json scripts in workspace
- **Fuzzy Search Interface**: Type partial names to instantly find any script
- **Smart Execution**: Runs scripts in correct directory with appropriate package manager
- **Zero Configuration**: Works out-of-the-box with any monorepo structure

---

## Implementation Plan

This project will be executed following a strict Test-Driven Development (TDD) methodology. Each feature will be implemented by first writing a failing test (Red), then writing the minimum code to make the test pass (Green), and finally refactoring to improve the design while keeping tests green (Refactor).

### Phase 1: Foundation & Discovery (Week 1)

#### Step 1.1: Project Setup with TDD
**Business Value**: Ensures maintainable, bug-free extension from day one

**Actions:**
1. Scaffold VS Code extension with TypeScript
2. Configure strict typing and linting
3. Set up Vitest for test-driven development
4. Create mock monorepo structure for testing

#### Step 1.2: Script Discovery Engine
**Business Value**: Core feature that enables all other functionality

**TDD Implementation (Red-Green-Refactor):**

**Red Phase:**
```typescript
// Write failing test first
describe('Script Discovery', () => {
  test('discovers all executable scripts across monorepo', async () => {
    const scripts = await discoverScripts(mockWorkspace)
    expect(scripts).toContainEqual({
      name: 'build',
      package: '@mycompany/ui-components',
      path: '/packages/ui-components',
      command: 'vite build'
    })
  })
  
  test('excludes node_modules directories', async () => {
    const scripts = await discoverScripts(mockWorkspaceWithNodeModules)
    expect(scripts.every(s => !s.path.includes('node_modules'))).toBe(true)
  })
  
  test('handles malformed package.json gracefully', async () => {
    const scripts = await discoverScripts(mockWorkspaceWithInvalidJson)
    expect(scripts).toBeDefined()
    // Should not throw
  })
})
```

**Green Phase:**
- Implement `discoverScripts` function using glob pattern `**/package.json`
- Parse JSON and extract scripts object
- Return structured list of script objects

**Refactor Phase:**
- Handle errors gracefully for malformed JSON
- Optimize file reading with async/await
- Improve data structure clarity

### Phase 2: User Experience (Week 2)

#### Step 2.1: Fuzzy Search Interface
**Business Value**: Enables developers to find scripts in <2 seconds

**TDD Implementation (Red-Green-Refactor):**

**Red Phase:**
```typescript
describe('Quick Pick Interface', () => {
  test('displays all scripts with package context', async () => {
    const quickPick = await showScriptPicker(mockScripts)
    expect(vscode.window.createQuickPick).toHaveBeenCalled()
    expect(quickPick.items).toContainEqual(
      expect.objectContaining({
        label: 'build',
        description: 'packages/ui-components',
        detail: 'vite build'
      })
    )
  })
  
  test('executes selected script with correct package manager', async () => {
    const quickPick = await showScriptPicker(mockScripts)
    // Simulate user selection
    quickPick.onDidAccept()
    expect(executeScript).toHaveBeenCalledWith(
      expect.objectContaining({
        command: 'pnpm --filter @mycompany/ui-components build'
      })
    )
  })
})
```

**Green Phase:**
- Implement `showScriptPicker` with VS Code QuickPick API
- Integrate Fuse.js for fuzzy search
- Format items with package context

**Refactor Phase:**
- Improve item formatting for clarity
- Add visual grouping by package
- Optimize search performance

#### Step 2.2: Keyboard-Driven Workflow
**Business Value**: Maintains developer flow state

**Features:**
- Single hotkey activation (Ctrl+Shift+R)
- Type-to-search instantly
- Enter to execute
- Never leave the keyboard

### Phase 3: Reliable Execution (Week 3)

#### Step 3.1: Smart Terminal Management
**Business Value**: Ensures scripts run correctly every time

**TDD Implementation (Red-Green-Refactor):**

**Red Phase:**
```typescript
describe('Script Execution Engine', () => {
  test('detects package manager from lock files', async () => {
    const pm = await detectPackageManager(mockWorkspaceWithPnpm)
    expect(pm).toBe('pnpm')
  })
  
  test('executes script with package manager filter flag', async () => {
    const mockTerminal = jest.mocked(vscode.window.createTerminal)
    await executeScript({
      name: 'test',
      package: '@scope/package-name',
      path: '/packages/package-name'
    })
    
    expect(mockTerminal).toHaveBeenCalledWith({
      name: 'Script: test (@scope/package-name)',
      cwd: '/packages/package-name'
    })
    expect(terminal.sendText).toHaveBeenCalledWith(
      'pnpm --filter @scope/package-name test'
    )
  })
})
```

**Green Phase:**
- Implement package manager detection based on lock files
- Create terminals with correct working directory
- Use package manager filter flags for proper execution

**Refactor Phase:**
- Abstract package manager detection to utility function
- Add support for yarn workspaces and npm workspaces
- Improve terminal naming and context display

### Phase 4: Performance at Scale (Week 4)

#### Step 4.1: Caching & Optimization
**Business Value**: Instant response even in 100+ package monorepos

**TDD Implementation (Red-Green-Refactor):**

**Red Phase:**
```typescript
describe('File Watching & Caching', () => {
  test('updates cache when package.json changes', async () => {
    const watcher = await watchWorkspaces(mockWorkspace)
    const initialScripts = await getScriptsFromCache()
    
    // Simulate file change
    mockFileChange('/packages/ui/package.json')
    await wait(600) // Wait for debounce
    
    const updatedScripts = await getScriptsFromCache()
    expect(updatedScripts).not.toEqual(initialScripts)
  })
  
  test('debounces rapid file changes', async () => {
    const discoverSpy = jest.spyOn(scriptDiscovery, 'discoverScripts')
    
    // Simulate rapid changes
    mockFileChange('/packages/a/package.json')
    mockFileChange('/packages/b/package.json')
    mockFileChange('/packages/c/package.json')
    
    await wait(600)
    expect(discoverSpy).toHaveBeenCalledTimes(1) // Only once after debounce
  })
})
```

**Green Phase:**
- Implement file system watcher for `**/package.json`
- Add in-memory cache with incremental updates
- Implement debouncing for rapid changes

**Refactor Phase:**
- Optimize cache invalidation strategy
- Add configurable exclusion patterns
- Ensure proper resource cleanup

### Phase 5: Productivity Enhancers (Week 5)

#### Step 5.1: Usage Intelligence
**Business Value**: Further time savings through smart defaults

**Features:**
- Recently used scripts appear first
- Favorite frequently used scripts
- Package-specific history

### Phase 6: Launch & Distribution (Week 6)

#### Step 6.1: Marketplace Release
**Business Value**: Make solution available to all VS Code users

**Deliverables:**
- Polished extension with <10MB footprint
- Comprehensive documentation with GIFs
- VS Code Marketplace listing
- GitHub repository for community contributions

---

## Technical Implementation Details

### Module Architecture

```typescript
// Pure functional approach
export type MonorepoScriptRunner = {
  readonly discoverPackages: (folders: readonly vscode.WorkspaceFolder[]) => Promise<readonly PackageInfo[]>
  readonly createQuickPick: (packages: readonly PackageInfo[]) => vscode.QuickPick<ScriptQuickPickItem>
  readonly executeScript: (item: ScriptQuickPickItem) => Promise<void>
  readonly cacheManager: CacheManager
  readonly packageManagerDetector: PackageManagerDetector
}
```

### File Structure
```
src/
├── extension.ts              # Entry point
├── package-discovery.ts      # Package.json scanning
├── script-quick-pick.ts      # QuickPick interface
├── script-execution.ts       # Terminal management
├── cache-manager.ts          # Performance caching
├── package-manager.ts        # Detection logic
├── file-watcher.ts          # Real-time updates
└── types/
    ├── package-info.ts       # Core types
    └── quick-pick-item.ts    # UI types
```

---

## Success Metrics

### Business Metrics
**Quantifiable Benefits:**
- **Time Saved**: 30+ minutes per developer per day
- **Error Reduction**: 90% fewer wrong-directory script executions  
- **Adoption**: 1000+ installs within first month
- **User Satisfaction**: 4.5+ star marketplace rating

### Technical Metrics
**Automated Test Coverage:**
- **Script Discovery Accuracy**: 100% of package.json files within workspace are found
  - Measurement: Automated test with complex mock directory structure
- **Execution Command Correctness**: 100% correct command generation for each package manager
  - Measurement: Tests verify commands for pnpm, yarn, and npm
- **UI Flow Completion**: 100% successful execution trigger from QuickPick selection
  - Measurement: Mock QuickPick tests with user simulation
- **File Watcher Responsiveness**: All package.json changes trigger cache refresh
  - Measurement: File system event simulation tests

**Performance Targets:**
- **Extension Activation**: <200ms
- **QuickPick Opening**: <100ms for cached results  
- **Full Workspace Scan**: <500ms for first-time discovery
- **Memory Footprint**: <10MB for large monorepos

**Target Users:**
- Frontend teams using monorepo architectures
- Full-stack developers working across multiple packages
- DevOps engineers managing complex build pipelines
- Any team with 5+ packages in their repository

This extension transforms script execution from a repetitive chore into an instant, delightful experience that keeps developers in their flow state.