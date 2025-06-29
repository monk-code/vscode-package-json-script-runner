import { describe, test, expect, vi, beforeEach } from 'vitest'
import type * as vscode from 'vscode'
import {
  createMockExtensionContext,
  createMockWorkspaceFolder,
  createMockDisposable,
} from '#/__tests__/test-utils/vscode-mocks.js'

// Mock VS Code API
const mockCommands = {
  registerCommand: vi.fn().mockReturnValue(createMockDisposable()),
}

const mockWindow = {
  showErrorMessage: vi.fn(),
  showInformationMessage: vi.fn(),
  createQuickPick: vi.fn(),
}

const mockWorkspace: {
  workspaceFolders: vscode.WorkspaceFolder[] | undefined
} = {
  workspaceFolders: undefined,
}

vi.mock('vscode', () => ({
  commands: mockCommands,
  window: mockWindow,
  workspace: mockWorkspace,
}))

// Mock our modules
vi.mock('#/package-discovery/discover-packages.js', () => ({
  discoverPackages: vi.fn(),
}))

vi.mock('#/script-quick-pick/show-script-picker.js', () => ({
  showScriptPicker: vi.fn(),
}))

vi.mock('#/utils/error-handling.js', () => ({
  formatUserError: vi.fn(),
}))

const mockRecentCommandsManager = {
  getValidatedRecentCommands: vi.fn().mockResolvedValue([]),
  addRecentCommand: vi.fn().mockResolvedValue(undefined),
}

vi.mock('#/recent-commands/recent-commands-manager.js', () => ({
  RecentCommandsManager: vi.fn(() => mockRecentCommandsManager),
}))

vi.mock('#/script-execution/execute-script.js', () => ({
  executeScript: vi.fn(),
}))

vi.mock('#/script-execution/terminal-manager.js', () => ({
  disposeTerminalManager: vi.fn(),
}))

