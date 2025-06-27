import { describe, test, expect, vi } from 'vitest'
import type * as vscode from 'vscode'
import {
  createMockExtensionContext,
  createMockWorkspaceFolder,
  createMockDisposable,
  createMockUri,
  createMockQuickPickItem,
  createMockTerminal,
  createMockQuickPick,
} from './vscode-mocks.js'

describe('VS Code Mock Factories', () => {
  describe('createMockExtensionContext', () => {
    test('creates a valid ExtensionContext without type assertions', () => {
      const context = createMockExtensionContext()

      expect(context.subscriptions).toEqual([])
      expect(context.extensionPath).toBe('')
      expect(context.globalStoragePath).toBe('')
      expect(context.logPath).toBe('')
      expect(context.extensionMode).toBe(1)
      expect(context.asAbsolutePath).toBeDefined()
      expect(typeof context.asAbsolutePath).toBe('function')
    })

    test('asAbsolutePath returns expected mock path', () => {
      const context = createMockExtensionContext()
      const result = context.asAbsolutePath('test.js')
      expect(result).toBe('/mock/path/test.js')
    })
  })

  describe('createMockWorkspaceFolder', () => {
    test('creates a valid WorkspaceFolder without type assertions', () => {
      const folder = createMockWorkspaceFolder('/test/path')

      expect(folder.uri.fsPath).toBe('/test/path')
      expect(folder.name).toBe('test-workspace')
      expect(folder.index).toBe(0)
    })

    test('allows custom name and index', () => {
      const folder = createMockWorkspaceFolder('/test/path', 'custom-name', 2)

      expect(folder.name).toBe('custom-name')
      expect(folder.index).toBe(2)
    })
  })

  describe('createMockDisposable', () => {
    test('creates a valid Disposable without type assertions', () => {
      const disposable = createMockDisposable()

      expect(disposable.dispose).toBeDefined()
      expect(typeof disposable.dispose).toBe('function')
    })

    test('tracks dispose calls', () => {
      const disposable = createMockDisposable()
      const disposeFn = vi.mocked(disposable.dispose)

      disposable.dispose()

      expect(disposeFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('createMockUri', () => {
    test('creates a valid Uri without type assertions', () => {
      const uri = createMockUri('/test/path')

      expect(uri.fsPath).toBe('/test/path')
      expect(uri.path).toBe('/test/path')
      expect(uri.scheme).toBe('file')
    })
  })

  describe('createMockQuickPickItem', () => {
    test('creates a valid QuickPickItem without type assertions', () => {
      const item = createMockQuickPickItem({
        label: 'Test Label',
        description: 'Test Description',
      })

      expect(item.label).toBe('Test Label')
      expect(item.description).toBe('Test Description')
    })
  })

  describe('createMockTerminal', () => {
    test('creates a valid Terminal without type assertions', () => {
      const terminal = createMockTerminal('Test Terminal')

      expect(terminal.name).toBe('Test Terminal')
      expect(terminal.processId).toBeInstanceOf(Promise)
      expect(terminal.creationOptions).toEqual({})
      expect(terminal.exitStatus).toBeUndefined()
      expect(terminal.state).toEqual({
        isInteractedWith: false,
        shell: undefined,
      })
      expect(terminal.shellIntegration).toBeUndefined()
      expect(terminal.sendText).toBeDefined()
      expect(terminal.show).toBeDefined()
      expect(terminal.hide).toBeDefined()
      expect(terminal.dispose).toBeDefined()
    })

    test('terminal methods are callable', () => {
      const terminal = createMockTerminal('Test Terminal')

      expect(() => terminal.sendText('test')).not.toThrow()
      expect(() => terminal.show()).not.toThrow()
      expect(() => terminal.hide()).not.toThrow()
      expect(() => terminal.dispose()).not.toThrow()
    })
  })

  describe('createMockQuickPick', () => {
    test('creates a valid QuickPick without type assertions', () => {
      const quickPick = createMockQuickPick<vscode.QuickPickItem>()

      expect(quickPick.items).toEqual([])
      expect(quickPick.value).toBe('')
      expect(quickPick.placeholder).toBeUndefined()
      expect(quickPick.canSelectMany).toBe(false)
      expect(quickPick.enabled).toBe(true)
      expect(quickPick.busy).toBe(false)
      expect(quickPick.show).toBeDefined()
      expect(quickPick.hide).toBeDefined()
      expect(quickPick.dispose).toBeDefined()
    })

    test('quick pick methods are callable', () => {
      const quickPick = createMockQuickPick<vscode.QuickPickItem>()

      expect(() => quickPick.show()).not.toThrow()
      expect(() => quickPick.hide()).not.toThrow()
      expect(() => quickPick.dispose()).not.toThrow()
    })

    test('can modify items array', () => {
      interface CustomItem extends vscode.QuickPickItem {
        custom: string
      }

      const quickPick = createMockQuickPick<CustomItem>()
      const item: CustomItem = { label: 'Test', custom: 'value' }

      quickPick.items = [item]

      expect(quickPick.items).toHaveLength(1)
      expect(quickPick.items[0]).toBe(item)
    })
  })
})
