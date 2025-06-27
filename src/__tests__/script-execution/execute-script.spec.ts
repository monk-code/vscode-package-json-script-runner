import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { PackageManager } from '#/package-manager/package-manager-types.js'
import type { SelectedScript } from '#/types/selected-script.js'

// Mock the sub-modules
vi.mock('#/package-manager/detect-package-manager.js', () => ({
  detectPackageManager: vi.fn(),
}))

vi.mock('#/script-execution/generate-command.js', () => ({
  generateCommand: vi.fn(),
}))

vi.mock('#/script-execution/terminal-manager.js', () => ({
  createAndExecuteInTerminal: vi.fn(),
}))

vi.mock('#/utils/error-handling.js', () => ({
  formatUserError: vi.fn(),
}))

describe('executeScript', () => {
  const createSelectedScript = (
    overrides: Partial<SelectedScript> = {}
  ): SelectedScript => ({
    packageName: '@test/ui-components',
    packagePath: '/workspace/packages/ui-components',
    scriptName: 'build',
    scriptCommand: 'vite build',
    ...overrides,
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('successful execution flow', () => {
    test('detects package manager, generates command, and executes in terminal', async () => {
      const { executeScript } = await import(
        '#/script-execution/execute-script.js'
      )
      const { detectPackageManager } = await import(
        '#/package-manager/detect-package-manager.js'
      )
      const { generateCommand } = await import(
        '#/script-execution/generate-command.js'
      )
      const { createAndExecuteInTerminal } = await import(
        '#/script-execution/terminal-manager.js'
      )

      const script = createSelectedScript()
      const workspacePath = '/workspace'

      vi.mocked(detectPackageManager).mockResolvedValue(
        'pnpm' as PackageManager
      )
      vi.mocked(generateCommand).mockResolvedValue(
        'pnpm --filter @test/ui-components build'
      )
      vi.mocked(createAndExecuteInTerminal).mockResolvedValue()

      await executeScript(script, workspacePath)

      expect(detectPackageManager).toHaveBeenCalledWith(workspacePath)
      expect(generateCommand).toHaveBeenCalledWith(
        script,
        'pnpm',
        workspacePath
      )
      expect(createAndExecuteInTerminal).toHaveBeenCalledWith(
        'pnpm --filter @test/ui-components build',
        '@test/ui-components',
        script.packagePath
      )
    })

    test('uses package path as working directory for terminal', async () => {
      const { executeScript } = await import(
        '#/script-execution/execute-script.js'
      )
      const { detectPackageManager } = await import(
        '#/package-manager/detect-package-manager.js'
      )
      const { generateCommand } = await import(
        '#/script-execution/generate-command.js'
      )
      const { createAndExecuteInTerminal } = await import(
        '#/script-execution/terminal-manager.js'
      )

      const script = createSelectedScript({
        packagePath: '/workspace/packages/api-server',
      })

      vi.mocked(detectPackageManager).mockResolvedValue('npm' as PackageManager)
      vi.mocked(generateCommand).mockResolvedValue(
        'npm run build --workspace=@test/ui-components'
      )
      vi.mocked(createAndExecuteInTerminal).mockResolvedValue()

      await executeScript(script, '/workspace')

      expect(createAndExecuteInTerminal).toHaveBeenCalledWith(
        'npm run build --workspace=@test/ui-components',
        '@test/ui-components',
        '/workspace/packages/api-server'
      )
    })

    test('handles different package managers correctly', async () => {
      const { executeScript } = await import(
        '#/script-execution/execute-script.js'
      )
      const { detectPackageManager } = await import(
        '#/package-manager/detect-package-manager.js'
      )
      const { generateCommand } = await import(
        '#/script-execution/generate-command.js'
      )
      const { createAndExecuteInTerminal } = await import(
        '#/script-execution/terminal-manager.js'
      )

      const script = createSelectedScript()

      vi.mocked(detectPackageManager).mockResolvedValue(
        'yarn' as PackageManager
      )
      vi.mocked(generateCommand).mockResolvedValue(
        'yarn workspace @test/ui-components build'
      )
      vi.mocked(createAndExecuteInTerminal).mockResolvedValue()

      await executeScript(script, '/workspace')

      expect(generateCommand).toHaveBeenCalledWith(script, 'yarn', '/workspace')
      expect(createAndExecuteInTerminal).toHaveBeenCalledWith(
        'yarn workspace @test/ui-components build',
        '@test/ui-components',
        script.packagePath
      )
    })

    test('passes package name to terminal for proper naming', async () => {
      const { executeScript } = await import(
        '#/script-execution/execute-script.js'
      )
      const { detectPackageManager } = await import(
        '#/package-manager/detect-package-manager.js'
      )
      const { generateCommand } = await import(
        '#/script-execution/generate-command.js'
      )
      const { createAndExecuteInTerminal } = await import(
        '#/script-execution/terminal-manager.js'
      )

      const script = createSelectedScript({
        packageName: '@company/special-package',
      })

      vi.mocked(detectPackageManager).mockResolvedValue(
        'pnpm' as PackageManager
      )
      vi.mocked(generateCommand).mockResolvedValue('pnpm build')
      vi.mocked(createAndExecuteInTerminal).mockResolvedValue()

      await executeScript(script, '/workspace')

      expect(createAndExecuteInTerminal).toHaveBeenCalledWith(
        'pnpm build',
        '@company/special-package',
        script.packagePath
      )
    })
  })

  describe('error handling', () => {
    test('throws formatted error when package manager detection fails', async () => {
      const { executeScript } = await import(
        '#/script-execution/execute-script.js'
      )
      const { detectPackageManager } = await import(
        '#/package-manager/detect-package-manager.js'
      )
      const { formatUserError } = await import('#/utils/error-handling.js')

      const script = createSelectedScript()
      const error = new Error('Permission denied')

      vi.mocked(detectPackageManager).mockRejectedValue(error)
      vi.mocked(formatUserError).mockReturnValue(
        'Formatted error: detecting package manager'
      )

      await expect(executeScript(script, '/workspace')).rejects.toThrow(
        'Formatted error: detecting package manager'
      )

      expect(formatUserError).toHaveBeenCalledWith(
        error,
        'detecting package manager'
      )
    })

    test('throws formatted error when command generation fails', async () => {
      const { executeScript } = await import(
        '#/script-execution/execute-script.js'
      )
      const { detectPackageManager } = await import(
        '#/package-manager/detect-package-manager.js'
      )
      const { generateCommand } = await import(
        '#/script-execution/generate-command.js'
      )
      const { formatUserError } = await import('#/utils/error-handling.js')

      const script = createSelectedScript()
      const error = new Error('Invalid script configuration')

      vi.mocked(detectPackageManager).mockResolvedValue(
        'pnpm' as PackageManager
      )
      vi.mocked(generateCommand).mockRejectedValue(error)
      vi.mocked(formatUserError).mockReturnValue(
        'Formatted error: generating command'
      )

      await expect(executeScript(script, '/workspace')).rejects.toThrow(
        'Formatted error: generating command'
      )

      expect(formatUserError).toHaveBeenCalledWith(error, 'generating command')
    })

    test('throws formatted error when terminal execution fails', async () => {
      const { executeScript } = await import(
        '#/script-execution/execute-script.js'
      )
      const { detectPackageManager } = await import(
        '#/package-manager/detect-package-manager.js'
      )
      const { generateCommand } = await import(
        '#/script-execution/generate-command.js'
      )
      const { createAndExecuteInTerminal } = await import(
        '#/script-execution/terminal-manager.js'
      )
      const { formatUserError } = await import('#/utils/error-handling.js')

      const script = createSelectedScript()
      const error = new Error('Terminal creation failed')

      vi.mocked(detectPackageManager).mockResolvedValue(
        'pnpm' as PackageManager
      )
      vi.mocked(generateCommand).mockResolvedValue('pnpm build')
      vi.mocked(createAndExecuteInTerminal).mockRejectedValue(error)
      vi.mocked(formatUserError).mockReturnValue(
        'Formatted error: executing script'
      )

      await expect(executeScript(script, '/workspace')).rejects.toThrow(
        'Formatted error: executing script'
      )

      expect(formatUserError).toHaveBeenCalledWith(error, 'executing script')
    })
  })

  describe('edge cases', () => {
    test('handles empty workspace path', async () => {
      const { executeScript } = await import(
        '#/script-execution/execute-script.js'
      )
      const { detectPackageManager } = await import(
        '#/package-manager/detect-package-manager.js'
      )
      const { generateCommand } = await import(
        '#/script-execution/generate-command.js'
      )
      const { createAndExecuteInTerminal } = await import(
        '#/script-execution/terminal-manager.js'
      )

      const script = createSelectedScript()

      vi.mocked(detectPackageManager).mockResolvedValue('npm' as PackageManager)
      vi.mocked(generateCommand).mockResolvedValue('npm run build')
      vi.mocked(createAndExecuteInTerminal).mockResolvedValue()

      await executeScript(script, '')

      expect(detectPackageManager).toHaveBeenCalledWith('')
      expect(generateCommand).toHaveBeenCalledWith(script, 'npm', '')
    })

    test('handles script with empty package name', async () => {
      const { executeScript } = await import(
        '#/script-execution/execute-script.js'
      )
      const { detectPackageManager } = await import(
        '#/package-manager/detect-package-manager.js'
      )
      const { generateCommand } = await import(
        '#/script-execution/generate-command.js'
      )
      const { createAndExecuteInTerminal } = await import(
        '#/script-execution/terminal-manager.js'
      )

      const script = createSelectedScript({
        packageName: '',
      })

      vi.mocked(detectPackageManager).mockResolvedValue(
        'pnpm' as PackageManager
      )
      vi.mocked(generateCommand).mockResolvedValue('pnpm build')
      vi.mocked(createAndExecuteInTerminal).mockResolvedValue()

      await executeScript(script, '/workspace')

      expect(createAndExecuteInTerminal).toHaveBeenCalledWith(
        'pnpm build',
        '',
        script.packagePath
      )
    })

    test('handles script with complex names and special characters', async () => {
      const { executeScript } = await import(
        '#/script-execution/execute-script.js'
      )
      const { detectPackageManager } = await import(
        '#/package-manager/detect-package-manager.js'
      )
      const { generateCommand } = await import(
        '#/script-execution/generate-command.js'
      )
      const { createAndExecuteInTerminal } = await import(
        '#/script-execution/terminal-manager.js'
      )

      const script = createSelectedScript({
        scriptName: 'build:prod:watch',
        scriptCommand: 'cross-env NODE_ENV=production webpack --watch',
      })

      vi.mocked(detectPackageManager).mockResolvedValue(
        'yarn' as PackageManager
      )
      vi.mocked(generateCommand).mockResolvedValue(
        'yarn workspace @test/ui-components build:prod:watch'
      )
      vi.mocked(createAndExecuteInTerminal).mockResolvedValue()

      await executeScript(script, '/workspace')

      expect(generateCommand).toHaveBeenCalledWith(script, 'yarn', '/workspace')
      expect(createAndExecuteInTerminal).toHaveBeenCalledWith(
        'yarn workspace @test/ui-components build:prod:watch',
        '@test/ui-components',
        script.packagePath
      )
    })
  })
})
