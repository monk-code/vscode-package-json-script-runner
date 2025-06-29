import * as vscode from 'vscode'

export class TerminalPool {
  private terminals = new Map<string, vscode.Terminal>()
  private disposable: vscode.Disposable | undefined

  constructor() {
    this.disposable = vscode.window.onDidCloseTerminal(
      this.handleTerminalClosed
    )
  }

  getOrCreateTerminal(
    key: string,
    name: string,
    options: { cwd?: string },
    clearBeforeReuse = false
  ): vscode.Terminal {
    const existingTerminal = this.terminals.get(key)

    if (existingTerminal) {
      if (clearBeforeReuse) {
        existingTerminal.sendText('clear')
      }
      existingTerminal.show()
      return existingTerminal
    }

    const terminal = vscode.window.createTerminal({
      name,
      cwd: options.cwd,
    })

    this.terminals.set(key, terminal)
    terminal.show()
    return terminal
  }

  clear(): void {
    this.terminals.forEach((terminal) => terminal.dispose())
    this.terminals.clear()
  }

  dispose(): void {
    this.clear()
    this.disposable?.dispose()
  }

  private handleTerminalClosed = (terminal: vscode.Terminal): void => {
    try {
      for (const [key, t] of this.terminals.entries()) {
        if (t === terminal) {
          this.terminals.delete(key)
          break
        }
      }
    } catch (error) {
      console.error('Error handling terminal closure:', error)
    }
  }
}
