import { createRecentQuickPickItems } from '#/recent-commands/create-recent-quick-pick-items.js'
import type { RecentCommand } from '#/types/recent-command.js'
import { describe, expect, it } from 'vitest'

// QuickPickItemKind is an enum, define it for tests
const QuickPickItemKind = {
  Separator: -1,
  Default: 0,
} as const

describe('createRecentQuickPickItems', () => {
  it('should return empty array when no recent commands', () => {
    const result = createRecentQuickPickItems([])
    expect(result).toEqual([])
  })

  it('should create quick pick items without icons', () => {
    const commands: RecentCommand[] = [
      {
        scriptName: 'test',
        packageName: 'core',
        packagePath: './packages/core',
        scriptCommand: 'vitest',
        timestamp: Date.now(),
      },
    ]

    const result = createRecentQuickPickItems(commands)

    expect(result).toHaveLength(2) // separator + item
    expect(result[0]).toMatchObject({
      label: 'Recent Commands',
      kind: QuickPickItemKind.Separator,
    })
    expect(result[1]).toMatchObject({
      label: 'test',
      description: 'Just now',
      detail: '$(package) core',
      scriptName: 'test',
      scriptCommand: 'vitest',
      packageName: 'core',
      packagePath: './packages/core',
    })
  })

  it('should include labeled separator before recent items', () => {
    const commands: RecentCommand[] = [
      {
        scriptName: 'test',
        packageName: 'core',
        packagePath: './packages/core',
        scriptCommand: 'vitest',
        timestamp: Date.now(),
      },
    ]

    const result = createRecentQuickPickItems(commands)

    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      label: 'Recent Commands',
      kind: QuickPickItemKind.Separator,
    })
    expect(result[1]).toMatchObject({
      label: 'test',
      description: 'Just now',
      scriptName: 'test',
    })
  })

  it('should handle multiple recent commands', () => {
    const commands: RecentCommand[] = [
      {
        scriptName: 'test',
        packageName: 'core',
        packagePath: './packages/core',
        scriptCommand: 'vitest',
        timestamp: Date.now(),
      },
      {
        scriptName: 'build',
        packageName: 'ui',
        packagePath: './packages/ui',
        scriptCommand: 'tsup',
        timestamp: Date.now() - 1000,
      },
    ]

    const result = createRecentQuickPickItems(commands)

    expect(result).toHaveLength(3) // 1 separator + 2 items
    expect(result[0]).toMatchObject({
      label: 'Recent Commands',
      kind: QuickPickItemKind.Separator,
    })
    expect(result[1].label).toBe('test')
    expect(result[1].description).toBe('Just now')
    expect(result[1].detail).toBe('$(package) core')
    expect(result[2].label).toBe('build')
    expect(result[2].description).toBe('Just now')
    expect(result[2].detail).toBe('$(package) ui')
  })

  it('should format detail with icons for better visual hierarchy', () => {
    const commands: RecentCommand[] = [
      {
        scriptName: 'test',
        packageName: '@company/core-lib',
        packagePath: './packages/core',
        scriptCommand: 'vitest --coverage',
        timestamp: Date.now(),
        workspaceFolder: 'frontend',
      },
    ]

    const result = createRecentQuickPickItems(commands)

    expect(result).toHaveLength(2) // separator + item
    expect(result[1].label).toBe('test')
    expect(result[1].description).toBe('Just now')
    expect(result[1].detail).toBe('$(package) @company/core-lib')
  })

  it('should not include separator when no recent commands', () => {
    const result = createRecentQuickPickItems([])

    expect(result).toHaveLength(0)
    expect(
      result.find(
        (item) => 'kind' in item && item.kind === QuickPickItemKind.Separator
      )
    ).toBeUndefined()
  })

  it('should maintain order from recent commands', () => {
    const commands: RecentCommand[] = [
      {
        scriptName: 'newer',
        packageName: 'pkg1',
        packagePath: './pkg1',
        scriptCommand: 'cmd1',
        timestamp: Date.now(),
      },
      {
        scriptName: 'older',
        packageName: 'pkg2',
        packagePath: './pkg2',
        scriptCommand: 'cmd2',
        timestamp: Date.now() - 1000,
      },
    ]

    const result = createRecentQuickPickItems(commands)

    expect(result).toHaveLength(3) // separator + 2 items
    const item1 = result[1] as { scriptName: string }
    const item2 = result[2] as { scriptName: string }
    expect(item1.scriptName).toBe('newer')
    expect(item2.scriptName).toBe('older')
  })
})
