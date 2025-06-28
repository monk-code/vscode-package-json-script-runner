import { vi } from 'vitest'
import type * as vscode from 'vscode'

/**
 * Creates a properly typed mock ExtensionContext without type assertions
 */
export const createMockExtensionContext = (): vscode.ExtensionContext => {
  const context: vscode.ExtensionContext = {
    subscriptions: [],
    workspaceState: createMockMemento(),
    globalState: createMockGlobalState(),
    secrets: createMockSecretStorage(),
    extensionUri: createMockUri(''),
    extensionPath: '',
    asAbsolutePath: vi.fn(
      (relativePath: string) => `/mock/path/${relativePath}`
    ),
    environmentVariableCollection: createMockEnvironmentVariableCollection(),
    storagePath: undefined,
    globalStoragePath: '',
    logPath: '',
    extensionMode: 1, // ExtensionMode.Production
    extension: createMockExtension(),
    logUri: createMockUri(''),
    storageUri: undefined,
    globalStorageUri: createMockUri(''),
    languageModelAccessInformation: createMockLanguageModelAccessInformation(),
  }

  return context
}

/**
 * Creates a properly typed mock WorkspaceFolder without type assertions
 */
export const createMockWorkspaceFolder = (
  path: string,
  name = 'test-workspace',
  index = 0
): vscode.WorkspaceFolder => {
  const folder: vscode.WorkspaceFolder = {
    uri: createMockUri(path),
    name,
    index,
  }

  return folder
}

/**
 * Creates a properly typed mock Disposable without type assertions
 */
export const createMockDisposable = (): vscode.Disposable => {
  const disposable: vscode.Disposable = {
    dispose: vi.fn(),
  }

  return disposable
}

/**
 * Creates a properly typed mock Uri without type assertions
 */
export const createMockUri = (fsPath: string): vscode.Uri => {
  const uri: vscode.Uri = {
    scheme: 'file',
    authority: '',
    path: fsPath,
    query: '',
    fragment: '',
    fsPath,
    with: vi.fn(),
    toString: vi.fn(() => `file://${fsPath}`),
    toJSON: vi.fn(() => ({ $mid: 1, scheme: 'file', path: fsPath })),
  }

  return uri
}

/**
 * Creates a properly typed mock QuickPickItem without type assertions
 */
export const createMockQuickPickItem = (
  props: Partial<vscode.QuickPickItem> & { label: string }
): vscode.QuickPickItem => {
  const item: vscode.QuickPickItem = {
    label: props.label,
    kind: props.kind,
    iconPath: props.iconPath,
    description: props.description,
    detail: props.detail,
    picked: props.picked,
    alwaysShow: props.alwaysShow,
    buttons: props.buttons,
  }

  return item
}

/**
 * Creates a properly typed mock Terminal without type assertions
 */
export const createMockTerminal = (name: string): vscode.Terminal => {
  const terminal: vscode.Terminal = {
    name,
    processId: Promise.resolve(undefined),
    creationOptions: {},
    exitStatus: undefined,
    state: { isInteractedWith: false, shell: undefined },
    shellIntegration: undefined,
    sendText: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn(),
  }

  return terminal
}

/**
 * Creates a properly typed mock QuickPick without type assertions
 */
export const createMockQuickPick = <
  T extends vscode.QuickPickItem,
>(): vscode.QuickPick<T> => {
  const items: T[] = []
  const selectedItems: readonly T[] = []
  const activeItems: readonly T[] = []

  const quickPick: vscode.QuickPick<T> = {
    items,
    canSelectMany: false,
    matchOnDescription: false,
    matchOnDetail: false,
    keepScrollPosition: false,
    activeItems,
    selectedItems,
    value: '',
    placeholder: undefined,
    title: undefined,
    step: undefined,
    totalSteps: undefined,
    enabled: true,
    busy: false,
    ignoreFocusOut: false,
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn(),
    onDidChangeValue: createMockEvent(),
    onDidAccept: createMockEvent(),
    onDidChangeActive: createMockEvent(),
    onDidChangeSelection: createMockEvent(),
    onDidHide: createMockEvent(),
    onDidTriggerButton: createMockEvent(),
    onDidTriggerItemButton: createMockEvent(),
    buttons: [],
  }

  return quickPick
}

// Helper functions for nested mock objects

const createMockMemento = (): vscode.Memento => ({
  keys: vi.fn(() => []),
  get: vi.fn((_key: string, defaultValue?: unknown) => defaultValue),
  update: vi.fn(() => Promise.resolve()),
})

const createMockGlobalState = (): vscode.Memento & {
  setKeysForSync(keys: readonly string[]): void
} => ({
  ...createMockMemento(),
  setKeysForSync: vi.fn(),
})

const createMockSecretStorage = (): vscode.SecretStorage => ({
  get: vi.fn(() => Promise.resolve(undefined)),
  store: vi.fn(() => Promise.resolve()),
  delete: vi.fn(() => Promise.resolve()),
  onDidChange: createMockEvent(),
})

const createMockEnvironmentVariableCollection =
  (): vscode.GlobalEnvironmentVariableCollection => ({
    getScoped: vi.fn(),
    persistent: true,
    description: undefined,
    replace: vi.fn(),
    append: vi.fn(),
    prepend: vi.fn(),
    get: vi.fn(),
    forEach: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    [Symbol.iterator]: vi.fn(),
  })

const createMockExtension = <T = unknown>(): vscode.Extension<T> => {
  // Type assertion is necessary here for mocking purposes.
  // We need to satisfy the generic type T which could be any type,
  // but in tests we often don't care about the actual exports value.
  const mockExports = undefined as unknown as T

  return {
    id: 'mock-extension',
    extensionUri: createMockUri(''),
    extensionPath: '',
    isActive: true,
    packageJSON: {},
    exports: mockExports,
    activate: vi.fn(() => Promise.resolve(mockExports)),
    extensionKind: 1, // ExtensionKind.UI
  }
}

const createMockLanguageModelAccessInformation =
  (): vscode.LanguageModelAccessInformation => ({
    onDidChange: createMockEvent(),
    canSendRequest: vi.fn(() => undefined),
  })

const createMockEvent = <T = unknown>(): vscode.Event<T> => {
  const listeners: Array<(value: T) => void> = []
  const event: vscode.Event<T> & { fire?: (value: T) => void } = vi.fn(
    (listener: (value: T) => void) => {
      listeners.push(listener)
      return createMockDisposable()
    }
  )
  Object.defineProperty(event, Symbol.for('vscode.Event'), { value: true })
  event.fire = (value: T) => listeners.forEach((listener) => listener(value))
  return event
}

/**
 * Creates a mock event that can be manually triggered
 */
export const createMockEventEmitter = <T = unknown>(): {
  event: vscode.Event<T>
  fire: (value: T) => void
} => {
  const listeners: Array<(value: T) => void> = []
  const event: vscode.Event<T> = vi.fn((listener: (value: T) => void) => {
    listeners.push(listener)
    return createMockDisposable()
  })
  Object.defineProperty(event, Symbol.for('vscode.Event'), { value: true })

  return {
    event,
    fire: (value: T) => listeners.forEach((listener) => listener(value)),
  }
}
