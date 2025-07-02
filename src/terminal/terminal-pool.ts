import * as vscode from 'vscode'

export class TerminalPool {
  private terminals = new Map<string, vscode.Terminal>()
  private busyTerminals = new Set<vscode.Terminal>()
  private disposables: vscode.Disposable[] = []

  constructor() {
    this.disposables.push(
      vscode.window.onDidCloseTerminal(this.handleTerminalClosed),
      vscode.window.onDidStartTerminalShellExecution?.(
        this.handleExecutionStart
      ) ?? { dispose: () => {} },
      vscode.window.onDidEndTerminalShellExecution?.(
        this.handleExecutionEnd
      ) ?? { dispose: () => {} }
    )
  }

  getOrCreateTerminal(
    key: string,
    name: string,
    options: { cwd?: string },
    clearBeforeReuse = false
  ): vscode.Terminal {
    const existingTerminal = this.terminals.get(key)

    if (existingTerminal && !this.isTerminalBusy(existingTerminal)) {
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

  isTerminalBusy(terminal: vscode.Terminal): boolean {
    return this.busyTerminals.has(terminal)
  }

  clear(): void {
    this.terminals.forEach((terminal) => terminal.dispose())
    this.terminals.clear()
    this.busyTerminals.clear()
  }

  dispose(): void {
    this.clear()
    this.disposables.forEach((d) => d.dispose())
    this.disposables = []
  }

  private handleTerminalClosed = (terminal: vscode.Terminal): void => {
    try {
      for (const [key, t] of this.terminals.entries()) {
        if (t === terminal) {
          this.terminals.delete(key)
          this.busyTerminals.delete(terminal)
          break
        }
      }
    } catch (error) {
      console.error('Error handling terminal closure:', error)
    }
  }

  private handleExecutionStart = (
    event: vscode.TerminalShellExecutionStartEvent
  ): void => {
    this.busyTerminals.add(event.terminal)
  }

  private handleExecutionEnd = (
    event: vscode.TerminalShellExecutionEndEvent
  ): void => {
    this.busyTerminals.delete(event.terminal)
  }
}
