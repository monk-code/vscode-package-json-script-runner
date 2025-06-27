import { detectPackageManager } from '#/package-manager/detect-package-manager.js'
import { generateCommand } from '#/script-execution/generate-command.js'
import { createAndExecuteInTerminal } from '#/script-execution/terminal-manager.js'
import type { SelectedScript } from '#/types/selected-script.js'
import { formatUserError } from '#/utils/error-handling.js'

export const executeScript = async (
  script: SelectedScript,
  workspacePath: string
): Promise<void> => {
  let packageManager: Awaited<ReturnType<typeof detectPackageManager>>
  let command: string

  try {
    // Step 1: Detect the package manager
    packageManager = await detectPackageManager(workspacePath)
  } catch (error) {
    const formattedError = formatUserError(error, 'detecting package manager')
    throw new Error(formattedError)
  }

  try {
    // Step 2: Generate the appropriate command
    command = await generateCommand(script, packageManager, workspacePath)
  } catch (error) {
    const formattedError = formatUserError(error, 'generating command')
    throw new Error(formattedError)
  }

  try {
    // Step 3: Execute the command in a terminal
    await createAndExecuteInTerminal(
      command,
      script.packageName,
      script.packagePath
    )
  } catch (error) {
    const formattedError = formatUserError(error, 'executing script')
    throw new Error(formattedError)
  }
}
