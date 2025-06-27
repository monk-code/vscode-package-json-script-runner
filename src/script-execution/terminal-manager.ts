import * as vscode from 'vscode'

const MAX_TERMINAL_NAME_LENGTH = 80

const truncateTerminalName = (name: string): string => {
  if (name.length <= MAX_TERMINAL_NAME_LENGTH) {
    return name
  }
  return `${name.slice(0, MAX_TERMINAL_NAME_LENGTH - 3)}...`
}

const generateTerminalName = (
  command: string,
  packageName?: string
): string => {
  if (packageName?.trim()) {
    return truncateTerminalName(`Script: ${packageName}`)
  }
  return truncateTerminalName(`Script: ${command}`)
}

export const createAndExecuteInTerminal = async (
  command: string,
  packageName: string | undefined,
  workingDirectory: string
): Promise<void> => {
  const terminalName = generateTerminalName(command, packageName)

  const terminal = vscode.window.createTerminal({
    name: terminalName,
    cwd: workingDirectory,
  })

  terminal.sendText(command)
  terminal.show()
}
