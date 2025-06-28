export type RecentCommand = {
  scriptName: string
  packageName: string
  packagePath: string
  scriptCommand: string
  timestamp: number
  workspaceFolder?: string
}

export type RecentCommandsStorage = {
  version: number
  commands: RecentCommand[]
}
