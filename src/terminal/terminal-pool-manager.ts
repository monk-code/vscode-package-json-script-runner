import * as vscode from 'vscode'
import { TerminalPool } from './terminal-pool.js'
import { getTerminalConfig } from './terminal-config.js'

const MAX_TERMINAL_NAME_LENGTH = 80

export class TerminalPoolManager {
  private pool: TerminalPool

  constructor() {
    this.pool = new TerminalPool()
  }

  getOrCreateTerminal(
    scriptName: string,
    packageName: string,
    workingDirectory: string
  ): vscode.Terminal {
    const config = getTerminalConfig()
    const terminalName = this.createTerminalName(packageName, scriptName)

    if (config.terminalReuseStrategy === 'none') {
      return vscode.window.createTerminal({
        name: terminalName,
        cwd: workingDirectory,
      })
    }

    const key = this.getPoolKey(config.terminalReuseStrategy, workingDirectory)
    return this.pool.getOrCreateTerminal(
      key,
      terminalName,
      { cwd: workingDirectory },
      config.clearTerminalBeforeReuse
    )
  }

  dispose(): void {
    this.pool.dispose()
  }

  private getPoolKey(strategy: string, workingDirectory: string): string {
    switch (strategy) {
      case 'per-package':
        return workingDirectory
      case 'per-workspace':
        return 'workspace'
      case 'single':
        return 'single'
      default:
        return workingDirectory
    }
  }

  private createTerminalName(packageName: string, scriptName: string): string {
    const displayName = packageName || scriptName
    const fullName = `Script: ${displayName}`
    return fullName.length > MAX_TERMINAL_NAME_LENGTH
      ? fullName.substring(0, MAX_TERMINAL_NAME_LENGTH)
      : fullName
  }
}
