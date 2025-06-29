import type { QuickPickItem } from 'vscode'
import * as path from 'node:path'

import type { RecentCommand } from '#/types/recent-command.js'
import type { ScriptQuickPickItem } from '#/types/script-quick-pick-item.js'

// Using hardcoded value because vscode module is mocked in tests
// This matches vscode.QuickPickItemKind.Separator
const SEPARATOR_KIND = -1

export const createRecentQuickPickItems = (
  commands: RecentCommand[],
  workspaceRoot: string
): Array<ScriptQuickPickItem | QuickPickItem> => {
  if (commands.length === 0) {
    return []
  }

  const separator = createSeparator()
  const recentItems = commands.map((cmd) =>
    commandToQuickPickItem(cmd, workspaceRoot)
  )

  return [separator, ...recentItems]
}

const commandToQuickPickItem = (
  command: RecentCommand,
  workspaceRoot: string
): ScriptQuickPickItem => {
  const timeAgo = formatTimeAgo(command.timestamp)
  const absolutePackagePath = path.join(workspaceRoot, command.packagePath)

  return {
    label: command.scriptName,
    description: timeAgo,
    detail: formatDetail(command),
    scriptName: command.scriptName,
    scriptCommand: command.scriptCommand,
    packageName: command.packageName,
    packagePath: absolutePackagePath,
  }
}

const formatDetail = (command: RecentCommand): string => {
  return `$(package) ${command.packageName}`
}

const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds <= 30) return 'Just now'
  if (minutes < 1) return `${seconds} seconds ago`
  if (minutes === 1) return '1 minute ago'
  if (minutes < 60) return `${minutes} minutes ago`
  if (hours === 1) return '1 hour ago'
  if (hours < 24) return `${hours} hours ago`
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

const createSeparator = (): QuickPickItem => ({
  label: 'Recent Commands',
  kind: SEPARATOR_KIND,
})
