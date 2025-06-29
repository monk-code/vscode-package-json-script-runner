import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createMockTerminal } from '#/__tests__/test-utils/vscode-mocks.js'

const mockGetOrCreateTerminal = vi.fn()
const mockDispose = vi.fn()

const mockTerminalPoolManager = vi.fn(() => ({
  getOrCreateTerminal: mockGetOrCreateTerminal,
  dispose: mockDispose,
}))

vi.mock('../../terminal/terminal-pool-manager.js', () => ({
  TerminalPoolManager: mockTerminalPoolManager,
}))

describe('terminalManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTerminalPoolManager.mockClear()
  })

  describe('createAndExecuteInTerminal', () => {
    test('creates terminal with package context in name', async () => {
      const { createAndExecuteInTerminal } = await import(
        '#/script-execution/terminal-manager.js'
      )

      const mockTerminal = createMockTerminal('test-terminal')
      mockGetOrCreateTerminal.mockReturnValue(mockTerminal)

      await createAndExecuteInTerminal(
        'pnpm build',
        '@test/ui-components',
        '/workspace/packages/ui-components'
      )

      expect(mockGetOrCreateTerminal).toHaveBeenCalledWith(
        'pnpm build',
        '@test/ui-components',
        '/workspace/packages/ui-components'
      )
    })

    test('creates terminal with script name when package name is empty', async () => {
      const { createAndExecuteInTerminal } = await import(
        '#/script-execution/terminal-manager.js'
      )

      const mockTerminal = createMockTerminal('test-terminal')
      mockGetOrCreateTerminal.mockReturnValue(mockTerminal)

      await createAndExecuteInTerminal(
        'npm run build',
        '',
        '/workspace/packages/unnamed'
      )

      expect(mockGetOrCreateTerminal).toHaveBeenCalledWith(
        'npm run build',
        '',
        '/workspace/packages/unnamed'
      )
    })

    test('sends command to terminal', async () => {
      const { createAndExecuteInTerminal } = await import(
        '#/script-execution/terminal-manager.js'
      )

      const mockTerminal = createMockTerminal('test-terminal')
      mockGetOrCreateTerminal.mockReturnValue(mockTerminal)

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
      mockGetOrCreateTerminal.mockReturnValue(mockTerminal)

      await createAndExecuteInTerminal(
        'yarn workspace @test/ui-components build',
        '@test/ui-components',
        '/workspace'
      )

      expect(mockTerminal.show).toHaveBeenCalled()
    })

    test('handles commands with special characters', async () => {
      const { createAndExecuteInTerminal } = await import(
        '#/script-execution/terminal-manager.js'
      )

      const mockTerminal = createMockTerminal('test-terminal')
      mockGetOrCreateTerminal.mockReturnValue(mockTerminal)

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
      mockGetOrCreateTerminal.mockReturnValue(mockTerminal)

      await createAndExecuteInTerminal(
        'pnpm test',
        '@test/api-server',
        '/workspace/packages/api-server'
      )

      expect(mockGetOrCreateTerminal).toHaveBeenCalledWith(
        'pnpm test',
        '@test/api-server',
        '/workspace/packages/api-server'
      )
    })
  })

  describe('edge cases', () => {
    test('handles empty command gracefully', async () => {
      const { createAndExecuteInTerminal } = await import(
        '#/script-execution/terminal-manager.js'
      )

      const mockTerminal = createMockTerminal('test-terminal')
      mockGetOrCreateTerminal.mockReturnValue(mockTerminal)

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
      mockGetOrCreateTerminal.mockReturnValue(mockTerminal)

      await createAndExecuteInTerminal('npm run build', '@test/package', '')

      expect(mockGetOrCreateTerminal).toHaveBeenCalledWith(
        'npm run build',
        '@test/package',
        ''
      )
    })

    test('handles null or undefined package name', async () => {
      const { createAndExecuteInTerminal } = await import(
        '#/script-execution/terminal-manager.js'
      )

      const mockTerminal = createMockTerminal('test-terminal')
      mockGetOrCreateTerminal.mockReturnValue(mockTerminal)

      // Test with empty string to simulate missing package name
      await createAndExecuteInTerminal('npm run build', '', '/workspace')

      expect(mockGetOrCreateTerminal).toHaveBeenCalledWith(
        'npm run build',
        '',
        '/workspace'
      )
    })
  })

  describe('disposeTerminalManager', () => {
    test('disposes the terminal pool manager', async () => {
      const { createAndExecuteInTerminal, disposeTerminalManager } =
        await import('#/script-execution/terminal-manager.js')

      const mockTerminal = createMockTerminal('test-terminal')
      mockGetOrCreateTerminal.mockReturnValue(mockTerminal)

      // Create a terminal to ensure the pool manager is initialized
      await createAndExecuteInTerminal(
        'npm test',
        '@test/package',
        '/workspace'
      )

      disposeTerminalManager()

      expect(mockDispose).toHaveBeenCalled()
    })

    test('can create new terminals after disposal', async () => {
      const { createAndExecuteInTerminal, disposeTerminalManager } =
        await import('#/script-execution/terminal-manager.js')

      const mockTerminal = createMockTerminal('test-terminal')
      mockGetOrCreateTerminal.mockReturnValue(mockTerminal)

      await createAndExecuteInTerminal(
        'npm test',
        '@test/package',
        '/workspace'
      )
      disposeTerminalManager()

      // Clear the mock to ensure a new instance is created
      mockTerminalPoolManager.mockClear()
      mockGetOrCreateTerminal.mockClear()
      mockGetOrCreateTerminal.mockReturnValue(mockTerminal)

      await createAndExecuteInTerminal(
        'npm build',
        '@test/package2',
        '/workspace2'
      )

      expect(mockTerminalPoolManager).toHaveBeenCalledTimes(1)
      expect(mockGetOrCreateTerminal).toHaveBeenCalledWith(
        'npm build',
        '@test/package2',
        '/workspace2'
      )
    })
  })
})
