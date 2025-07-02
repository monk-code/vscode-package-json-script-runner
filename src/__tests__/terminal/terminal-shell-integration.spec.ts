import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as vscode from 'vscode'
import {
  createMockTerminal,
  createMockDisposable,
  createMockEventEmitter,
} from '../test-utils/vscode-mocks.js'
import type { TerminalPool } from '../../terminal/terminal-pool.js'

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

const mockWindow = {
  createTerminal: vi.fn(),
  onDidCloseTerminal: vi.fn(),
  onDidStartTerminalShellExecution: vi.fn(),
  onDidEndTerminalShellExecution: vi.fn(),
}

vi.mock('vscode', () => ({
  window: mockWindow,
}))

describe('Terminal Shell Integration', () => {
  let pool: TerminalPool
  let mockTerminal: vscode.Terminal
  let mockDisposable: vscode.Disposable
  let startExecutionEmitter: ReturnType<
    typeof createMockEventEmitter<vscode.TerminalShellExecutionStartEvent>
  >
  let endExecutionEmitter: ReturnType<
    typeof createMockEventEmitter<vscode.TerminalShellExecutionEndEvent>
  >

  beforeEach(() => {
    mockDisposable = createMockDisposable()
    mockTerminal = createMockTerminal('Test Terminal')
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

  describe('Terminal Execution State Tracking', () => {
    it('should track when a terminal has an active execution', async () => {
      const { TerminalPool } = await import('../../terminal/terminal-pool.js')
      pool = new TerminalPool()

      mockWindow.createTerminal.mockReturnValue(mockTerminal)
      const terminal = pool.getOrCreateTerminal('key1', 'Script 1', {
        cwd: '/path',
      })

      expect(pool.isTerminalBusy(terminal)).toBe(false)

      // Simulate shell execution start
      const startEvent: vscode.TerminalShellExecutionStartEvent = {
        terminal: mockTerminal,
        execution: createMockShellExecution('npm run dev'),
        shellIntegration: createMockShellIntegration(),
      }
      startExecutionEmitter.fire(startEvent)

      expect(pool.isTerminalBusy(terminal)).toBe(true)
    })

    it('should mark terminal as not busy when execution ends', async () => {
      const { TerminalPool } = await import('../../terminal/terminal-pool.js')
      pool = new TerminalPool()

      mockWindow.createTerminal.mockReturnValue(mockTerminal)
      const terminal = pool.getOrCreateTerminal('key1', 'Script 1', {
        cwd: '/path',
      })

      // Start execution
      const startEvent: vscode.TerminalShellExecutionStartEvent = {
        terminal: mockTerminal,
        execution: createMockShellExecution('npm run dev'),
        shellIntegration: createMockShellIntegration(),
      }
      startExecutionEmitter.fire(startEvent)

      expect(pool.isTerminalBusy(terminal)).toBe(true)

      // End execution
      const endEvent: vscode.TerminalShellExecutionEndEvent = {
        terminal: mockTerminal,
        execution: createMockShellExecution('npm run dev'),
        exitCode: 0,
        shellIntegration: createMockShellIntegration(),
      }
      endExecutionEmitter.fire(endEvent)

      expect(pool.isTerminalBusy(terminal)).toBe(false)
    })

    it('should create new terminal when requested terminal is busy', async () => {
      const { TerminalPool } = await import('../../terminal/terminal-pool.js')
      pool = new TerminalPool()

      const mockTerminal2 = createMockTerminal('Test Terminal 2')
      mockWindow.createTerminal
        .mockReturnValueOnce(mockTerminal)
        .mockReturnValueOnce(mockTerminal2)

      const terminal1 = pool.getOrCreateTerminal('key1', 'Script 1', {
        cwd: '/path',
      })

      // Make terminal1 busy
      const startEvent: vscode.TerminalShellExecutionStartEvent = {
        terminal: mockTerminal,
        execution: createMockShellExecution('npm run dev'),
        shellIntegration: createMockShellIntegration(),
      }
      startExecutionEmitter.fire(startEvent)

      // Request terminal with same key while first is busy
      const terminal2 = pool.getOrCreateTerminal('key1', 'Script 2', {
        cwd: '/path',
      })

      expect(terminal1).not.toBe(terminal2)
      expect(mockWindow.createTerminal).toHaveBeenCalledTimes(2)
    })
  })
})
