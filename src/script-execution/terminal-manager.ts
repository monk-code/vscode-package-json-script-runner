import { TerminalPoolManager } from '../terminal/terminal-pool-manager.js'

let poolManager: TerminalPoolManager | undefined

const getPoolManager = (): TerminalPoolManager => {
  if (!poolManager) {
    poolManager = new TerminalPoolManager()
  }
  return poolManager
}

export const createAndExecuteInTerminal = async (
  command: string,
  packageName: string | undefined,
  workingDirectory: string
): Promise<void> => {
  const manager = getPoolManager()
  const terminal = manager.getOrCreateTerminal(
    command,
    packageName || '',
    workingDirectory
  )

  terminal.sendText(command)
  terminal.show()
}

export const disposeTerminalManager = (): void => {
  poolManager?.dispose()
  poolManager = undefined
}
