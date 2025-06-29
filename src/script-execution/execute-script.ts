import { detectPackageManager } from '#/package-manager/detect-package-manager.js'
import { generateCommand } from '#/script-execution/generate-command.js'
import { createAndExecuteInTerminal } from '#/script-execution/terminal-manager.js'
import type { SelectedScript } from '#/types/selected-script.js'
import { formatUserError } from '#/utils/error-handling.js'
import type { RecentCommandsManager } from '#/recent-commands/recent-commands-manager.js'
import type { RecentCommand } from '#/types/recent-command.js'

export const executeScript = async (
  script: SelectedScript,
  workspacePath: string,
  recentCommandsManager?: RecentCommandsManager,
  workspaceFolder?: string
): Promise<void> => {
  let packageManager: Awaited<ReturnType<typeof detectPackageManager>>
  let command: string

  try {
    packageManager = await detectPackageManager(workspacePath)
  } catch (error) {
    const formattedError = formatUserError(error, 'detecting package manager')
    throw new Error(formattedError)
  }

  try {
    command = await generateCommand(script, packageManager, workspacePath)
  } catch (error) {
    const formattedError = formatUserError(error, 'generating command')
    throw new Error(formattedError)
  }

  try {
    await createAndExecuteInTerminal(
      command,
      script.packageName,
      script.packagePath
    )
  } catch (error) {
    const formattedError = formatUserError(error, 'executing script')
    throw new Error(formattedError)
  }

  if (recentCommandsManager) {
    const recentCommand = createRecentCommand(script, workspaceFolder)
    saveRecentCommandAsync(recentCommandsManager, recentCommand)
  }
}

const createRecentCommand = (
  script: SelectedScript,
  workspaceFolder?: string
): RecentCommand => ({
  scriptName: script.scriptName,
  packageName: script.packageName,
  packagePath: script.packagePath,
  scriptCommand: script.scriptCommand,
  timestamp: Date.now(),
  ...(workspaceFolder && { workspaceFolder }),
})

const saveRecentCommandAsync = (
  manager: RecentCommandsManager,
  command: RecentCommand
): void => {
  manager.addRecentCommand(command).catch(() => {})
}
