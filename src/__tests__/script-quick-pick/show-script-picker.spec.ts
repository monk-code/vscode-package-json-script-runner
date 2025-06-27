import { describe, expect, test, vi } from 'vitest'
import * as vscode from 'vscode'

import type { PackageInfo } from '#/types/package-info.js'
import type { ScriptQuickPickItem } from '#/types/script-quick-pick-item.js'

import { showScriptPicker } from '#/script-quick-pick/show-script-picker.js'
import { createTestQuickPick } from './test-helpers.js'

vi.mock('vscode', () => ({
  window: {
    createQuickPick: vi.fn(),
  },
}))

describe('showScriptPicker', () => {
  const mockPackages: PackageInfo[] = [
    {
      path: '/workspace/packages/ui-components',
      name: '@mycompany/ui-components',
      relativePath: 'packages/ui-components',
      scripts: {
        build: 'vite build',
        test: 'vitest',
        dev: 'vite dev',
      },
    },
    {
      path: '/workspace/packages/api-server',
      name: '@mycompany/api-server',
      relativePath: 'packages/api-server',
      scripts: {
        start: 'node index.js',
        test: 'jest',
        'test:watch': 'jest --watch',
      },
    },
    {
      path: '/workspace/apps/web',
      name: '@mycompany/web',
      relativePath: 'apps/web',
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
    expect(buildItem?.label).toBe('build')
    expect(buildItem?.description).toBe('@mycompany/ui-components')
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
})
