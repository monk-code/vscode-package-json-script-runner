import * as vscode from 'vscode'

export type TerminalReuseStrategy =
  | 'none'
  | 'per-package'
  | 'per-workspace'
  | 'single'

export interface TerminalConfig {
  terminalReuseStrategy: TerminalReuseStrategy
  clearTerminalBeforeReuse: boolean
  maxTerminals: number
}

const VALID_STRATEGIES: TerminalReuseStrategy[] = [
  'none',
  'per-package',
  'per-workspace',
  'single',
]

const isValidStrategy = (value: unknown): value is TerminalReuseStrategy => {
  return (
    typeof value === 'string' &&
    VALID_STRATEGIES.includes(value as TerminalReuseStrategy)
  )
}

export const getTerminalConfig = (): TerminalConfig => {
  const config = vscode.workspace.getConfiguration('packageJsonScriptRunner')

  const strategy = config.get<TerminalReuseStrategy>(
    'terminalReuseStrategy',
    'per-package'
  )
  const validStrategy = isValidStrategy(strategy) ? strategy : 'per-package'

  return {
    terminalReuseStrategy: validStrategy,
    clearTerminalBeforeReuse: config.get<boolean>(
      'clearTerminalBeforeReuse',
      true
    ),
    maxTerminals: config.get<number>('maxTerminals', 10),
  }
}
