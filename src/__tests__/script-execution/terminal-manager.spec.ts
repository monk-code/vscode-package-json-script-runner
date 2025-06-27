import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createMockTerminal } from '#/__tests__/test-utils/vscode-mocks.js'

const mockWindow = {
  createTerminal: vi.fn().mockReturnValue(createMockTerminal('test-terminal')),
}

vi.mock('vscode', () => ({
  window: mockWindow,
}))

describe('terminalManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createAndExecuteInTerminal', () => {
    test('creates terminal with package context in name', async () => {
      const { createAndExecuteInTerminal } = await import(
        '#/script-execution/terminal-manager.js'
      )

      const mockTerminal = createMockTerminal('test-terminal')
      mockWindow.createTerminal.mockReturnValue(mockTerminal)

      await createAndExecuteInTerminal(
        'pnpm build',
        '@test/ui-components',
        '/workspace/packages/ui-components'
      )

      expect(mockWindow.createTerminal).toHaveBeenCalledWith({
        name: 'Script: @test/ui-components',
        cwd: '/workspace/packages/ui-components',
      })
    })

    test('creates terminal with script name when package name is empty', async () => {
      const { createAndExecuteInTerminal } = await import(
        '#/script-execution/terminal-manager.js'
      )

      const mockTerminal = createMockTerminal('test-terminal')
      mockWindow.createTerminal.mockReturnValue(mockTerminal)

      await createAndExecuteInTerminal(
        'npm run build',
        '',
        '/workspace/packages/unnamed'
      )

      expect(mockWindow.createTerminal).toHaveBeenCalledWith({
        name: 'Script: npm run build',
        cwd: '/workspace/packages/unnamed',
      })
    })

    test('sends command to terminal', async () => {
      const { createAndExecuteInTerminal } = await import(
        '#/script-execution/terminal-manager.js'
      )

      const mockTerminal = createMockTerminal('test-terminal')
      mockWindow.createTerminal.mockReturnValue(mockTerminal)

      await createAndExecuteInTerminal(
        'pnpm --filter @test/ui-components build',
        '@test/ui-components',
        '/workspace'
      )

      expect(mockTerminal.sendText).toHaveBeenCalledWith(
        'pnpm --filter @test/ui-components build'
      )
    })

    test('shows terminal after sending command', async () => {
      const { createAndExecuteInTerminal } = await import(
        '#/script-execution/terminal-manager.js'
      )

      const mockTerminal = createMockTerminal('test-terminal')
      mockWindow.createTerminal.mockReturnValue(mockTerminal)

      await createAndExecuteInTerminal(
        'yarn workspace @test/ui-components build',
        '@test/ui-components',
        '/workspace'
      )

      expect(mockTerminal.show).toHaveBeenCalled()
    })

    test('handles long package names by truncating terminal name', async () => {
      const { createAndExecuteInTerminal } = await import(
        '#/script-execution/terminal-manager.js'
      )

      const mockTerminal = createMockTerminal('test-terminal')
      mockWindow.createTerminal.mockReturnValue(mockTerminal)

      const longPackageName =
        '@very-long-organization-name/extremely-long-package-name-that-exceeds-reasonable-limits'

      await createAndExecuteInTerminal(
        'pnpm build',
        longPackageName,
        '/workspace/packages/long-name'
      )

      expect(mockWindow.createTerminal).toHaveBeenCalledWith({
        name: expect.stringMatching(
          /^Script: @very-long-organization-name\/extremely-long-package-name-that-exceeds\.\.\.$/
        ),
        cwd: '/workspace/packages/long-name',
      })
    })

    test('handles commands with special characters', async () => {
      const { createAndExecuteInTerminal } = await import(
        '#/script-execution/terminal-manager.js'
      )

      const mockTerminal = createMockTerminal('test-terminal')
      mockWindow.createTerminal.mockReturnValue(mockTerminal)

      await createAndExecuteInTerminal(
        'npm run "build:prod" && echo "Build complete!"',
        '@test/ui-components',
        '/workspace/packages/ui-components'
      )

      expect(mockTerminal.sendText).toHaveBeenCalledWith(
        'npm run "build:prod" && echo "Build complete!"'
      )
    })

    test('uses working directory for terminal creation', async () => {
      const { createAndExecuteInTerminal } = await import(
        '#/script-execution/terminal-manager.js'
      )

      const mockTerminal = createMockTerminal('test-terminal')
      mockWindow.createTerminal.mockReturnValue(mockTerminal)

      await createAndExecuteInTerminal(
        'pnpm test',
        '@test/api-server',
        '/workspace/packages/api-server'
      )

      expect(mockWindow.createTerminal).toHaveBeenCalledWith({
        name: 'Script: @test/api-server',
        cwd: '/workspace/packages/api-server',
      })
    })
  })

  describe('edge cases', () => {
    test('handles empty command gracefully', async () => {
      const { createAndExecuteInTerminal } = await import(
        '#/script-execution/terminal-manager.js'
      )

      const mockTerminal = createMockTerminal('test-terminal')
      mockWindow.createTerminal.mockReturnValue(mockTerminal)

      await createAndExecuteInTerminal(
        '',
        '@test/package',
        '/workspace/packages/package'
      )

      expect(mockTerminal.sendText).toHaveBeenCalledWith('')
      expect(mockTerminal.show).toHaveBeenCalled()
    })

    test('handles empty working directory', async () => {
      const { createAndExecuteInTerminal } = await import(
        '#/script-execution/terminal-manager.js'
      )

      const mockTerminal = createMockTerminal('test-terminal')
      mockWindow.createTerminal.mockReturnValue(mockTerminal)

      await createAndExecuteInTerminal('npm run build', '@test/package', '')

      expect(mockWindow.createTerminal).toHaveBeenCalledWith({
        name: 'Script: @test/package',
        cwd: '',
      })
    })

    test('handles null or undefined package name', async () => {
      const { createAndExecuteInTerminal } = await import(
        '#/script-execution/terminal-manager.js'
      )

      const mockTerminal = createMockTerminal('test-terminal')
      mockWindow.createTerminal.mockReturnValue(mockTerminal)

      // Test with empty string to simulate missing package name
      await createAndExecuteInTerminal('npm run build', '', '/workspace')

      expect(mockWindow.createTerminal).toHaveBeenCalledWith({
        name: 'Script: npm run build',
        cwd: '/workspace',
      })
    })
  })
})
