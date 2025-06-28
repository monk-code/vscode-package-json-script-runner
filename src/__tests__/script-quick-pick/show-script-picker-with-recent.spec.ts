import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as vscode from 'vscode'
import { showScriptPickerWithRecent } from '#/script-quick-pick/show-script-picker.js'
import type { RecentCommandsManager } from '#/recent-commands/recent-commands-manager.js'
import { createRecentQuickPickItems } from '#/recent-commands/create-recent-quick-pick-items.js'
import type { PackageInfo } from '#/types/package-info.js'
import type { RecentCommand } from '#/types/recent-command.js'
import { createTestQuickPick } from './test-helpers.js'

vi.mock('vscode', () => ({
  window: {
    createQuickPick: vi.fn(),
  },
}))

vi.mock('#/recent-commands/recent-commands-manager.js')
vi.mock('#/recent-commands/create-recent-quick-pick-items.js')

const waitForQuickPickUpdate = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('showScriptPickerWithRecent', () => {
  let mockRecentCommandsManager: RecentCommandsManager
  let testQuickPick: ReturnType<typeof createTestQuickPick>['quickPick']
  let testHelpers: ReturnType<typeof createTestQuickPick>

  const mockPackages: PackageInfo[] = [
    {
      path: '/workspace/packages/app',
      name: 'app',
      scripts: {
        build: 'vite build',
        test: 'vitest',
      },
    },
  ]

  const mockRecentCommands: RecentCommand[] = [
    {
      scriptName: 'test',
      packageName: 'core',
      packagePath: './packages/core',
      scriptCommand: 'vitest',
      timestamp: Date.now(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    mockRecentCommandsManager = {
      getValidatedRecentCommands: vi.fn().mockResolvedValue(mockRecentCommands),
    } as unknown as RecentCommandsManager

    testHelpers = createTestQuickPick()
    testQuickPick = testHelpers.quickPick
    vi.mocked(vscode.window.createQuickPick).mockReturnValue(testQuickPick)

    vi.mocked(createRecentQuickPickItems).mockReturnValue([
      {
        label: '$(history) test',
        description: 'Recently run',
        detail: 'core',
        scriptName: 'test',
        scriptCommand: 'vitest',
        packageName: 'core',
        packagePath: './packages/core',
      },
      {
        label: '',
        kind: -1, // Separator
      },
    ])
  })

  it('should show recent commands when search is empty', async () => {
    const pickerPromise = showScriptPickerWithRecent(
      mockPackages,
      '/workspace',
      mockRecentCommandsManager
    )

    await waitForQuickPickUpdate()

    // Should show recent items + separator + regular items
    expect(testQuickPick.items).toHaveLength(4)
    expect(testQuickPick.items[0].label).toBe('$(history) test')
    expect(testQuickPick.items[1].kind).toBe(-1) // Separator
    expect(testQuickPick.items[2].label).toContain('build')
    expect(testQuickPick.items[3].label).toContain('test')

    testHelpers.triggerHide()
    await pickerPromise
  })

  it('should hide recent commands when user starts typing', async () => {
    const pickerPromise = showScriptPickerWithRecent(
      mockPackages,
      '/workspace',
      mockRecentCommandsManager
    )

    await waitForQuickPickUpdate()

    // Initially shows recent commands
    expect(testQuickPick.items[0].label).toBe('$(history) test')

    // User types something
    testQuickPick.value = 'build'
    testHelpers.triggerValueChange('build')
    await waitForQuickPickUpdate()

    // Recent commands should be hidden, only search results shown
    expect(testQuickPick.items).toHaveLength(1)
    expect(testQuickPick.items[0].label).toContain('build')
    expect(testQuickPick.items[0].label).not.toContain('$(history)')

    testHelpers.triggerHide()
    await pickerPromise
  })

  it('should re-show recent commands when search is cleared', async () => {
    const pickerPromise = showScriptPickerWithRecent(
      mockPackages,
      '/workspace',
      mockRecentCommandsManager
    )

    await waitForQuickPickUpdate()

    // Type something
    testQuickPick.value = 'build'
    testHelpers.triggerValueChange('build')
    await waitForQuickPickUpdate()

    // Clear search
    testQuickPick.value = ''
    testHelpers.triggerValueChange('')
    await waitForQuickPickUpdate()

    // Recent commands should be shown again
    expect(testQuickPick.items[0].label).toBe('$(history) test')

    testHelpers.triggerHide()
    await pickerPromise
  })

  it('should handle when no recent commands exist', async () => {
    vi.mocked(
      mockRecentCommandsManager.getValidatedRecentCommands
    ).mockResolvedValue([])
    vi.mocked(createRecentQuickPickItems).mockReturnValue([])

    const pickerPromise = showScriptPickerWithRecent(
      mockPackages,
      '/workspace',
      mockRecentCommandsManager
    )

    await waitForQuickPickUpdate()

    // Should only show regular items, no recent section
    expect(testQuickPick.items).toHaveLength(2)
    expect(
      testQuickPick.items.every((item) => !item.label.includes('$(history)'))
    ).toBe(true)

    testHelpers.triggerHide()
    await pickerPromise
  })

  it('should handle errors loading recent commands gracefully', async () => {
    vi.mocked(
      mockRecentCommandsManager.getValidatedRecentCommands
    ).mockRejectedValue(new Error('Storage error'))

    const pickerPromise = showScriptPickerWithRecent(
      mockPackages,
      '/workspace',
      mockRecentCommandsManager
    )

    await waitForQuickPickUpdate()

    // Should still show regular items despite error
    expect(testQuickPick.items).toHaveLength(2)
    expect(testQuickPick.items[0].label).toContain('build')
    expect(testQuickPick.items[1].label).toContain('test')

    testHelpers.triggerHide()
    await pickerPromise
  })

  it('should allow selecting a recent command', async () => {
    const pickerPromise = showScriptPickerWithRecent(
      mockPackages,
      '/workspace',
      mockRecentCommandsManager
    )

    await waitForQuickPickUpdate()

    // Select the recent command
    testQuickPick.selectedItems = [testQuickPick.items[0]]
    testHelpers.triggerAccept()

    const result = await pickerPromise

    expect(result).toEqual({
      scriptName: 'test',
      scriptCommand: 'vitest',
      packageName: 'core',
      packagePath: './packages/core',
    })
  })
})
