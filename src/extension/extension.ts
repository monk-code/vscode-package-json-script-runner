import * as vscode from 'vscode'
import * as path from 'node:path'
import { discoverPackages } from '#/package-discovery/discover-packages.js'
import { RecentCommandsManager } from '#/recent-commands/recent-commands-manager.js'
import { executeScript } from '#/script-execution/execute-script.js'
import { disposeTerminalManager } from '#/script-execution/terminal-manager.js'
import { showScriptPicker } from '#/script-quick-pick/show-script-picker.js'
import type { PackageInfo } from '#/types/package-info.js'
import type { SelectedScript } from '#/types/selected-script.js'
import { formatUserError } from '#/utils/error-handling.js'

const RUN_SCRIPT_COMMAND = 'vscode-package-json-script-runner.runScript'
const RUN_LAST_SCRIPT_COMMAND =
  'vscode-package-json-script-runner.runLastScript'

const getWorkspacePath = (): string | undefined => {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage('No workspace folder found')
    return undefined
  }
  return workspaceFolders[0].uri.fsPath
}

export const activate = (context: vscode.ExtensionContext): void => {
  let isExecuting = false
  const recentCommandsManager = new RecentCommandsManager(context)

  const runScriptDisposable = vscode.commands.registerCommand(
    RUN_SCRIPT_COMMAND,
    async () => {
      if (isExecuting) {
        vscode.window.showInformationMessage(
          'A script is already running. Please wait for it to complete.'
        )
        return
      }

      const workspacePath = getWorkspacePath()
      if (!workspacePath) {
        return
      }

      isExecuting = true

      try {
        let packages: readonly PackageInfo[]
        try {
          packages = await discoverPackages(workspacePath)
        } catch (error) {
          vscode.window.showErrorMessage(
            formatUserError(error, 'discovering packages')
          )
          return
        }

        let selectedScript: SelectedScript | undefined
        try {
          selectedScript = await showScriptPicker(
            packages,
            workspacePath,
            recentCommandsManager
          )
        } catch (error) {
          vscode.window.showErrorMessage(
            formatUserError(error, 'selecting script')
          )
          return
        }

        if (selectedScript) {
          try {
            await executeScript(
              selectedScript,
              workspacePath,
              recentCommandsManager,
              workspacePath
            )
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

  const runLastScriptDisposable = vscode.commands.registerCommand(
    RUN_LAST_SCRIPT_COMMAND,
    async () => {
      const workspacePath = getWorkspacePath()
      if (!workspacePath) {
        return
      }

      try {
        const recentCommands =
          await recentCommandsManager.getValidatedRecentCommands(workspacePath)

        if (recentCommands.length === 0) {
          vscode.window.showInformationMessage('No recent commands found')
          return
        }

        const lastCommand = recentCommands[0]
        const selectedScript: SelectedScript = {
          packageName: lastCommand.packageName,
          packagePath: path.join(workspacePath, lastCommand.packagePath),
          scriptName: lastCommand.scriptName,
          scriptCommand: lastCommand.scriptCommand,
        }

        vscode.window.showInformationMessage(
          `Running: ${lastCommand.scriptName} (${lastCommand.packageName})`
        )

        await executeScript(
          selectedScript,
          workspacePath,
          recentCommandsManager,
          workspacePath
        )
      } catch (error) {
        vscode.window.showErrorMessage(
          formatUserError(error, 'running last script')
        )
      }
    }
  )

  context.subscriptions.push(runScriptDisposable)
  context.subscriptions.push(runLastScriptDisposable)
}

export const deactivate = (): void => {
  disposeTerminalManager()
}
