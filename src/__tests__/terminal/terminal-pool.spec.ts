import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as vscode from 'vscode'
import {
  createMockTerminal,
  createMockDisposable,
  createMockEventEmitter,
} from '../test-utils/vscode-mocks.js'
import type { TerminalPool } from '../../terminal/terminal-pool.js'

const mockWindow = {
  createTerminal: vi.fn(),
  onDidCloseTerminal: vi.fn(),
}

vi.mock('vscode', () => ({
  window: mockWindow,
}))

describe('TerminalPool', () => {
  let pool: TerminalPool
  let mockTerminal: vscode.Terminal
  let mockDisposable: vscode.Disposable
  let closeTerminalEmitter: ReturnType<
    typeof createMockEventEmitter<vscode.Terminal>
  >

  beforeEach(() => {
    mockDisposable = createMockDisposable()
    mockTerminal = createMockTerminal('Test Terminal')
    closeTerminalEmitter = createMockEventEmitter<vscode.Terminal>()

    mockWindow.onDidCloseTerminal.mockReturnValue(mockDisposable)
    mockWindow.onDidCloseTerminal.mockImplementation(closeTerminalEmitter.event)
  })

  afterEach(() => {
    if (pool) {
      pool.dispose()
    }
    vi.clearAllMocks()
  })

  describe('getOrCreateTerminal', () => {
    it('should create a new terminal when pool is empty', async () => {
      const { TerminalPool } = await import('../../terminal/terminal-pool.js')
      pool = new TerminalPool()

      const key = '/path/to/package'
      const name = 'Test Script'
      const options = { cwd: '/path/to/package' }

      mockWindow.createTerminal.mockReturnValue(mockTerminal)

      const terminal = pool.getOrCreateTerminal(key, name, options)

      expect(terminal).toBe(mockTerminal)
      expect(mockWindow.createTerminal).toHaveBeenCalledWith({
        name,
        cwd: options.cwd,
      })
    })

    it('should reuse existing terminal with same key', async () => {
      const { TerminalPool } = await import('../../terminal/terminal-pool.js')
      pool = new TerminalPool()
      const key = '/path/to/package'
      const name = 'Test Script'
      const options = { cwd: '/path/to/package' }

      mockWindow.createTerminal.mockReturnValue(mockTerminal)

      const terminal1 = pool.getOrCreateTerminal(key, name, options)
      const terminal2 = pool.getOrCreateTerminal(key, 'Different Name', options)

      expect(terminal1).toBe(terminal2)
      expect(mockWindow.createTerminal).toHaveBeenCalledTimes(1)
    })

    it('should create different terminals for different keys', async () => {
      const { TerminalPool } = await import('../../terminal/terminal-pool.js')
      pool = new TerminalPool()
      const key1 = '/path/to/package1'
      const key2 = '/path/to/package2'
      const mockTerminal2 = createMockTerminal('Terminal 2')

      mockWindow.createTerminal
        .mockReturnValueOnce(mockTerminal)
        .mockReturnValueOnce(mockTerminal2)

      const terminal1 = pool.getOrCreateTerminal(key1, 'Script 1', {
        cwd: key1,
      })
      const terminal2 = pool.getOrCreateTerminal(key2, 'Script 2', {
        cwd: key2,
      })

      expect(terminal1).not.toBe(terminal2)
      expect(mockWindow.createTerminal).toHaveBeenCalledTimes(2)
    })

    it('should clear terminal before reuse when clearBeforeReuse is true', async () => {
      const { TerminalPool } = await import('../../terminal/terminal-pool.js')
      pool = new TerminalPool()
      const key = '/path/to/package'
      mockWindow.createTerminal.mockReturnValue(mockTerminal)

      pool.getOrCreateTerminal(key, 'First Script', { cwd: key })
      pool.getOrCreateTerminal(key, 'Second Script', { cwd: key }, true)

      expect(mockTerminal.sendText).toHaveBeenCalledWith('clear')
    })

    it('should not clear terminal when clearBeforeReuse is false', async () => {
      const { TerminalPool } = await import('../../terminal/terminal-pool.js')
      pool = new TerminalPool()
      const key = '/path/to/package'
      mockWindow.createTerminal.mockReturnValue(mockTerminal)

      pool.getOrCreateTerminal(key, 'First Script', { cwd: key })
      pool.getOrCreateTerminal(key, 'Second Script', { cwd: key }, false)

      expect(mockTerminal.sendText).not.toHaveBeenCalled()
    })
  })

  describe('terminal disposal handling', () => {
    it('should remove terminal from pool when closed', async () => {
      const { TerminalPool } = await import('../../terminal/terminal-pool.js')
      const key = '/path/to/package'
      closeTerminalEmitter = createMockEventEmitter<vscode.Terminal>()
      mockWindow.onDidCloseTerminal.mockImplementation(
        closeTerminalEmitter.event
      )

      pool = new TerminalPool()
      mockWindow.createTerminal.mockReturnValue(mockTerminal)

      const terminal1 = pool.getOrCreateTerminal(key, 'Script', { cwd: key })
      expect(terminal1).toBe(mockTerminal)

      closeTerminalEmitter.fire(mockTerminal)

      const mockTerminal2 = createMockTerminal('New Terminal')
      mockWindow.createTerminal.mockReturnValue(mockTerminal2)

      const terminal2 = pool.getOrCreateTerminal(key, 'Script', { cwd: key })
      expect(terminal2).toBe(mockTerminal2)
      expect(mockWindow.createTerminal).toHaveBeenCalledTimes(2)
    })
  })

  describe('clear', () => {
    it('should dispose all terminals and clear the pool', async () => {
      const { TerminalPool } = await import('../../terminal/terminal-pool.js')
      pool = new TerminalPool()
      mockWindow.createTerminal.mockReturnValue(mockTerminal)
      const mockTerminal2 = createMockTerminal('Terminal 2')
      mockWindow.createTerminal
        .mockReturnValueOnce(mockTerminal)
        .mockReturnValueOnce(mockTerminal2)

      pool.getOrCreateTerminal('key1', 'Terminal 1', { cwd: '/path1' })
      pool.getOrCreateTerminal('key2', 'Terminal 2', { cwd: '/path2' })

      pool.clear()

      expect(mockTerminal.dispose).toHaveBeenCalled()
      expect(mockTerminal2.dispose).toHaveBeenCalled()

      mockWindow.createTerminal.mockClear()
      const mockTerminal3 = createMockTerminal('New Terminal')
      mockWindow.createTerminal.mockReturnValue(mockTerminal3)

      const newTerminal = pool.getOrCreateTerminal('key1', 'New Terminal', {
        cwd: '/path1',
      })
      expect(newTerminal).toBe(mockTerminal3)
      expect(mockWindow.createTerminal).toHaveBeenCalledTimes(1)
    })
  })

  describe('dispose', () => {
    it('should clear pool and dispose event listener', async () => {
      const { TerminalPool } = await import('../../terminal/terminal-pool.js')

      // Create a fresh mock disposable for this test
      const testDisposable = createMockDisposable()
      mockWindow.onDidCloseTerminal.mockReturnValue(testDisposable)

      pool = new TerminalPool()
      mockWindow.createTerminal.mockReturnValue(mockTerminal)
      pool.getOrCreateTerminal('key', 'Terminal', { cwd: '/path' })

      pool.dispose()

      expect(mockTerminal.dispose).toHaveBeenCalled()
      expect(testDisposable.dispose).toHaveBeenCalled()
    })
  })
})
