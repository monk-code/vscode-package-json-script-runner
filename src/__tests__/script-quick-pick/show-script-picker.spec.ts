import { describe, expect, test, vi } from 'vitest'
import * as vscode from 'vscode'

import type { PackageInfo } from '#/types/package-info.js'
import type { ScriptQuickPickItem } from '#/types/script-quick-pick-item.js'

import { showScriptPicker } from '#/script-quick-pick/show-script-picker.js'

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
    const mockQuickPick = {
      items: [] as ScriptQuickPickItem[],
      placeholder: '',
      show: vi.fn(),
      dispose: vi.fn(),
      onDidChangeValue: vi.fn(() => ({ dispose: vi.fn() })),
      onDidAccept: vi.fn(() => ({ dispose: vi.fn() })),
      onDidHide: vi.fn(() => ({ dispose: vi.fn() })),
    }

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(
      mockQuickPick as unknown as vscode.QuickPick<ScriptQuickPickItem>
    )

    showScriptPicker(mockPackages)

    expect(vscode.window.createQuickPick).toHaveBeenCalled()
    expect(mockQuickPick.items).toHaveLength(9) // Total scripts across all packages
    expect(mockQuickPick.placeholder).toBe('Search for a script to run...')
    expect(mockQuickPick.show).toHaveBeenCalled()
  })

  test('formats quick pick items with correct labels and descriptions', () => {
    const mockQuickPick = {
      items: [] as ScriptQuickPickItem[],
      placeholder: '',
      show: vi.fn(),
      dispose: vi.fn(),
      onDidChangeValue: vi.fn(() => ({ dispose: vi.fn() })),
      onDidAccept: vi.fn(() => ({ dispose: vi.fn() })),
      onDidHide: vi.fn(() => ({ dispose: vi.fn() })),
    }

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(
      mockQuickPick as unknown as vscode.QuickPick<ScriptQuickPickItem>
    )

    showScriptPicker(mockPackages)

    const items = mockQuickPick.items
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
    let acceptHandler: (() => void) | undefined

    const mockQuickPick = {
      items: [] as ScriptQuickPickItem[],
      placeholder: '',
      selectedItems: [] as ScriptQuickPickItem[],
      show: vi.fn(),
      dispose: vi.fn(),
      onDidChangeValue: vi.fn(),
      onDidAccept: vi.fn((handler: () => void) => {
        acceptHandler = handler
        return { dispose: vi.fn() }
      }),
      onDidHide: vi.fn(() => ({ dispose: vi.fn() })),
    }

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(
      mockQuickPick as unknown as vscode.QuickPick<ScriptQuickPickItem>
    )

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
    mockQuickPick.selectedItems = [selectedItem]

    // Simulate user accepting
    acceptHandler?.()

    const result = await resultPromise
    expect(result).toEqual({
      packageName: '@mycompany/ui-components',
      packagePath: '/workspace/packages/ui-components',
      scriptName: 'build',
      scriptCommand: 'vite build',
    })
    expect(mockQuickPick.dispose).toHaveBeenCalled()
  })

  test('returns undefined when user cancels', async () => {
    let hideHandler: (() => void) | undefined

    const mockQuickPick = {
      items: [] as ScriptQuickPickItem[],
      placeholder: '',
      show: vi.fn(),
      dispose: vi.fn(),
      onDidChangeValue: vi.fn(),
      onDidAccept: vi.fn(() => ({ dispose: vi.fn() })),
      onDidHide: vi.fn((handler: () => void) => {
        hideHandler = handler
        return { dispose: vi.fn() }
      }),
    }

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(
      mockQuickPick as unknown as vscode.QuickPick<ScriptQuickPickItem>
    )

    const resultPromise = showScriptPicker(mockPackages)

    // Simulate user canceling (hiding without accepting)
    hideHandler?.()

    const result = await resultPromise
    expect(result).toBeUndefined()
    expect(mockQuickPick.dispose).toHaveBeenCalled()
  })

  test('registers value change handler for search', () => {
    const mockQuickPick = {
      items: [] as ScriptQuickPickItem[],
      placeholder: '',
      value: '',
      show: vi.fn(),
      dispose: vi.fn(),
      onDidChangeValue: vi.fn(() => ({ dispose: vi.fn() })),
      onDidAccept: vi.fn(() => ({ dispose: vi.fn() })),
      onDidHide: vi.fn(() => ({ dispose: vi.fn() })),
    }

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(
      mockQuickPick as unknown as vscode.QuickPick<ScriptQuickPickItem>
    )

    showScriptPicker(mockPackages)

    // Verify that change handler was registered
    expect(mockQuickPick.onDidChangeValue).toHaveBeenCalled()

    // Verify initial items are set
    expect(mockQuickPick.items).toHaveLength(9)
  })

  test('handles empty package list', () => {
    const mockQuickPick = {
      items: [] as ScriptQuickPickItem[],
      placeholder: '',
      show: vi.fn(),
      dispose: vi.fn(),
      onDidChangeValue: vi.fn(() => ({ dispose: vi.fn() })),
      onDidAccept: vi.fn(() => ({ dispose: vi.fn() })),
      onDidHide: vi.fn(() => ({ dispose: vi.fn() })),
    }

    vi.mocked(vscode.window.createQuickPick).mockReturnValue(
      mockQuickPick as unknown as vscode.QuickPick<ScriptQuickPickItem>
    )

    showScriptPicker([])

    expect(mockQuickPick.items).toHaveLength(0)
    expect(mockQuickPick.placeholder).toBe('No scripts found in workspace')
  })
})
