import * as vscode from 'vscode'
import { discoverPackages } from '#/package-discovery/discover-packages.js'
import { showScriptPicker } from '#/script-quick-pick/show-script-picker.js'
import { formatUserError } from '#/utils/error-handling.js'

export const activate = (context: vscode.ExtensionContext): void => {
  const disposable = vscode.commands.registerCommand(
    'vscode-package-json-script-runner.runScript',
    async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder found')
        return
      }

      try {
        const packages = await discoverPackages(workspaceFolders[0].uri.fsPath)
        const selectedScript = await showScriptPicker(packages)

        if (selectedScript) {
          vscode.window.showInformationMessage(
            `Selected: ${selectedScript.scriptName} from ${selectedScript.packageName}`
          )
          // TODO: Execute the script in the next phase
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          formatUserError(error, 'discovering packages')
        )
      }
    }
  )

  context.subscriptions.push(disposable)
}

export const deactivate = (): void => {
  // Extension cleanup if needed
}
