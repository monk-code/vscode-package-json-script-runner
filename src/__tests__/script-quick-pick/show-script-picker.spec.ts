import { describe, expect, test, vi } from 'vitest'
import * as vscode from 'vscode'

import type { PackageInfo } from '#/types/package-info.js'
import type { ScriptQuickPickItem } from '#/types/script-quick-pick-item.js'
import type { RecentCommandsManager } from '#/recent-commands/recent-commands-manager.js'

import { showScriptPicker } from '#/script-quick-pick/show-script-picker.js'
import { createTestQuickPick } from './test-helpers.js'

vi.mock('vscode', () => ({
  window: {
    createQuickPick: vi.fn(),
  },
  QuickPickItemKind: {
    Separator: -1,
    Default: 0,
  },
}))

vi.mock('#/recent-commands/recent-commands-manager.js', () => ({
  RecentCommandsManager: vi.fn(() => ({
    getValidatedRecentCommands: vi.fn().mockResolvedValue([]),
  })),
}))

vi.mock('#/recent-commands/create-recent-quick-pick-items.js', () => ({
  createRecentQuickPickItems: vi.fn().mockReturnValue([]),
}))

// Helper to wait for async QuickPick updates
const waitForQuickPickUpdate = async () => {
  // Wait for Promise.resolve() microtask queue to flush
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('showScriptPicker', () => {
  const mockPackages: PackageInfo[] = [
    {
      path: '/workspace/packages/ui-components',
      name: '@mycompany/ui-components',
      scripts: {
        build: 'vite build',
        test: 'vitest',
        dev: 'vite dev',
      },
    },
    {
      path: '/workspace/packages/api-server',
      name: '@mycompany/api-server',
      scripts: {
        start: 'node index.js',
        test: 'jest',
        'test:watch': 'jest --watch',
      },
    },
    {
      path: '/workspace/apps/web',
      name: '@mycompany/web',
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
      },
    },
  ]

  test('creates quick pick with all scripts from all packages', () => {
    const { quickPick } = createTestQuickPick()

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

    showScriptPicker(mockPackages)

    expect(vscode.window.createQuickPick).toHaveBeenCalled()
    expect(quickPick.items).toHaveLength(9) // Total scripts across all packages
    expect(quickPick.placeholder).toBe('Search for a script to run...')
    expect(quickPick.show).toHaveBeenCalled()
  })

  test('formats quick pick items with correct labels and descriptions', () => {
    const { quickPick } = createTestQuickPick()

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

    showScriptPicker(mockPackages)

    const items = quickPick.items
    const buildItem = items.find(
      (item) =>
        item.scriptName === 'build' &&
        item.packageName === '@mycompany/ui-components'
    )

    expect(buildItem).toBeDefined()
    expect(buildItem?.label).toBe('build (@mycompany/ui-components)')
    expect(buildItem?.description).toBe('')
    expect(buildItem?.detail).toBe('vite build')
  })

  test('returns selected script information when user accepts', async () => {
    const { quickPick, triggerAccept } = createTestQuickPick()

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

    const resultPromise = showScriptPicker(mockPackages)

    // Simulate user selecting an item
    const selectedItem: ScriptQuickPickItem = {
      label: 'build',
      description: '@mycompany/ui-components',
      detail: 'vite build',
      packageName: '@mycompany/ui-components',
      packagePath: '/workspace/packages/ui-components',
      scriptName: 'build',
      scriptCommand: 'vite build',
    }
    quickPick.selectedItems = [selectedItem]

    // Simulate user accepting
    triggerAccept()

    const result = await resultPromise
    expect(result).toEqual({
      packageName: '@mycompany/ui-components',
      packagePath: '/workspace/packages/ui-components',
      scriptName: 'build',
      scriptCommand: 'vite build',
    })
    expect(quickPick.dispose).toHaveBeenCalled()
  })

  test('returns undefined when user cancels', async () => {
    const { quickPick, triggerHide } = createTestQuickPick()

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

    const resultPromise = showScriptPicker(mockPackages)

    // Simulate user canceling (hiding without accepting)
    triggerHide()

    const result = await resultPromise
    expect(result).toBeUndefined()
    expect(quickPick.dispose).toHaveBeenCalled()
  })

  test('registers value change handler for search', () => {
    const { quickPick } = createTestQuickPick()

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

    showScriptPicker(mockPackages)

    // Verify that change handler was registered
    expect(quickPick.onDidChangeValue).toHaveBeenCalled()

    // Verify initial items are set
    expect(quickPick.items).toHaveLength(9)
  })

  test('handles empty package list', () => {
    const { quickPick } = createTestQuickPick()

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

    showScriptPicker([])

    expect(quickPick.items).toHaveLength(0)
    expect(quickPick.placeholder).toBe('No scripts found in workspace')
  })

  test('fuzzy search finds scripts by script name and package name', async () => {
    const { quickPick } = createTestQuickPick()

    // Track items updates
    let currentItems: ScriptQuickPickItem[] = []
    Object.defineProperty(quickPick, 'items', {
      get: () => currentItems,
      set: (value: ScriptQuickPickItem[]) => {
        currentItems = value
      },
      configurable: true,
    })

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

    showScriptPicker(mockPackages)

    // Get the change value handler that was registered
    const changeHandler = vi.mocked(quickPick.onDidChangeValue).mock.calls[0][0]

    // Test searching for "start api" - should find start script from api-server package
    changeHandler('start api')
    await waitForQuickPickUpdate()

    // The handler should have updated the items based on search
    expect(currentItems).toHaveLength(1)
    expect(currentItems[0].scriptName).toBe('start')
    expect(currentItems[0].packageName).toBe('@mycompany/api-server')

    // Test searching for "build ui" - should find build script from ui-components package
    changeHandler('build ui')
    await waitForQuickPickUpdate()

    // Since multiple packages might have "build" scripts, let's check the results
    const buildUiResults = currentItems.filter(
      (item) => item.scriptName === 'build' && item.packageName.includes('ui')
    )
    expect(buildUiResults).toHaveLength(1)
    expect(buildUiResults[0].scriptName).toBe('build')
    expect(buildUiResults[0].packageName).toBe('@mycompany/ui-components')

    // Test searching for "start web" - should find start script from web package
    changeHandler('start web')
    await waitForQuickPickUpdate()

    expect(currentItems).toHaveLength(1)
    expect(currentItems[0].scriptName).toBe('start')
    expect(currentItems[0].packageName).toBe('@mycompany/web')
  })

  test('fuzzy search finds scripts with partial package name match', () => {
    const { quickPick } = createTestQuickPick()

    // Track items updates
    let currentItems: ScriptQuickPickItem[] = []
    Object.defineProperty(quickPick, 'items', {
      get: () => currentItems,
      set: (value: ScriptQuickPickItem[]) => {
        currentItems = value
      },
      configurable: true,
    })

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

    // Add a mobile-app package to simulate the user's scenario
    const packagesWithMobile: PackageInfo[] = [
      ...mockPackages,
      {
        path: '/workspace/packages/mobile-app',
        name: '@test/mobile-app',
        scripts: {
          start: 'expo start',
          build: 'expo build',
          test: 'jest',
        },
      },
    ]

    showScriptPicker(packagesWithMobile)

    // Get the change value handler that was registered
    const changeHandler = vi.mocked(quickPick.onDidChangeValue).mock.calls[0][0]

    // Test the exact scenario from the user: "start mob" should find mobile-app start script
    changeHandler('start mob')

    // First check that we got results (not the "No scripts found" message)
    expect(currentItems.length).toBeGreaterThan(0)
    expect(currentItems[0].label).not.toContain('No scripts found')

    const mobileStartScripts = currentItems.filter(
      (item) => item.scriptName === 'start' && item.packageName.includes('mob')
    )
    expect(mobileStartScripts).toHaveLength(1)
    expect(mobileStartScripts[0].scriptName).toBe('start')
    expect(mobileStartScripts[0].packageName).toBe('@test/mobile-app')
  })

  test('multi-word search finds scripts with partial word matching', async () => {
    const { quickPick } = createTestQuickPick()

    // Track items updates
    let currentItems: ScriptQuickPickItem[] = []
    Object.defineProperty(quickPick, 'items', {
      get: () => currentItems,
      set: (value: ScriptQuickPickItem[]) => {
        currentItems = value
      },
      configurable: true,
    })

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

    // Add packages with various word boundaries to test partial matching
    const packagesWithWordBoundaries: PackageInfo[] = [
      {
        path: '/workspace/packages/mobile-app',
        name: '@test/mobile-app',
        scripts: {
          start: 'expo start',
          'start:dev': 'expo start --dev',
          build: 'expo build',
        },
      },
      {
        path: '/workspace/packages/mobility-service',
        name: '@company/mobility-service',
        scripts: {
          start: 'node index.js',
          test: 'jest',
        },
      },
      {
        path: '/workspace/packages/mob-tool',
        name: 'mob-tool',
        scripts: {
          start: 'node start.js',
        },
      },
      {
        path: '/workspace/packages/demo-app',
        name: '@test/demo-app',
        scripts: {
          start: 'node demo.js',
        },
      },
    ]

    showScriptPicker(packagesWithWordBoundaries)

    // Get the change value handler that was registered
    const changeHandler = vi.mocked(quickPick.onDidChangeValue).mock.calls[0][0]

    // Test 1: "start mob" should find all packages with words starting with "mob"
    changeHandler('start mob')
    await waitForQuickPickUpdate()
    const startMobResults = currentItems.filter(
      (item) => item.scriptName === 'start' || item.scriptName === 'start:dev'
    )

    // This test will fail because current implementation uses includes()
    // which would incorrectly match "demo-app" since "demo" contains "mo"
    // We only want packages where a word starts with "mob"
    expect(startMobResults).toHaveLength(4) // start and start:dev from mobile-app, start from mobility-service, start from mob-tool
    expect(startMobResults.map((item) => item.packageName).sort()).toEqual([
      '@company/mobility-service',
      '@test/mobile-app',
      '@test/mobile-app', // for start:dev
      'mob-tool',
    ])

    // Test 2: "build mob" should find build scripts only from packages with words starting with "mob"
    changeHandler('build mob')
    await waitForQuickPickUpdate()
    const buildMobResults = currentItems
    expect(buildMobResults).toHaveLength(1)
    expect(buildMobResults[0].packageName).toBe('@test/mobile-app')
    expect(buildMobResults[0].scriptName).toBe('build')

    // Test 3: "test serv" should find test scripts only from packages with words starting with "serv"
    changeHandler('test serv')
    await waitForQuickPickUpdate()
    const testServResults = currentItems
    expect(testServResults).toHaveLength(1)
    expect(testServResults[0].packageName).toBe('@company/mobility-service')
    expect(testServResults[0].scriptName).toBe('test')

    // Test 4: Edge case - "start mo" should NOT find "demo-app" since "mo" is in the middle of "demo"
    changeHandler('start mo')
    await waitForQuickPickUpdate()
    const startMoResults = currentItems
    // Should not include @test/demo-app
    expect(
      startMoResults.every((item) => item.packageName !== '@test/demo-app')
    ).toBe(true)
  })

  test('multi-word search handles edge cases correctly', async () => {
    const { quickPick } = createTestQuickPick()

    // Track items updates
    let currentItems: ScriptQuickPickItem[] = []
    Object.defineProperty(quickPick, 'items', {
      get: () => currentItems,
      set: (value: ScriptQuickPickItem[]) => {
        currentItems = value
      },
      configurable: true,
    })

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

    // Add packages with edge cases
    const packagesWithEdgeCases: PackageInfo[] = [
      {
        path: '/workspace/packages/api',
        name: '@company/api',
        scripts: {
          start: 'node server.js',
          'start:dev': 'nodemon server.js',
        },
      },
      {
        path: '/workspace/packages/api-client',
        name: '@company/api-client',
        scripts: {
          build: 'tsc',
          test: 'jest',
        },
      },
      {
        path: '/workspace/packages/API-Gateway',
        name: '@company/API-Gateway',
        scripts: {
          start: 'node gateway.js',
        },
      },
      {
        path: '/workspace/apps/mobile_app',
        name: '@test/mobile_app',
        scripts: {
          'dev:ios': 'expo start --ios',
          'dev:android': 'expo start --android',
        },
      },
      {
        path: '/workspace/packages/mobile-web',
        name: 'mobile-web',
        scripts: {
          serve: 'vite serve',
        },
      },
    ]

    showScriptPicker(packagesWithEdgeCases)

    // Get the change value handler that was registered
    const changeHandler = vi.mocked(quickPick.onDidChangeValue).mock.calls[0][0]

    // Test 1: Case insensitive matching
    changeHandler('start API')
    await waitForQuickPickUpdate()
    const apiResults = currentItems
    expect(apiResults).toHaveLength(3) // start and start:dev from @company/api, start from @company/API-Gateway
    expect(apiResults.map((item) => item.packageName)).toContain('@company/api')
    expect(apiResults.map((item) => item.packageName)).toContain(
      '@company/API-Gateway'
    )

    // Test 2: Underscore as word separator
    changeHandler('dev mobile')
    await waitForQuickPickUpdate()
    const mobileDevResults = currentItems
    expect(mobileDevResults).toHaveLength(2) // dev:ios and dev:android from @test/mobile_app
    expect(
      mobileDevResults.every((item) => item.packageName === '@test/mobile_app')
    ).toBe(true)

    // Test 3: Hyphen word boundaries
    changeHandler('build client')
    await waitForQuickPickUpdate()
    const clientBuildResults = currentItems
    expect(clientBuildResults).toHaveLength(1)
    expect(clientBuildResults[0].packageName).toBe('@company/api-client')
    expect(clientBuildResults[0].scriptName).toBe('build')

    // Test 4: Package name with @ symbol
    changeHandler('test company')
    await waitForQuickPickUpdate()
    const companyTestResults = currentItems
    expect(companyTestResults).toHaveLength(1)
    expect(companyTestResults[0].packageName).toBe('@company/api-client')
    expect(companyTestResults[0].scriptName).toBe('test')

    // Test 5: Colon in script names
    changeHandler('start dev')
    await waitForQuickPickUpdate()
    const startDevResults = currentItems
    expect(startDevResults).toHaveLength(1)
    expect(startDevResults[0].packageName).toBe('@company/api')
    expect(startDevResults[0].scriptName).toBe('start:dev')

    // Test 6: Mixed case search terms
    changeHandler('START api')
    await waitForQuickPickUpdate()
    const mixedCaseResults = currentItems
    expect(mixedCaseResults).toHaveLength(3)
    expect(mixedCaseResults.map((item) => item.packageName)).toContain(
      '@company/api'
    )
    expect(mixedCaseResults.map((item) => item.packageName)).toContain(
      '@company/API-Gateway'
    )

    // Test 7: Partial match at different word positions
    changeHandler('serve web')
    await waitForQuickPickUpdate()
    const serveWebResults = currentItems
    expect(serveWebResults).toHaveLength(1)
    expect(serveWebResults[0].packageName).toBe('mobile-web')
    expect(serveWebResults[0].scriptName).toBe('serve')

    // Test 8: No matches case
    changeHandler('nonexistent script')
    await waitForQuickPickUpdate()
    expect(currentItems).toHaveLength(1) // Should show no results message
    expect(currentItems[0].label).toContain('No scripts found')

    // Test 9: Empty search restores all items
    changeHandler('')
    await waitForQuickPickUpdate()
    expect(currentItems).toHaveLength(8) // Total number of scripts: 2 + 2 + 1 + 2 + 1 = 8
  })

  test('edge case handling - empty string after trim', () => {
    const { quickPick } = createTestQuickPick()

    // Track items updates
    let currentItems: ScriptQuickPickItem[] = []
    Object.defineProperty(quickPick, 'items', {
      get: () => currentItems,
      set: (value: ScriptQuickPickItem[]) => {
        currentItems = value
      },
      configurable: true,
    })

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

    showScriptPicker(mockPackages)

    // Get the change value handler that was registered
    const changeHandler = vi.mocked(quickPick.onDidChangeValue).mock.calls[0][0]

    // Simulate typing only spaces
    changeHandler('   ')

    // Should show all items
    expect(currentItems).toHaveLength(9)
  })

  test('edge case handling - very long search strings', () => {
    const { quickPick } = createTestQuickPick()

    // Track items updates
    let currentItems: ScriptQuickPickItem[] = []
    Object.defineProperty(quickPick, 'items', {
      get: () => currentItems,
      set: (value: ScriptQuickPickItem[]) => {
        currentItems = value
      },
      configurable: true,
    })

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

    showScriptPicker(mockPackages)

    // Get the change value handler that was registered
    const changeHandler = vi.mocked(quickPick.onDidChangeValue).mock.calls[0][0]

    // Simulate typing very long string
    const veryLongString = 'a'.repeat(1001)
    changeHandler(veryLongString)

    // Should handle gracefully without crashing
    expect(currentItems).toBeDefined()
    expect(currentItems.length).toBeGreaterThanOrEqual(0)
  })

  test('edge case handling - special regex characters', async () => {
    const { quickPick } = createTestQuickPick()

    // Track items updates
    let currentItems: ScriptQuickPickItem[] = []
    Object.defineProperty(quickPick, 'items', {
      get: () => currentItems,
      set: (value: ScriptQuickPickItem[]) => {
        currentItems = value
      },
      configurable: true,
    })

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

    showScriptPicker(mockPackages)

    // Get the change value handler that was registered
    const changeHandler = vi.mocked(quickPick.onDidChangeValue).mock.calls[0][0]

    // Simulate typing special regex chars
    changeHandler('.*[]()+?^$')
    await waitForQuickPickUpdate()

    // Should not throw and show no results message
    expect(currentItems).toBeDefined()
    expect(currentItems).toHaveLength(1)
    expect(currentItems[0].label).toContain('No scripts found')
  })

  test('edge case handling - search terms with only separators', async () => {
    const { quickPick } = createTestQuickPick()

    // Track items updates
    let currentItems: ScriptQuickPickItem[] = []
    Object.defineProperty(quickPick, 'items', {
      get: () => currentItems,
      set: (value: ScriptQuickPickItem[]) => {
        currentItems = value
      },
      configurable: true,
    })

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

    showScriptPicker(mockPackages)

    // Get the change value handler that was registered
    const changeHandler = vi.mocked(quickPick.onDidChangeValue).mock.calls[0][0]

    // Simulate typing only separators
    changeHandler('---')
    await waitForQuickPickUpdate()

    // Should show no results message
    expect(currentItems).toHaveLength(1)
    expect(currentItems[0].label).toContain('No scripts found')
  })

  test('edge case handling - unicode characters and emojis', async () => {
    const { quickPick } = createTestQuickPick()

    // Track items updates
    let currentItems: ScriptQuickPickItem[] = []
    Object.defineProperty(quickPick, 'items', {
      get: () => currentItems,
      set: (value: ScriptQuickPickItem[]) => {
        currentItems = value
      },
      configurable: true,
    })

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

    showScriptPicker(mockPackages)

    // Get the change value handler that was registered
    const changeHandler = vi.mocked(quickPick.onDidChangeValue).mock.calls[0][0]

    // Simulate typing unicode/emoji
    changeHandler('🚀 测试 café')
    await waitForQuickPickUpdate()

    // Should handle gracefully and show no results message
    expect(currentItems).toBeDefined()
    expect(currentItems).toHaveLength(1)
    expect(currentItems[0].label).toContain('No scripts found')
  })

  test('edge case handling - rapid typing with multiple searches', () => {
    const { quickPick } = createTestQuickPick()

    // Track items updates
    let currentItems: ScriptQuickPickItem[] = []
    Object.defineProperty(quickPick, 'items', {
      get: () => currentItems,
      set: (value: ScriptQuickPickItem[]) => {
        currentItems = value
      },
      configurable: true,
    })

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

    showScriptPicker(mockPackages)

    // Get the change value handler that was registered
    const changeHandler = vi.mocked(quickPick.onDidChangeValue).mock.calls[0][0]

    // Simulate rapid typing
    changeHandler('t')
    changeHandler('te')
    changeHandler('tes')
    changeHandler('test')

    // Should handle all searches without crashing
    expect(currentItems).toBeDefined()
    // Should find test scripts
    expect(currentItems.some((item) => item.scriptName === 'test')).toBe(true)
  })

  test('no results - shows helpful message when no scripts match', async () => {
    const { quickPick } = createTestQuickPick()

    // Track items updates
    let currentItems: ScriptQuickPickItem[] = []
    Object.defineProperty(quickPick, 'items', {
      get: () => currentItems,
      set: (value: ScriptQuickPickItem[]) => {
        currentItems = value
      },
      configurable: true,
    })

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

    showScriptPicker(mockPackages)

    // Get the change value handler that was registered
    const changeHandler = vi.mocked(quickPick.onDidChangeValue).mock.calls[0][0]

    // Search for something that doesn't exist
    changeHandler('nonexistent script that will not match anything')
    await waitForQuickPickUpdate()

    // Should show no results message
    expect(currentItems).toHaveLength(1)
    expect(currentItems[0].label).toContain('No scripts found')
    expect(currentItems[0].description).toContain('Try adjusting your search')
    expect(currentItems[0].alwaysShow).toBe(true)
  })

  test('no results - message is not selectable', async () => {
    const { quickPick } = createTestQuickPick()

    // Track items updates
    let currentItems: ScriptQuickPickItem[] = []
    Object.defineProperty(quickPick, 'items', {
      get: () => currentItems,
      set: (value: ScriptQuickPickItem[]) => {
        currentItems = value
      },
      configurable: true,
    })

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

    showScriptPicker(mockPackages)

    // Get the change value handler that was registered
    const changeHandler = vi.mocked(quickPick.onDidChangeValue).mock.calls[0][0]

    // Search for something that doesn't exist
    changeHandler('xyz123 no match')
    await waitForQuickPickUpdate()

    // Should show no results message
    const noResultsItem = currentItems[0]

    // Verify it has empty script properties (making it unselectable)
    expect(noResultsItem.scriptName).toBe('')
    expect(noResultsItem.scriptCommand).toBe('')
    expect(noResultsItem.packageName).toBe('')
    expect(noResultsItem.packagePath).toBe('')
  })

  test('multi-word search updates QuickPick items asynchronously to work around VS Code rendering issue', () => {
    const { quickPick } = createTestQuickPick()

    // Track when items are set
    let itemsSetCount = 0
    let currentItems: ScriptQuickPickItem[] = [...quickPick.items]

    Object.defineProperty(quickPick, 'items', {
      get: () => currentItems,
      set: (value: ScriptQuickPickItem[]) => {
        itemsSetCount++
        currentItems = [...value]
      },
      configurable: true,
    })

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

    const packages: PackageInfo[] = [
      {
        path: '/workspace/apps/mobile-app',
        name: '@test/mobile-app',
        scripts: {
          start: 'expo start',
          build: 'expo build',
        },
      },
    ]

    showScriptPicker(packages)

    // Get the change value handler
    const changeHandler = vi.mocked(quickPick.onDidChangeValue).mock.calls[0][0]

    // Initial items set
    const initialCount = itemsSetCount

    // Trigger a multi-word search
    changeHandler('start mob')

    // Items should not be set immediately (sync)
    expect(itemsSetCount).toBe(initialCount)

    // Wait for async update
    return new Promise((resolve) => {
      setTimeout(() => {
        // Items should be set after async update
        expect(itemsSetCount).toBe(initialCount + 1)
        expect(quickPick.items).toHaveLength(1)
        expect(quickPick.items[0].scriptName).toBe('start')
        resolve(undefined)
      }, 10)
    })
  })

  test('loading state - shows busy indicator during initial setup', () => {
    const { quickPick } = createTestQuickPick()
    let busySetCount = 0

    // Track busy state changes
    Object.defineProperty(quickPick, 'busy', {
      get: () => false,
      set: (value: boolean) => {
        if (value) busySetCount++
      },
      configurable: true,
    })

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

    showScriptPicker(mockPackages)

    // Should have set busy to true at least once
    expect(busySetCount).toBeGreaterThan(0)
  })

  test('multi-word search updates QuickPick items asynchronously to work around VS Code rendering issue', async () => {
    const { quickPick } = createTestQuickPick()

    // Track items updates
    let currentItems: ScriptQuickPickItem[] = []
    const itemsUpdatePromises: Promise<void>[] = []

    Object.defineProperty(quickPick, 'items', {
      get: () => currentItems,
      set: (value: ScriptQuickPickItem[]) => {
        // Simulate the async behavior needed for VS Code
        const updatePromise = Promise.resolve().then(() => {
          currentItems = value
        })
        itemsUpdatePromises.push(updatePromise)
      },
      configurable: true,
    })

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

    const packages: PackageInfo[] = [
      {
        path: '/workspace/apps/mobile-app',
        name: '@test/mobile-app',
        scripts: {
          start: 'expo start',
          build: 'expo build',
        },
      },
    ]

    showScriptPicker(packages)

    // Get the change value handler that was registered
    const changeHandler = vi.mocked(quickPick.onDidChangeValue).mock.calls[0][0]

    // Test multi-word search "start mob"
    changeHandler('start mob')

    // Wait for the async update to complete
    await Promise.all(itemsUpdatePromises)

    // Should find exactly one result after async update
    expect(currentItems).toHaveLength(1)
    expect(currentItems[0].scriptName).toBe('start')
    expect(currentItems[0].packageName).toBe('@test/mobile-app')
  })

  test('multi-word search with partial matches should work', async () => {
    const { quickPick } = createTestQuickPick()

    // Track items updates
    let currentItems: ScriptQuickPickItem[] = []
    Object.defineProperty(quickPick, 'items', {
      get: () => currentItems,
      set: (value: ScriptQuickPickItem[]) => {
        currentItems = value
      },
      configurable: true,
    })

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

    const packages: PackageInfo[] = [
      {
        path: '/workspace/apps/mobile-app',
        name: '@test/mobile-app',
        scripts: {
          start: 'expo start',
          build: 'expo build',
        },
      },
    ]

    showScriptPicker(packages)

    // Get the change value handler that was registered
    const changeHandler = vi.mocked(quickPick.onDidChangeValue).mock.calls[0][0]

    // Test "start mob" - should find the start script from mobile-app
    changeHandler('start mob')
    await waitForQuickPickUpdate()

    // Should find exactly one result
    expect(currentItems).toHaveLength(1)
    expect(currentItems[0].scriptName).toBe('start')
    expect(currentItems[0].packageName).toBe('@test/mobile-app')

    // Test "start @test" - should also find the same script
    changeHandler('start @test')
    await waitForQuickPickUpdate()

    // Should find the result
    expect(currentItems).toHaveLength(1)
    expect(currentItems[0].scriptName).toBe('start')
    expect(currentItems[0].packageName).toBe('@test/mobile-app')

    // Test "@test/mo start" - reversed order with partial match
    changeHandler('@test/mo start')
    await waitForQuickPickUpdate()

    expect(currentItems).toHaveLength(1)
    expect(currentItems[0].scriptName).toBe('start')
    expect(currentItems[0].packageName).toBe('@test/mobile-app')

    // Test "sta mob" - both partial matches
    changeHandler('sta mob')
    await waitForQuickPickUpdate()
    expect(currentItems).toHaveLength(1)
    expect(currentItems[0].scriptName).toBe('start')
    expect(currentItems[0].packageName).toBe('@test/mobile-app')

    // Test "mo st" - very short partial matches
    changeHandler('mo st')
    await waitForQuickPickUpdate()
    expect(currentItems).toHaveLength(1)
    expect(currentItems[0].scriptName).toBe('start')
    expect(currentItems[0].packageName).toBe('@test/mobile-app')

    // Test "build @test/mob" - different script with partial package
    changeHandler('build @test/mob')
    await waitForQuickPickUpdate()
    expect(currentItems).toHaveLength(1)
    expect(currentItems[0].scriptName).toBe('build')
    expect(currentItems[0].packageName).toBe('@test/mobile-app')
  })

  describe('with recent commands', () => {
    test('shows recent commands when manager is provided', async () => {
      const { createRecentQuickPickItems } = await import(
        '#/recent-commands/create-recent-quick-pick-items.js'
      )
      const testHelpers = createTestQuickPick()
      const quickPick = testHelpers.quickPick
      vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

      const mockRecentCommands = [
        {
          scriptName: 'test',
          packageName: 'core',
          packagePath: './packages/core',
          scriptCommand: 'vitest',
          timestamp: Date.now(),
        },
      ]

      const mockRecentItems = [
        {
          label: '$(history) test (core)',
          description: '2 minutes ago',
          detail: 'vitest',
          scriptName: 'test',
          packageName: 'core',
          packagePath: './packages/core',
          scriptCommand: 'vitest',
        },
        { label: '', kind: vscode.QuickPickItemKind.Separator },
      ]

      const mockRecentCommandsManager = {
        getValidatedRecentCommands: vi
          .fn()
          .mockResolvedValue(mockRecentCommands),
      } as unknown as RecentCommandsManager

      vi.mocked(createRecentQuickPickItems).mockReturnValue(mockRecentItems)

      const promise = showScriptPicker(
        mockPackages,
        '/workspace',
        mockRecentCommandsManager
      )

      // Wait for async recent commands loading
      await waitForQuickPickUpdate()

      // Should show recent items along with all items when no search
      const currentItems = quickPick.items as ScriptQuickPickItem[]
      expect(currentItems.length).toBe(mockRecentItems.length + 1 + 9) // 2 recent + 1 separator + 9 regular
      expect(currentItems[0]).toEqual(mockRecentItems[0])
      expect(currentItems[1]).toEqual(mockRecentItems[1])
      expect(currentItems[2].label).toBe('All Scripts')

      testHelpers.triggerHide()
      await promise
    })

    test('hides recent commands when searching', async () => {
      const { createRecentQuickPickItems } = await import(
        '#/recent-commands/create-recent-quick-pick-items.js'
      )
      const testHelpers = createTestQuickPick()
      const quickPick = testHelpers.quickPick
      vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

      const mockRecentItems = [
        {
          label: '$(history) test (core)',
          description: '2 minutes ago',
          detail: 'vitest',
          scriptName: 'test',
          packageName: 'core',
          packagePath: './packages/core',
          scriptCommand: 'vitest',
        },
        { label: '', kind: vscode.QuickPickItemKind.Separator },
      ]

      const mockRecentCommandsManager = {
        getValidatedRecentCommands: vi.fn().mockResolvedValue([]),
      } as unknown as RecentCommandsManager

      vi.mocked(createRecentQuickPickItems).mockReturnValue(mockRecentItems)

      showScriptPicker(mockPackages, '/workspace', mockRecentCommandsManager)

      // Trigger value change
      const changeHandler = vi.mocked(quickPick.onDidChangeValue).mock
        .calls[0][0]
      changeHandler('build')
      await waitForQuickPickUpdate()

      // Should not include recent items when searching
      const currentItems = quickPick.items as ScriptQuickPickItem[]
      expect(
        currentItems.every((item) => !item.label.includes('$(history)'))
      ).toBe(true)
    })

    test('adds separator between recent and normal items', async () => {
      const { createRecentQuickPickItems } = await import(
        '#/recent-commands/create-recent-quick-pick-items.js'
      )
      const testHelpers = createTestQuickPick()
      const quickPick = testHelpers.quickPick
      vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

      const mockRecentItems = [
        {
          label: 'Recent Commands',
          kind: vscode.QuickPickItemKind.Separator,
        },
        {
          label: 'test - 2 minutes ago',
          description: 'core',
          detail: 'vitest',
          scriptName: 'test',
          packageName: 'core',
          packagePath: './packages/core',
          scriptCommand: 'vitest',
        },
      ]

      const mockRecentCommandsManager = {
        getValidatedRecentCommands: vi.fn().mockResolvedValue([
          {
            scriptName: 'test',
            packageName: 'core',
            packagePath: './packages/core',
            scriptCommand: 'vitest',
            timestamp: Date.now() - 2 * 60 * 1000,
          },
        ]),
      } as unknown as RecentCommandsManager

      vi.mocked(createRecentQuickPickItems).mockReturnValue(mockRecentItems)

      const promise = showScriptPicker(
        mockPackages,
        '/workspace',
        mockRecentCommandsManager
      )

      // Wait for async recent commands loading
      await waitForQuickPickUpdate()

      // Check items structure
      const currentItems = quickPick.items as Array<
        ScriptQuickPickItem | vscode.QuickPickItem
      >

      // Should have: Recent Commands separator + recent items + All Scripts separator + normal items
      const separatorIndices = currentItems
        .map((item, index) => ({ item, index }))
        .filter(
          ({ item }) =>
            'kind' in item && item.kind === vscode.QuickPickItemKind.Separator
        )
        .map(({ index }) => index)

      expect(separatorIndices.length).toBe(2) // Two separators
      expect(currentItems[0].label).toBe('Recent Commands')

      // Find the "All Scripts" separator (should be after recent items)
      const allScriptsSeparatorIndex = separatorIndices[1]
      expect(currentItems[allScriptsSeparatorIndex].label).toBe('All Scripts')

      // Verify recent items are before "All Scripts" separator
      expect(currentItems[1].label).toContain('test -')

      // Verify normal items are after "All Scripts" separator
      const firstNormalItemIndex = allScriptsSeparatorIndex + 1
      expect(currentItems[firstNormalItemIndex].label).toContain('(')

      testHelpers.triggerHide()
      await promise
    })

    test('works without recent commands manager (backward compatibility)', async () => {
      const testHelpers = createTestQuickPick()
      const quickPick = testHelpers.quickPick
      vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

      const promise = showScriptPicker(mockPackages)

      // Should show all items without recent section
      const currentItems = quickPick.items as ScriptQuickPickItem[]
      expect(currentItems.length).toBe(9) // Just the regular items

      testHelpers.triggerHide()
      await promise
    })

    test('limits recent commands to 5 when more are available', async () => {
      const { createRecentQuickPickItems } = await import(
        '#/recent-commands/create-recent-quick-pick-items.js'
      )
      const testHelpers = createTestQuickPick()
      const quickPick = testHelpers.quickPick
      vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

      // Create 8 recent commands
      const mockRecentCommands = Array.from({ length: 8 }, (_, i) => ({
        scriptName: `script${i}`,
        packageName: `pkg${i}`,
        packagePath: `./pkg${i}`,
        scriptCommand: `cmd${i}`,
        timestamp: Date.now() - i * 1000,
      }))

      const mockRecentCommandsManager = {
        getValidatedRecentCommands: vi
          .fn()
          .mockResolvedValue(mockRecentCommands),
      } as unknown as RecentCommandsManager

      // Mock the createRecentQuickPickItems to be called with sliced commands
      vi.mocked(createRecentQuickPickItems).mockImplementation((commands) => {
        if (commands.length === 0) return []
        return [
          {
            label: 'Recent Commands',
            kind: vscode.QuickPickItemKind.Separator,
          },
          ...commands.map((cmd) => ({
            label: `${cmd.scriptName} Just now`,
            description: `${cmd.packageName}: ${cmd.scriptCommand}`,
            detail: '',
            scriptName: cmd.scriptName,
            packageName: cmd.packageName,
            packagePath: cmd.packagePath,
            scriptCommand: cmd.scriptCommand,
          })),
        ]
      })

      const promise = showScriptPicker(
        mockPackages,
        '/workspace',
        mockRecentCommandsManager
      )

      // Wait for async recent commands loading
      await waitForQuickPickUpdate()

      // Verify createRecentQuickPickItems was called with only 5 commands
      expect(vi.mocked(createRecentQuickPickItems)).toHaveBeenCalledWith(
        mockRecentCommands.slice(0, 5),
        '/workspace'
      )

      testHelpers.triggerHide()
      await promise
    })

    test('handles recent commands manager errors gracefully', async () => {
      const testHelpers = createTestQuickPick()
      const quickPick = testHelpers.quickPick
      vi.mocked(vscode.window.createQuickPick).mockReturnValue(quickPick)

      const mockRecentCommandsManager = {
        getValidatedRecentCommands: vi
          .fn()
          .mockRejectedValue(new Error('Storage error')),
      } as unknown as RecentCommandsManager

      const promise = showScriptPicker(
        mockPackages,
        '/workspace',
        mockRecentCommandsManager
      )

      // Wait for async error handling
      await waitForQuickPickUpdate()

      // Should still show all regular items
      const currentItems = quickPick.items as ScriptQuickPickItem[]
      expect(currentItems.length).toBe(9) // Just the regular items

      testHelpers.triggerHide()
      await promise
    })
  })
})
