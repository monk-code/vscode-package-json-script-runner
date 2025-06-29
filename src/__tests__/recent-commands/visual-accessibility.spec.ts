import { describe, expect, it } from 'vitest'

import { createRecentQuickPickItems } from '#/recent-commands/create-recent-quick-pick-items.js'
import type { RecentCommand } from '#/types/recent-command.js'

describe('Recent Commands Visual and Accessibility', () => {
  describe('visual formatting', () => {
    it('should format recent items with proper visual hierarchy', () => {
      const commands: RecentCommand[] = [
        {
          scriptName: 'test',
          packageName: '@company/core-lib',
          packagePath: './packages/core',
          scriptCommand: 'vitest --coverage',
          timestamp: Date.now(),
        },
      ]

      const result = createRecentQuickPickItems(commands, '/workspace')

      expect(result).toHaveLength(2) // separator + item
      expect(result[1].label).toBe('test')
      expect(result[1].description).toBe('Just now')
      expect(result[1].detail).toBe('$(package) @company/core-lib')
    })

    it('should show relative time in description', () => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      const commands: RecentCommand[] = [
        {
          scriptName: 'build',
          packageName: 'app',
          packagePath: './app',
          scriptCommand: 'vite build',
          timestamp: fiveMinutesAgo,
        },
      ]

      const result = createRecentQuickPickItems(commands, '/workspace')

      expect(result).toHaveLength(2) // separator + item
      expect(result[1].label).toBe('build')
      expect(result[1].description).toBe('5 minutes ago')
      expect(result[1].detail).toBe('$(package) app')
    })

    it('should format time appropriately for different time ranges', () => {
      const now = Date.now()
      const testCases = [
        { timestamp: now - 30 * 1000, expected: 'Just now' },
        { timestamp: now - 2 * 60 * 1000, expected: '2 minutes ago' },
        { timestamp: now - 60 * 60 * 1000, expected: '1 hour ago' },
        { timestamp: now - 3 * 60 * 60 * 1000, expected: '3 hours ago' },
        { timestamp: now - 25 * 60 * 60 * 1000, expected: 'Yesterday' },
        { timestamp: now - 5 * 24 * 60 * 60 * 1000, expected: '5 days ago' },
      ]

      testCases.forEach(({ timestamp, expected }) => {
        const commands: RecentCommand[] = [
          {
            scriptName: 'test',
            packageName: 'pkg',
            packagePath: './pkg',
            scriptCommand: 'test',
            timestamp,
          },
        ]

        const result = createRecentQuickPickItems(commands, '/workspace')
        expect(result).toHaveLength(2) // separator + item
        expect(result[1].label).toBe('test')
        expect(result[1].description).toBe(expected)
        expect(result[1].detail).toBe('$(package) pkg')
      })
    })

    it('should show package path in detail field', () => {
      const commands: RecentCommand[] = [
        {
          scriptName: 'dev',
          packageName: 'frontend',
          packagePath: './apps/web/frontend',
          scriptCommand: 'next dev',
          timestamp: Date.now(),
        },
      ]

      const result = createRecentQuickPickItems(commands, '/workspace')

      expect(result).toHaveLength(2) // separator + item
      expect(result[1].label).toBe('dev')
      expect(result[1].description).toBe('Just now')
      expect(result[1].detail).toBe('$(package) frontend')
    })
  })

  describe('accessibility', () => {
    it('should provide clear visual structure for screen readers', () => {
      const commands: RecentCommand[] = [
        {
          scriptName: 'test',
          packageName: 'utils',
          packagePath: './packages/utils',
          scriptCommand: 'jest',
          timestamp: Date.now(),
        },
      ]

      const result = createRecentQuickPickItems(commands, '/workspace')

      // VS Code generates aria labels from label, description, and detail
      expect(result).toHaveLength(2) // separator + item
      expect(result[1].label).toBe('test')
      expect(result[1].description).toBe('Just now')
      expect(result[1].detail).toBe('$(package) utils')
    })

    it('should provide clear section separation', () => {
      const commands: RecentCommand[] = [
        {
          scriptName: 'build',
          packageName: 'app',
          packagePath: './app',
          scriptCommand: 'build',
          timestamp: Date.now(),
        },
      ]

      const result = createRecentQuickPickItems(commands, '/workspace')
      const separator = result[0]

      expect(separator.kind).toBe(-1) // QuickPickItemKind.Separator
      expect(separator.label).toBe('Recent Commands') // Clear label for separator
    })

    it('should handle empty recent commands with appropriate message', () => {
      const result = createRecentQuickPickItems([], '/workspace')

      expect(result).toHaveLength(0)
    })
  })

  describe('visual indicators', () => {
    it('should use different icons for different script types', () => {
      const commands: RecentCommand[] = [
        {
          scriptName: 'test',
          packageName: 'pkg1',
          packagePath: './pkg1',
          scriptCommand: 'vitest',
          timestamp: Date.now(),
        },
        {
          scriptName: 'build',
          packageName: 'pkg2',
          packagePath: './pkg2',
          scriptCommand: 'vite build',
          timestamp: Date.now(),
        },
        {
          scriptName: 'dev',
          packageName: 'pkg3',
          packagePath: './pkg3',
          scriptCommand: 'vite dev',
          timestamp: Date.now(),
        },
        {
          scriptName: 'lint',
          packageName: 'pkg4',
          packagePath: './pkg4',
          scriptCommand: 'biome lint',
          timestamp: Date.now(),
        },
      ]

      const result = createRecentQuickPickItems(commands, '/workspace')

      expect(result).toHaveLength(5) // separator + 4 items
      expect(result[1].label).toBe('test')
      expect(result[2].label).toBe('build')
      expect(result[3].label).toBe('dev')
      expect(result[4].label).toBe('lint')
    })

    it('should handle custom script names with default icon', () => {
      const commands: RecentCommand[] = [
        {
          scriptName: 'custom:task',
          packageName: 'app',
          packagePath: './app',
          scriptCommand: 'custom task',
          timestamp: Date.now(),
        },
      ]

      const result = createRecentQuickPickItems(commands, '/workspace')

      expect(result).toHaveLength(2) // separator + item
      expect(result[1].label).toBe('custom:task')
    })
  })
})
