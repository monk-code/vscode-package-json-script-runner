import type { QuickPickItem } from 'vscode'

export type ScriptQuickPickItem = QuickPickItem & {
  packageName: string
  packagePath: string
  scriptName: string
  scriptCommand: string
}
