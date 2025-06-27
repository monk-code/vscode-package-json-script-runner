import type { ScriptQuickPickItem } from '#/types/script-quick-pick-item.js'
import {
  createMockQuickPick,
  createMockEventEmitter,
} from '#/__tests__/test-utils/vscode-mocks.js'

/**
 * Creates a test-friendly mock QuickPick with controllable events
 */
export const createTestQuickPick = () => {
  // Create controllable event emitters
  const onDidAcceptEmitter = createMockEventEmitter<void>()
  const onDidHideEmitter = createMockEventEmitter<void>()
  const onDidChangeValueEmitter = createMockEventEmitter<string>()

  // Create the mock quick pick with our controllable events
  const mockQuickPick = createMockQuickPick<ScriptQuickPickItem>()

  // Override the event properties using Object.defineProperty
  Object.defineProperty(mockQuickPick, 'onDidAccept', {
    value: onDidAcceptEmitter.event,
    writable: false,
    configurable: true,
  })
  Object.defineProperty(mockQuickPick, 'onDidHide', {
    value: onDidHideEmitter.event,
    writable: false,
    configurable: true,
  })
  Object.defineProperty(mockQuickPick, 'onDidChangeValue', {
    value: onDidChangeValueEmitter.event,
    writable: false,
    configurable: true,
  })

  return {
    quickPick: mockQuickPick,
    // Expose methods to trigger events in tests
    triggerAccept: () => onDidAcceptEmitter.fire(undefined),
    triggerHide: () => onDidHideEmitter.fire(undefined),
    triggerValueChange: (value: string) => onDidChangeValueEmitter.fire(value),
  }
}
