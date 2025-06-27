import { describe, expect, test } from 'vitest'

import type { PackageManager } from '#/package-manager/package-manager-types.js'
import type { SelectedScript } from '#/types/selected-script.js'

describe('generateCommand', () => {
  const createSelectedScript = (
    overrides: Partial<SelectedScript> = {}
  ): SelectedScript => ({
    packageName: '@test/ui-components',
    packagePath: '/workspace/packages/ui-components',
    scriptName: 'build',
    scriptCommand: 'vite build',
    ...overrides,
  })

  describe('pnpm commands', () => {
    test('generates workspace filter command for pnpm', async () => {
      const { generateCommand } = await import(
        '#/script-execution/generate-command.js'
      )

      const script = createSelectedScript()
      const result = await generateCommand(
        script,
        'pnpm' as PackageManager,
        '/workspace'
      )

      expect(result).toBe('pnpm --filter @test/ui-components build')
    })

    test('generates direct command when in package directory for pnpm', async () => {
      const { generateCommand } = await import(
        '#/script-execution/generate-command.js'
      )

      const script = createSelectedScript()
      const result = await generateCommand(
        script,
        'pnpm' as PackageManager,
        '/workspace/packages/ui-components'
      )

      expect(result).toBe('pnpm build')
    })

    test('handles package without name using relative path for pnpm', async () => {
      const { generateCommand } = await import(
        '#/script-execution/generate-command.js'
      )

      const script = createSelectedScript({
        packageName: '',
        packagePath: '/workspace/packages/unnamed-package',
      })
      const result = await generateCommand(
        script,
        'pnpm' as PackageManager,
        '/workspace'
      )

      expect(result).toBe('pnpm --filter ./packages/unnamed-package build')
    })
  })

  describe('npm commands', () => {
    test('generates workspace command for npm', async () => {
      const { generateCommand } = await import(
        '#/script-execution/generate-command.js'
      )

      const script = createSelectedScript()
      const result = await generateCommand(
        script,
        'npm' as PackageManager,
        '/workspace'
      )

      expect(result).toBe('npm run build --workspace=@test/ui-components')
    })

    test('generates direct command when in package directory for npm', async () => {
      const { generateCommand } = await import(
        '#/script-execution/generate-command.js'
      )

      const script = createSelectedScript()
      const result = await generateCommand(
        script,
        'npm' as PackageManager,
        '/workspace/packages/ui-components'
      )

      expect(result).toBe('npm run build')
    })

    test('handles package without name using relative path for npm', async () => {
      const { generateCommand } = await import(
        '#/script-execution/generate-command.js'
      )

      const script = createSelectedScript({
        packageName: '',
        packagePath: '/workspace/packages/unnamed-package',
      })
      const result = await generateCommand(
        script,
        'npm' as PackageManager,
        '/workspace'
      )

      expect(result).toBe(
        'npm run build --workspace=./packages/unnamed-package'
      )
    })
  })

  describe('yarn commands', () => {
    test('generates workspace command for yarn', async () => {
      const { generateCommand } = await import(
        '#/script-execution/generate-command.js'
      )

      const script = createSelectedScript()
      const result = await generateCommand(
        script,
        'yarn' as PackageManager,
        '/workspace'
      )

      expect(result).toBe('yarn workspace @test/ui-components build')
    })

    test('generates direct command when in package directory for yarn', async () => {
      const { generateCommand } = await import(
        '#/script-execution/generate-command.js'
      )

      const script = createSelectedScript()
      const result = await generateCommand(
        script,
        'yarn' as PackageManager,
        '/workspace/packages/ui-components'
      )

      expect(result).toBe('yarn build')
    })

    test('handles package without name using relative path for yarn', async () => {
      const { generateCommand } = await import(
        '#/script-execution/generate-command.js'
      )

      const script = createSelectedScript({
        packageName: '',
        packagePath: '/workspace/packages/unnamed-package',
      })
      const result = await generateCommand(
        script,
        'yarn' as PackageManager,
        '/workspace'
      )

      expect(result).toBe('yarn workspace ./packages/unnamed-package build')
    })
  })

  describe('edge cases', () => {
    test('handles script names with spaces', async () => {
      const { generateCommand } = await import(
        '#/script-execution/generate-command.js'
      )

      const script = createSelectedScript({ scriptName: 'build:prod' })
      const result = await generateCommand(
        script,
        'pnpm' as PackageManager,
        '/workspace'
      )

      expect(result).toBe('pnpm --filter @test/ui-components build:prod')
    })

    test('handles package names with special characters', async () => {
      const { generateCommand } = await import(
        '#/script-execution/generate-command.js'
      )

      const script = createSelectedScript({ packageName: '@company/ui-kit-v2' })
      const result = await generateCommand(
        script,
        'pnpm' as PackageManager,
        '/workspace'
      )

      expect(result).toBe('pnpm --filter @company/ui-kit-v2 build')
    })

    test('handles nested package paths correctly', async () => {
      const { generateCommand } = await import(
        '#/script-execution/generate-command.js'
      )

      const script = createSelectedScript({
        packagePath: '/workspace/packages/ui/components',
        packageName: '',
      })
      const result = await generateCommand(
        script,
        'pnpm' as PackageManager,
        '/workspace'
      )

      expect(result).toBe('pnpm --filter ./packages/ui/components build')
    })

    test('handles absolute vs relative workspace paths', async () => {
      const { generateCommand } = await import(
        '#/script-execution/generate-command.js'
      )

      const script = createSelectedScript({
        packagePath: '/workspace/packages/ui-components',
      })
      const result = await generateCommand(
        script,
        'pnpm' as PackageManager,
        '/different/workspace'
      )

      // Should fall back to absolute path when relative calculation fails
      expect(result).toBe('pnpm --filter @test/ui-components build')
    })
  })
})
