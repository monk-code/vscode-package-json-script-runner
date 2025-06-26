import { describe, test, expect, vi, beforeEach } from 'vitest'
import type * as vscode from 'vscode'

// Create proper mocks without type assertions
const createMockExtensionContext = (): vscode.ExtensionContext => ({
  subscriptions: [] as vscode.Disposable[],
  workspaceState: {} as vscode.Memento,
  globalState: {} as vscode.Memento & {
    setKeysForSync(keys: readonly string[]): void
  },
  secrets: {} as vscode.SecretStorage,
  extensionUri: {} as vscode.Uri,
  extensionPath: '',
  asAbsolutePath: vi.fn((relativePath: string) => `/mock/path/${relativePath}`),
  environmentVariableCollection: {
    getScoped: vi.fn(),
  } as unknown as vscode.GlobalEnvironmentVariableCollection,
  storagePath: undefined,
  globalStoragePath: '',
  logPath: '',
  extensionMode: 1, // Normal mode
  extension: {} as vscode.Extension<unknown>,
  logUri: {} as vscode.Uri,
  storageUri: undefined,
  globalStorageUri: {} as vscode.Uri,
  languageModelAccessInformation: {} as vscode.LanguageModelAccessInformation,
})

const createMockWorkspaceFolder = (path: string): vscode.WorkspaceFolder => ({
  uri: { fsPath: path } as vscode.Uri,
  name: 'test-workspace',
  index: 0,
})

const createMockDisposable = (): vscode.Disposable => ({
  dispose: vi.fn(),
})

// Mock VS Code API
const mockCommands = {
  registerCommand: vi.fn().mockReturnValue(createMockDisposable()),
}

const mockWindow = {
  showErrorMessage: vi.fn(),
  showInformationMessage: vi.fn(),
  createQuickPick: vi.fn(),
}

const mockWorkspace = {
  workspaceFolders: [] as vscode.WorkspaceFolder[] | undefined,
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

describe('Extension', () => {
  let mockContext: vscode.ExtensionContext

  beforeEach(() => {
    vi.clearAllMocks()
    mockContext = createMockExtensionContext()
    mockWorkspace.workspaceFolders = undefined
  })

  const getCommandHandler = (): (() => Promise<void>) => {
    const registerCalls = mockCommands.registerCommand.mock.calls
    expect(registerCalls.length).toBeGreaterThan(0)
    return registerCalls[0][1]
  }

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

    test('shows script picker with discovered packages', async () => {
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

      expect(showScriptPicker).toHaveBeenCalledWith(mockPackages)
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

      expect(showScriptPicker).toHaveBeenCalledWith([])
    })

    test('shows success message when script is selected', async () => {
      const { activate } = await import('#/extension/extension.js')
      const { discoverPackages } = await import(
        '#/package-discovery/discover-packages.js'
      )
      const { showScriptPicker } = await import(
        '#/script-quick-pick/show-script-picker.js'
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

      activate(mockContext)

      const commandHandler = getCommandHandler()
      await commandHandler()

      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        'Selected: build from test-package'
      )
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
  })

  describe('deactivate', () => {
    test('exports deactivate function', async () => {
      const { deactivate } = await import('#/extension/extension.js')

      expect(deactivate).toBeDefined()
      expect(typeof deactivate).toBe('function')
    })

    test('deactivate function runs without error', async () => {
      const { deactivate } = await import('#/extension/extension.js')

      expect(() => deactivate()).not.toThrow()
    })
  })
})