describe('Extension', () => {
  let mockContext: vscode.ExtensionContext

  beforeEach(() => {
    vi.clearAllMocks()
    mockContext = createMockExtensionContext()
    mockWorkspace.workspaceFolders = undefined
    mockRecentCommandsManager.getValidatedRecentCommands.mockResolvedValue([])
    mockRecentCommandsManager.addRecentCommand.mockResolvedValue(undefined)
  })

  const getCommandHandler = (): (() => Promise<void>) => {
    const registerCalls = mockCommands.registerCommand.mock.calls
    expect(registerCalls.length).toBeGreaterThan(0)
    return registerCalls[0][1]
  }

  const createSelectedScript = () => ({
    packageName: 'test-package',
    packagePath: '/test/path',
    scriptName: 'build',
    scriptCommand: 'npm run build',
  })

  describe('activate', () => {
    test('registers command with correct ID', async () => {
      const { activate } = await import('#/extension/extension.js')

      activate(mockContext)

      expect(mockCommands.registerCommand).toHaveBeenCalledWith(
        'vscode-package-json-script-runner.runScript',
        expect.any(Function)
      )
    })

    test('pushes disposable to context subscriptions', async () => {
      const { activate } = await import('#/extension/extension.js')
      const mockDisposable = createMockDisposable()
      mockCommands.registerCommand.mockReturnValue(mockDisposable)

      activate(mockContext)

      expect(mockContext.subscriptions).toContain(mockDisposable)
    })

    test('creates RecentCommandsManager with extension context', async () => {
      const { activate } = await import('#/extension/extension.js')
      const { RecentCommandsManager } = await import(
        '#/recent-commands/recent-commands-manager.js'
      )

      activate(mockContext)

      expect(RecentCommandsManager).toHaveBeenCalledWith(mockContext)
    })

    test('registers runLastScript command with correct ID', async () => {
      const { activate } = await import('#/extension/extension.js')

      activate(mockContext)

      expect(mockCommands.registerCommand).toHaveBeenCalledWith(
        'vscode-package-json-script-runner.runLastScript',
        expect.any(Function)
      )
    })

    test('pushes runLastScript disposable to context subscriptions', async () => {
      const { activate } = await import('#/extension/extension.js')
      const mockDisposable1 = createMockDisposable()
      const mockDisposable2 = createMockDisposable()
      mockCommands.registerCommand
        .mockReturnValueOnce(mockDisposable1)
        .mockReturnValueOnce(mockDisposable2)

      activate(mockContext)

      expect(mockContext.subscriptions).toContain(mockDisposable1)
      expect(mockContext.subscriptions).toContain(mockDisposable2)
    })
  })

  describe('command execution', () => {
    test('shows error when no workspace folders exist', async () => {
      const { activate } = await import('#/extension/extension.js')

      activate(mockContext)
      const commandHandler = getCommandHandler()
      await commandHandler()

      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        'No workspace folder found'
      )
    })

    test('shows error when workspace folders array is empty', async () => {
      const { activate } = await import('#/extension/extension.js')
      mockWorkspace.workspaceFolders = []

      activate(mockContext)
      const commandHandler = getCommandHandler()
      await commandHandler()

      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        'No workspace folder found'
      )
    })

    test('discovers packages from first workspace folder', async () => {
      const { activate } = await import('#/extension/extension.js')
      const { discoverPackages } = await import(
        '#/package-discovery/discover-packages.js'
      )
      const { showScriptPicker } = await import(
        '#/script-quick-pick/show-script-picker.js'
      )

      mockWorkspace.workspaceFolders = [createMockWorkspaceFolder('/test/path')]
      vi.mocked(discoverPackages).mockResolvedValue([])
      vi.mocked(showScriptPicker).mockResolvedValue(undefined)

      activate(mockContext)

      const commandHandler = getCommandHandler()
      await commandHandler()

      expect(discoverPackages).toHaveBeenCalledWith('/test/path')
    })

    test('uses first workspace folder when multiple exist', async () => {
      const { activate } = await import('#/extension/extension.js')
      const { discoverPackages } = await import(
        '#/package-discovery/discover-packages.js'
      )
      const { showScriptPicker } = await import(
        '#/script-quick-pick/show-script-picker.js'
      )

      mockWorkspace.workspaceFolders = [
        createMockWorkspaceFolder('/first/path'),
        createMockWorkspaceFolder('/second/path'),
        createMockWorkspaceFolder('/third/path'),
      ]
      vi.mocked(discoverPackages).mockResolvedValue([])
      vi.mocked(showScriptPicker).mockResolvedValue(undefined)

      activate(mockContext)

      const commandHandler = getCommandHandler()
      await commandHandler()

      expect(discoverPackages).toHaveBeenCalledWith('/first/path')
      expect(discoverPackages).toHaveBeenCalledTimes(1)
    })

    test('shows script picker with discovered packages and recent commands', async () => {
      const { activate } = await import('#/extension/extension.js')
      const { discoverPackages } = await import(
        '#/package-discovery/discover-packages.js'
      )
      const { showScriptPicker } = await import(
        '#/script-quick-pick/show-script-picker.js'
      )

      const mockPackages = [
        {
          path: '/test/pkg1',
          name: 'pkg1',
          scripts: { build: 'npm run build' },
        },
      ] as const

      mockWorkspace.workspaceFolders = [createMockWorkspaceFolder('/test/path')]
      vi.mocked(discoverPackages).mockResolvedValue(mockPackages)
      vi.mocked(showScriptPicker).mockResolvedValue(undefined)

      activate(mockContext)

      const commandHandler = getCommandHandler()
      await commandHandler()

      expect(showScriptPicker).toHaveBeenCalledWith(
        mockPackages,
        '/test/path',
        expect.objectContaining({
          getValidatedRecentCommands: expect.any(Function),
          addRecentCommand: expect.any(Function),
        })
      )
    })

    test('shows script picker even when no packages are discovered', async () => {
      const { activate } = await import('#/extension/extension.js')
      const { discoverPackages } = await import(
        '#/package-discovery/discover-packages.js'
      )
      const { showScriptPicker } = await import(
        '#/script-quick-pick/show-script-picker.js'
      )

      mockWorkspace.workspaceFolders = [createMockWorkspaceFolder('/test/path')]
      vi.mocked(discoverPackages).mockResolvedValue([])
      vi.mocked(showScriptPicker).mockResolvedValue(undefined)

      activate(mockContext)

      const commandHandler = getCommandHandler()
      await commandHandler()

      expect(showScriptPicker).toHaveBeenCalledWith(
        [],
        '/test/path',
        expect.objectContaining({
          getValidatedRecentCommands: expect.any(Function),
          addRecentCommand: expect.any(Function),
        })
      )
    })

    test('executes script with recent when script is selected', async () => {
      const { activate } = await import('#/extension/extension.js')
      const { discoverPackages } = await import(
        '#/package-discovery/discover-packages.js'
      )
      const { showScriptPicker } = await import(
        '#/script-quick-pick/show-script-picker.js'
      )
      const { executeScript } = await import(
        '#/script-execution/execute-script.js'
      )

      const selectedScript = {
        packageName: 'test-package',
        packagePath: '/test/path',
        scriptName: 'build',
        scriptCommand: 'npm run build',
      }

      mockWorkspace.workspaceFolders = [createMockWorkspaceFolder('/test/path')]
      vi.mocked(discoverPackages).mockResolvedValue([])
      vi.mocked(showScriptPicker).mockResolvedValue(selectedScript)
      vi.mocked(executeScript).mockResolvedValue()

      activate(mockContext)

      const commandHandler = getCommandHandler()
      await commandHandler()

      expect(executeScript).toHaveBeenCalledWith(
        selectedScript,
        '/test/path',
        expect.objectContaining({
          getValidatedRecentCommands: expect.any(Function),
          addRecentCommand: expect.any(Function),
        }),
        '/test/path'
      )
      expect(mockWindow.showInformationMessage).not.toHaveBeenCalled()
    })

    test('does nothing when user cancels script selection', async () => {
      const { activate } = await import('#/extension/extension.js')
      const { discoverPackages } = await import(
        '#/package-discovery/discover-packages.js'
      )
      const { showScriptPicker } = await import(
        '#/script-quick-pick/show-script-picker.js'
      )

      mockWorkspace.workspaceFolders = [createMockWorkspaceFolder('/test/path')]
      vi.mocked(discoverPackages).mockResolvedValue([])
      vi.mocked(showScriptPicker).mockResolvedValue(undefined)

      activate(mockContext)

      const commandHandler = getCommandHandler()
      await commandHandler()

      expect(mockWindow.showInformationMessage).not.toHaveBeenCalled()
      expect(mockWindow.showErrorMessage).not.toHaveBeenCalled()
    })

    test('shows formatted error when package discovery fails', async () => {
      const { activate } = await import('#/extension/extension.js')
      const { discoverPackages } = await import(
        '#/package-discovery/discover-packages.js'
      )
      const { formatUserError } = await import('#/utils/error-handling.js')

      const error = new Error('Permission denied')
      mockWorkspace.workspaceFolders = [createMockWorkspaceFolder('/test/path')]
      vi.mocked(discoverPackages).mockRejectedValue(error)
      vi.mocked(formatUserError).mockReturnValue(
        'Formatted error: discovering packages'
      )

      activate(mockContext)

      const commandHandler = getCommandHandler()
      await commandHandler()

      expect(formatUserError).toHaveBeenCalledWith(
        error,
        'discovering packages'
      )
      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        'Formatted error: discovering packages'
      )
    })

    test('shows formatted error when script picker fails', async () => {
      const { activate } = await import('#/extension/extension.js')
      const { discoverPackages } = await import(
        '#/package-discovery/discover-packages.js'
      )
      const { showScriptPicker } = await import(
        '#/script-quick-pick/show-script-picker.js'
      )
      const { formatUserError } = await import('#/utils/error-handling.js')

      const error = new Error('QuickPick error')
      mockWorkspace.workspaceFolders = [createMockWorkspaceFolder('/test/path')]
      vi.mocked(discoverPackages).mockResolvedValue([])
      vi.mocked(showScriptPicker).mockRejectedValue(error)
      vi.mocked(formatUserError).mockReturnValue(
        'Formatted error: selecting script'
      )

      activate(mockContext)

      const commandHandler = getCommandHandler()
      await commandHandler()

      expect(formatUserError).toHaveBeenCalledWith(error, 'selecting script')
      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        'Formatted error: selecting script'
      )
    })

    test('shows information message when command is already executing', async () => {
      const { activate } = await import('#/extension/extension.js')
      const { discoverPackages } = await import(
        '#/package-discovery/discover-packages.js'
      )
      const { showScriptPicker } = await import(
        '#/script-quick-pick/show-script-picker.js'
      )
      const { executeScript } = await import(
        '#/script-execution/execute-script.js'
      )

      const script = createSelectedScript()
      mockWorkspace.workspaceFolders = [createMockWorkspaceFolder('/test/path')]
      vi.mocked(discoverPackages).mockResolvedValue([])
      vi.mocked(showScriptPicker).mockResolvedValue(script)

      // Make executeScript take some time to complete
      vi.mocked(executeScript).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      activate(mockContext)
      const commandHandler = getCommandHandler()

      // Start first execution
      const firstExecution = commandHandler()

      // Try to start second execution immediately
      await commandHandler()

      // Should show information message
      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        'A script is already running. Please wait for it to complete.'
      )

      // Wait for first to complete
      await firstExecution
    })

    test('prevents concurrent command executions', async () => {
      const { activate } = await import('#/extension/extension.js')
      const { discoverPackages } = await import(
        '#/package-discovery/discover-packages.js'
      )
      const { showScriptPicker } = await import(
        '#/script-quick-pick/show-script-picker.js'
      )
      const { executeScript } = await import(
        '#/script-execution/execute-script.js'
      )

      const script = createSelectedScript()
      mockWorkspace.workspaceFolders = [createMockWorkspaceFolder('/test/path')]
      vi.mocked(discoverPackages).mockResolvedValue([])
      vi.mocked(showScriptPicker).mockResolvedValue(script)

      // Make executeScript take some time to complete
      vi.mocked(executeScript).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      activate(mockContext)
      const commandHandler = getCommandHandler()

      // Start first execution
      const firstExecution = commandHandler()

      // Try to start second execution immediately
      const secondExecution = commandHandler()

      // Wait for both to complete
      await Promise.all([firstExecution, secondExecution])

      // Should only execute once - the second attempt should be ignored
      expect(discoverPackages).toHaveBeenCalledTimes(1)
      expect(showScriptPicker).toHaveBeenCalledTimes(1)
      expect(executeScript).toHaveBeenCalledTimes(1)
    })

    test('shows formatted error when script execution fails', async () => {
      const { activate } = await import('#/extension/extension.js')
      const { discoverPackages } = await import(
        '#/package-discovery/discover-packages.js'
      )
      const { showScriptPicker } = await import(
        '#/script-quick-pick/show-script-picker.js'
      )
      const { executeScript } = await import(
        '#/script-execution/execute-script.js'
      )
      const { formatUserError } = await import('#/utils/error-handling.js')

      const selectedScript = {
        packageName: 'test-package',
        packagePath: '/test/path',
        scriptName: 'build',
        scriptCommand: 'npm run build',
      }
      const error = new Error('Script execution failed')

      mockWorkspace.workspaceFolders = [createMockWorkspaceFolder('/test/path')]
      vi.mocked(discoverPackages).mockResolvedValue([])
      vi.mocked(showScriptPicker).mockResolvedValue(selectedScript)
      vi.mocked(executeScript).mockRejectedValue(error)
      vi.mocked(formatUserError).mockReturnValue(
        'Formatted error: executing script'
      )

      activate(mockContext)

      const commandHandler = getCommandHandler()
      await commandHandler()

      expect(formatUserError).toHaveBeenCalledWith(error, 'executing script')
      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        'Formatted error: executing script'
      )
    })
  })

  describe('runLastScript command', () => {
    const getRunLastScriptHandler = (): (() => Promise<void>) => {
      const registerCalls = mockCommands.registerCommand.mock.calls
      const runLastScriptCall = registerCalls.find(
        (call) => call[0] === 'vscode-package-json-script-runner.runLastScript'
      )
      expect(runLastScriptCall).toBeDefined()
      if (!runLastScriptCall) {
        throw new Error('runLastScript command not found')
      }
      return runLastScriptCall[1]
    }

    test('executes most recent valid command without showing picker', async () => {
      const { activate } = await import('#/extension/extension.js')
      const { executeScript } = await import(
        '#/script-execution/execute-script.js'
      )
      const { showScriptPicker } = await import(
        '#/script-quick-pick/show-script-picker.js'
      )

      const recentCommand = {
        scriptName: 'build',
        packageName: 'recent-package',
        packagePath: 'packages/recent',
        scriptCommand: 'npm run build',
        timestamp: Date.now(),
      }

      mockWorkspace.workspaceFolders = [createMockWorkspaceFolder('/test/path')]

      // Mock recent commands manager to return our recent command
      mockRecentCommandsManager.getValidatedRecentCommands.mockResolvedValue([
        recentCommand,
      ])

      vi.mocked(executeScript).mockResolvedValue()

      activate(mockContext)
      const handler = getRunLastScriptHandler()
      await handler()

      // Should execute the script directly without showing picker
      expect(executeScript).toHaveBeenCalledWith(
        {
          packageName: recentCommand.packageName,
          packagePath: '/test/path/packages/recent',
          scriptName: recentCommand.scriptName,
          scriptCommand: recentCommand.scriptCommand,
        },
        '/test/path',
        expect.objectContaining({
          getValidatedRecentCommands: expect.any(Function),
          addRecentCommand: expect.any(Function),
        }),
        '/test/path'
      )
      expect(showScriptPicker).not.toHaveBeenCalled()
    })

    test('shows information message when no recent commands exist', async () => {
      const { activate } = await import('#/extension/extension.js')
      const { executeScript } = await import(
        '#/script-execution/execute-script.js'
      )

      mockWorkspace.workspaceFolders = [createMockWorkspaceFolder('/test/path')]

      // Mock recent commands manager to return empty array
      mockRecentCommandsManager.getValidatedRecentCommands.mockResolvedValue([])

      activate(mockContext)
      const handler = getRunLastScriptHandler()
      await handler()

      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        'No recent commands found'
      )
      expect(executeScript).not.toHaveBeenCalled()
    })

    test('shows visual feedback when running last command', async () => {
      const { activate } = await import('#/extension/extension.js')
      const { executeScript } = await import(
        '#/script-execution/execute-script.js'
      )

      const recentCommand = {
        scriptName: 'test',
        packageName: 'my-app',
        packagePath: 'apps/my-app',
        scriptCommand: 'npm test',
        timestamp: Date.now(),
      }

      mockWorkspace.workspaceFolders = [createMockWorkspaceFolder('/test/path')]
      mockRecentCommandsManager.getValidatedRecentCommands.mockResolvedValue([
        recentCommand,
      ])
      vi.mocked(executeScript).mockResolvedValue()

      activate(mockContext)
      const handler = getRunLastScriptHandler()
      await handler()

      // Should show information message before executing
      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        'Running: test (my-app)'
      )
      expect(executeScript).toHaveBeenCalled()
    })
  })

  describe('deactivate', () => {
    test('exports deactivate function', async () => {
      const { deactivate } = await import('#/extension/extension.js')

      expect(deactivate).toBeDefined()
      expect(typeof deactivate).toBe('function')
    })

    test('disposes terminal manager on deactivation', async () => {
      const { deactivate } = await import('#/extension/extension.js')
      const { disposeTerminalManager } = await import(
        '#/script-execution/terminal-manager.js'
      )

      deactivate()

      expect(disposeTerminalManager).toHaveBeenCalled()
    })

    test('deactivate function runs without error', async () => {
      const { deactivate } = await import('#/extension/extension.js')

      expect(() => deactivate()).not.toThrow()
    })
  })
})
