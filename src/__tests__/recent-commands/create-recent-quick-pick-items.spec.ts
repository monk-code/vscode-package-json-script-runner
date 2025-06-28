import { describe, it, expect } from 'vitest'
import { createRecentQuickPickItems } from '#/recent-commands/create-recent-quick-pick-items.js'
import type { RecentCommand } from '#/types/recent-command.js'

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

  it('should create quick pick items with history icon', () => {
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

    expect(result).toHaveLength(2) // item + separator
    expect(result[0]).toMatchObject({
      label: '$(beaker) test',
      description: 'Just now',
      detail: 'core',
      scriptName: 'test',
      scriptCommand: 'vitest',
      packageName: 'core',
      packagePath: './packages/core',
    })
  })

  it('should include separator after recent items', () => {
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
    expect(result[1]).toMatchObject({
      label: '',
      kind: QuickPickItemKind.Separator,
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

    expect(result).toHaveLength(3) // 2 items + 1 separator
    expect(result[0].label).toBe('$(beaker) test')
    expect(result[0].detail).toBe('core')
    expect(result[1].label).toBe('$(package) build')
    expect(result[1].detail).toBe('ui')
    expect(result[2].kind).toBe(QuickPickItemKind.Separator)
  })

  it('should include workspace folder in detail when present', () => {
    const commands: RecentCommand[] = [
      {
        scriptName: 'test',
        packageName: 'core',
        packagePath: './packages/core',
        scriptCommand: 'vitest',
        timestamp: Date.now(),
        workspaceFolder: 'frontend',
      },
    ]

    const result = createRecentQuickPickItems(commands)

    expect(result[0].detail).toBe('core (frontend)')
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

    const item0 = result[0] as { scriptName: string }
    const item1 = result[1] as { scriptName: string }
    expect(item0.scriptName).toBe('newer')
    expect(item1.scriptName).toBe('older')
  })
})
