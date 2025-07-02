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
  onDidStartTerminalShellExecution: vi.fn(),
  onDidEndTerminalShellExecution: vi.fn(),
}

vi.mock('vscode', () => ({
  window: mockWindow,
}))

describe('Terminal Smart Selection', () => {
  let pool: TerminalPool
  let mockTerminals: vscode.Terminal[]
  let mockDisposable: vscode.Disposable
  let startExecutionEmitter: ReturnType<
    typeof createMockEventEmitter<vscode.TerminalShellExecutionStartEvent>
  >
  let endExecutionEmitter: ReturnType<
    typeof createMockEventEmitter<vscode.TerminalShellExecutionEndEvent>
  >

  const createMockShellExecution = (
    commandLine: string
  ): vscode.TerminalShellExecution => ({
    commandLine: { value: commandLine, confidence: 2, isTrusted: true },
    cwd: undefined,
    read: vi.fn(),
  })

  const createMockShellIntegration = (): vscode.TerminalShellIntegration => ({
    cwd: undefined,
    executeCommand: vi.fn(),
  })

  beforeEach(() => {
    mockDisposable = createMockDisposable()
    mockTerminals = [
      createMockTerminal('Terminal 1'),
      createMockTerminal('Terminal 2'),
      createMockTerminal('Terminal 3'),
    ]
    startExecutionEmitter =
      createMockEventEmitter<vscode.TerminalShellExecutionStartEvent>()
    endExecutionEmitter =
      createMockEventEmitter<vscode.TerminalShellExecutionEndEvent>()

    mockWindow.onDidCloseTerminal.mockReturnValue(mockDisposable)
    mockWindow.onDidStartTerminalShellExecution.mockReturnValue(mockDisposable)
    mockWindow.onDidEndTerminalShellExecution.mockReturnValue(mockDisposable)

    mockWindow.onDidStartTerminalShellExecution.mockImplementation(
      startExecutionEmitter.event
    )
    mockWindow.onDidEndTerminalShellExecution.mockImplementation(
      endExecutionEmitter.event
    )
  })

  afterEach(() => {
    if (pool) {
      pool.dispose()
    }
    vi.clearAllMocks()
  })

  describe('Smart Terminal Reuse', () => {
    it('should reuse terminal when previous command completes', async () => {
      const { TerminalPool } = await import('../../terminal/terminal-pool.js')
      pool = new TerminalPool()

      mockWindow.createTerminal.mockReturnValue(mockTerminals[0])

      // First script starts
      const terminal1 = pool.getOrCreateTerminal('key1', 'Script 1', {
        cwd: '/path',
      })
      expect(mockWindow.createTerminal).toHaveBeenCalledTimes(1)

      // Start execution
      startExecutionEmitter.fire({
        terminal: mockTerminals[0],
        execution: createMockShellExecution('npm run dev'),
        shellIntegration: createMockShellIntegration(),
      })

      // End execution
      endExecutionEmitter.fire({
        terminal: mockTerminals[0],
        execution: createMockShellExecution('npm run dev'),
        exitCode: 0,
        shellIntegration: createMockShellIntegration(),
      })

      // Second script should reuse the same terminal
      const terminal2 = pool.getOrCreateTerminal('key1', 'Script 2', {
        cwd: '/path',
      })
      expect(terminal1).toBe(terminal2)
      expect(mockWindow.createTerminal).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple busy terminals correctly', async () => {
      const { TerminalPool } = await import('../../terminal/terminal-pool.js')
      pool = new TerminalPool()

      mockWindow.createTerminal
        .mockReturnValueOnce(mockTerminals[0])
        .mockReturnValueOnce(mockTerminals[1])
        .mockReturnValueOnce(mockTerminals[2])

      // Create terminals with different keys
      const terminal1 = pool.getOrCreateTerminal('package1', 'dev', {
        cwd: '/path1',
      })
      pool.getOrCreateTerminal('package2', 'test', { cwd: '/path2' })

      // Make both terminals busy
      startExecutionEmitter.fire({
        terminal: mockTerminals[0],
        execution: createMockShellExecution('npm run dev'),
        shellIntegration: createMockShellIntegration(),
      })

      startExecutionEmitter.fire({
        terminal: mockTerminals[1],
        execution: createMockShellExecution('npm test'),
        shellIntegration: createMockShellIntegration(),
      })

      // Request terminal for package1 again - should create new one since it's busy
      const terminal3 = pool.getOrCreateTerminal('package1', 'build', {
        cwd: '/path1',
      })
      expect(terminal3).not.toBe(terminal1)
      expect(mockWindow.createTerminal).toHaveBeenCalledTimes(3)

      // Complete second terminal's execution
      endExecutionEmitter.fire({
        terminal: mockTerminals[1],
        execution: createMockShellExecution('npm test'),
        exitCode: 0,
        shellIntegration: createMockShellIntegration(),
      })

      // Complete third terminal's execution
      endExecutionEmitter.fire({
        terminal: mockTerminals[2],
        execution: createMockShellExecution('npm run build'),
        exitCode: 0,
        shellIntegration: createMockShellIntegration(),
      })

      // Next request for package1 should reuse the current mapped terminal (terminal3)
      const terminal4 = pool.getOrCreateTerminal('package1', 'lint', {
        cwd: '/path1',
      })
      expect(terminal4).toBe(terminal3)
      expect(mockWindow.createTerminal).toHaveBeenCalledTimes(3)
    })

    it('should handle shell integration not available', async () => {
      // Reset mocks to simulate shell integration not available
      vi.resetModules()
      vi.doMock('vscode', () => ({
        window: {
          ...mockWindow,
          onDidStartTerminalShellExecution: undefined,
          onDidEndTerminalShellExecution: undefined,
        },
      }))

      const { TerminalPool } = await import('../../terminal/terminal-pool.js')
      pool = new TerminalPool()

      mockWindow.createTerminal.mockReturnValue(mockTerminals[0])

      // Should create terminal normally
      const terminal1 = pool.getOrCreateTerminal('key1', 'Script 1', {
        cwd: '/path',
      })
      expect(mockWindow.createTerminal).toHaveBeenCalledTimes(1)

      // Should reuse terminal since we can't detect if it's busy
      const terminal2 = pool.getOrCreateTerminal('key1', 'Script 2', {
        cwd: '/path',
      })
      expect(terminal1).toBe(terminal2)
      expect(mockWindow.createTerminal).toHaveBeenCalledTimes(1)
    })
  })
})
