import { describe, it, expect, vi, beforeEach } from 'vitest'
import { detectPackageManager } from '#/package-manager/detect-package-manager.js'
import { generateCommand } from '#/script-execution/generate-command.js'
import { createAndExecuteInTerminal } from '#/script-execution/terminal-manager.js'
import type { RecentCommandsManager } from '#/recent-commands/recent-commands-manager.js'
import type { SelectedScript } from '#/types/selected-script.js'

vi.mock('#/package-manager/detect-package-manager.js')
vi.mock('#/script-execution/generate-command.js')
vi.mock('#/script-execution/terminal-manager.js', () => ({
  createAndExecuteInTerminal: vi.fn(),
}))
vi.mock('#/recent-commands/recent-commands-manager.js')

describe('executeScript with recent commands tracking', () => {
  let mockRecentCommandsManager: RecentCommandsManager
  const workspacePath = '/workspace'

  beforeEach(() => {
    vi.clearAllMocks()

    mockRecentCommandsManager = {
      addRecentCommand: vi.fn().mockResolvedValue(undefined),
    } as unknown as RecentCommandsManager

    vi.mocked(detectPackageManager).mockResolvedValue('npm')

    vi.mocked(generateCommand).mockResolvedValue('npm run test')
    vi.mocked(createAndExecuteInTerminal).mockResolvedValue(undefined)
  })

  it('should save command to recent commands after successful execution', async () => {
    const script: SelectedScript = {
      scriptName: 'test',
      scriptCommand: 'vitest',
      packageName: 'core',
      packagePath: './packages/core',
    }

    const executeScriptWithRecent = await import(
      '#/script-execution/execute-script.js'
    ).then((m) => m.executeScriptWithRecent)

    await executeScriptWithRecent(
      script,
      workspacePath,
      mockRecentCommandsManager
    )

    // Wait for async save to complete
    await new Promise((resolve) => setImmediate(resolve))

    expect(mockRecentCommandsManager.addRecentCommand).toHaveBeenCalledWith({
      scriptName: 'test',
      packageName: 'core',
      packagePath: './packages/core',
      scriptCommand: 'vitest',
      timestamp: expect.any(Number),
    })
  })

  it('should save command with workspace folder when provided', async () => {
    const script: SelectedScript = {
      scriptName: 'test',
      scriptCommand: 'vitest',
      packageName: 'core',
      packagePath: './packages/core',
    }

    const executeScriptWithRecent = await import(
      '#/script-execution/execute-script.js'
    ).then((m) => m.executeScriptWithRecent)

    await executeScriptWithRecent(
      script,
      workspacePath,
      mockRecentCommandsManager,
      'frontend'
    )

    // Wait for async save to complete
    await new Promise((resolve) => setImmediate(resolve))

    expect(mockRecentCommandsManager.addRecentCommand).toHaveBeenCalledWith({
      scriptName: 'test',
      packageName: 'core',
      packagePath: './packages/core',
      scriptCommand: 'vitest',
      timestamp: expect.any(Number),
      workspaceFolder: 'frontend',
    })
  })

  it('should handle concurrent access when saving recent command', async () => {
    const script: SelectedScript = {
      scriptName: 'test',
      scriptCommand: 'vitest',
      packageName: 'core',
      packagePath: './packages/core',
    }

    let resolveAdd: (() => void) | undefined
    const addPromise = new Promise<void>((resolve) => {
      resolveAdd = resolve
    })

    vi.mocked(mockRecentCommandsManager.addRecentCommand).mockReturnValueOnce(
      addPromise
    )

    const executeScriptWithRecent = await import(
      '#/script-execution/execute-script.js'
    ).then((m) => m.executeScriptWithRecent)

    const executePromise = executeScriptWithRecent(
      script,
      workspacePath,
      mockRecentCommandsManager
    )

    // Wait a tick to ensure the command execution has started
    await new Promise((resolve) => setImmediate(resolve))

    expect(mockRecentCommandsManager.addRecentCommand).toHaveBeenCalled()
    expect(createAndExecuteInTerminal).toHaveBeenCalled()

    resolveAdd?.()
    await executePromise
  })

  it('should not block execution if saving recent command fails', async () => {
    const script: SelectedScript = {
      scriptName: 'test',
      scriptCommand: 'vitest',
      packageName: 'core',
      packagePath: './packages/core',
    }

    vi.mocked(mockRecentCommandsManager.addRecentCommand).mockRejectedValue(
      new Error('Storage error')
    )

    const executeScriptWithRecent = await import(
      '#/script-execution/execute-script.js'
    ).then((m) => m.executeScriptWithRecent)

    await executeScriptWithRecent(
      script,
      workspacePath,
      mockRecentCommandsManager
    )

    expect(createAndExecuteInTerminal).toHaveBeenCalled()

    // Wait for async save to complete
    await new Promise((resolve) => setImmediate(resolve))
  })
})
