import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as vscode from 'vscode'
import { createMockTerminal } from '../test-utils/vscode-mocks.js'
import type { TerminalConfig } from '../../terminal/terminal-config.js'

const mockTerminalPool = {
  getOrCreateTerminal: vi.fn(),
  clear: vi.fn(),
  dispose: vi.fn(),
}

const mockGetTerminalConfig = vi.fn<() => TerminalConfig>()

vi.mock('../../terminal/terminal-pool.js', () => ({
  TerminalPool: vi.fn(() => mockTerminalPool),
}))

vi.mock('../../terminal/terminal-config.js', () => ({
  getTerminalConfig: mockGetTerminalConfig,
}))

const mockWindow = {
  createTerminal: vi.fn(),
}

vi.mock('vscode', () => ({
  window: mockWindow,
}))

describe('TerminalPoolManager', () => {
  let mockTerminal: vscode.Terminal

  beforeEach(() => {
    mockTerminal = createMockTerminal('Test Terminal')
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getOrCreateTerminal', () => {
    it('should use pool when strategy is per-package', async () => {
      mockGetTerminalConfig.mockReturnValue({
        terminalReuseStrategy: 'per-package',
        clearTerminalBeforeReuse: true,
        maxTerminals: 10,
      })
      mockTerminalPool.getOrCreateTerminal.mockReturnValue(mockTerminal)

      const { TerminalPoolManager } = await import(
        '../../terminal/terminal-pool-manager.js'
      )
      const manager = new TerminalPoolManager()

      const terminal = manager.getOrCreateTerminal(
        'Test Script',
        '@test/package',
        '/path/to/package'
      )

      expect(terminal).toBe(mockTerminal)
      expect(mockTerminalPool.getOrCreateTerminal).toHaveBeenCalledWith(
        '/path/to/package',
        'Script: @test/package',
        { cwd: '/path/to/package' },
        true
      )
    })

    it('should use pool with workspace key when strategy is per-workspace', async () => {
      mockGetTerminalConfig.mockReturnValue({
        terminalReuseStrategy: 'per-workspace',
        clearTerminalBeforeReuse: false,
        maxTerminals: 10,
      })
      mockTerminalPool.getOrCreateTerminal.mockReturnValue(mockTerminal)

      const { TerminalPoolManager } = await import(
        '../../terminal/terminal-pool-manager.js'
      )
      const manager = new TerminalPoolManager()

      const terminal = manager.getOrCreateTerminal(
        'Test Script',
        '@test/package',
        '/workspace/packages/test'
      )

      expect(terminal).toBe(mockTerminal)
      expect(mockTerminalPool.getOrCreateTerminal).toHaveBeenCalledWith(
        'workspace',
        'Script: @test/package',
        { cwd: '/workspace/packages/test' },
        false
      )
    })

    it('should use pool with single key when strategy is single', async () => {
      mockGetTerminalConfig.mockReturnValue({
        terminalReuseStrategy: 'single',
        clearTerminalBeforeReuse: true,
        maxTerminals: 10,
      })
      mockTerminalPool.getOrCreateTerminal.mockReturnValue(mockTerminal)

      const { TerminalPoolManager } = await import(
        '../../terminal/terminal-pool-manager.js'
      )
      const manager = new TerminalPoolManager()

      const terminal = manager.getOrCreateTerminal(
        'Test Script',
        '@test/package',
        '/path/to/package'
      )

      expect(terminal).toBe(mockTerminal)
      expect(mockTerminalPool.getOrCreateTerminal).toHaveBeenCalledWith(
        'single',
        'Script: @test/package',
        { cwd: '/path/to/package' },
        true
      )
    })

    it('should create new terminal when strategy is none', async () => {
      mockGetTerminalConfig.mockReturnValue({
        terminalReuseStrategy: 'none',
        clearTerminalBeforeReuse: true,
        maxTerminals: 10,
      })
      mockWindow.createTerminal.mockReturnValue(mockTerminal)

      const { TerminalPoolManager } = await import(
        '../../terminal/terminal-pool-manager.js'
      )
      const manager = new TerminalPoolManager()

      const terminal = manager.getOrCreateTerminal(
        'Test Script',
        '@test/package',
        '/path/to/package'
      )

      expect(terminal).toBe(mockTerminal)
      expect(mockWindow.createTerminal).toHaveBeenCalledWith({
        name: 'Script: @test/package',
        cwd: '/path/to/package',
      })
      expect(mockTerminalPool.getOrCreateTerminal).not.toHaveBeenCalled()
    })

    it('should truncate long terminal names', async () => {
      mockGetTerminalConfig.mockReturnValue({
        terminalReuseStrategy: 'none',
        clearTerminalBeforeReuse: true,
        maxTerminals: 10,
      })
      mockWindow.createTerminal.mockReturnValue(mockTerminal)

      const { TerminalPoolManager } = await import(
        '../../terminal/terminal-pool-manager.js'
      )
      const manager = new TerminalPoolManager()

      const longPackageName =
        '@very-long-organization-name/extremely-long-package-name-that-should-be-truncated'
      manager.getOrCreateTerminal('Test Script', longPackageName, '/path')

      const expectedName = `Script: ${longPackageName}`.substring(0, 80)
      expect(mockWindow.createTerminal).toHaveBeenCalledWith({
        name: expectedName,
        cwd: '/path',
      })
    })

    it('should use script name when package name is empty', async () => {
      mockGetTerminalConfig.mockReturnValue({
        terminalReuseStrategy: 'none',
        clearTerminalBeforeReuse: true,
        maxTerminals: 10,
      })
      mockWindow.createTerminal.mockReturnValue(mockTerminal)

      const { TerminalPoolManager } = await import(
        '../../terminal/terminal-pool-manager.js'
      )
      const manager = new TerminalPoolManager()

      manager.getOrCreateTerminal('build', '', '/path')

      expect(mockWindow.createTerminal).toHaveBeenCalledWith({
        name: 'Script: build',
        cwd: '/path',
      })
    })
  })

  describe('dispose', () => {
    it('should dispose the pool when manager is disposed', async () => {
      mockGetTerminalConfig.mockReturnValue({
        terminalReuseStrategy: 'per-package',
        clearTerminalBeforeReuse: true,
        maxTerminals: 10,
      })

      const { TerminalPoolManager } = await import(
        '../../terminal/terminal-pool-manager.js'
      )
      const manager = new TerminalPoolManager()

      manager.dispose()

      expect(mockTerminalPool.dispose).toHaveBeenCalled()
    })
  })
})
