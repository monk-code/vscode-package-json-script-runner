import * as vscode from 'vscode'
import { discoverPackages } from '#/package-discovery/discover-packages.js'
import { executeScript } from '#/script-execution/execute-script.js'
import { showScriptPicker } from '#/script-quick-pick/show-script-picker.js'
import type { PackageInfo } from '#/types/package-info.js'
import type { SelectedScript } from '#/types/selected-script.js'
import { formatUserError } from '#/utils/error-handling.js'

export const activate = (context: vscode.ExtensionContext): void => {
  let isExecuting = false

  const disposable = vscode.commands.registerCommand(
    'vscode-package-json-script-runner.runScript',
    async () => {
      // Prevent concurrent executions
      if (isExecuting) {
        vscode.window.showInformationMessage(
          'A script is already running. Please wait for it to complete.'
        )
        return
      }

      const workspaceFolders = vscode.workspace.workspaceFolders
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder found')
        return
      }

      isExecuting = true

      try {
        let packages: readonly PackageInfo[]
        try {
          packages = await discoverPackages(workspaceFolders[0].uri.fsPath)
        } catch (error) {
          vscode.window.showErrorMessage(
            formatUserError(error, 'discovering packages')
          )
          return
        }

        let selectedScript: SelectedScript | undefined
        try {
          selectedScript = await showScriptPicker(packages)
        } catch (error) {
          vscode.window.showErrorMessage(
            formatUserError(error, 'selecting script')
          )
          return
        }

        if (selectedScript) {
          try {
            await executeScript(selectedScript, workspaceFolders[0].uri.fsPath)
          } catch (error) {
            vscode.window.showErrorMessage(
              formatUserError(error, 'executing script')
            )
          }
        }
      } finally {
        isExecuting = false
      }
    }
  )

  context.subscriptions.push(disposable)
}

export const deactivate = (): void => {
  // Extension cleanup if needed
}
