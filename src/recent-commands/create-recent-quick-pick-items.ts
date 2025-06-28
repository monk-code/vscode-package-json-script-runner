import type { RecentCommand } from '#/types/recent-command.js'
import type { ScriptQuickPickItem } from '#/types/script-quick-pick-item.js'
import type { QuickPickItem } from 'vscode'

const SEPARATOR_KIND = -1

const SCRIPT_ICONS: Record<string, string> = {
  test: '$(beaker)',
  build: '$(package)',
  dev: '$(play)',
  start: '$(play)',
  lint: '$(check)',
  format: '$(check)',
  deploy: '$(cloud-upload)',
  serve: '$(server)',
  watch: '$(eye)',
}

const DEFAULT_ICON = '$(terminal)'

export const createRecentQuickPickItems = (
  commands: RecentCommand[]
): Array<ScriptQuickPickItem | QuickPickItem> => {
  if (commands.length === 0) {
    return []
  }

  const recentItems = commands.map(commandToQuickPickItem)
  const separator = createSeparator()

  return [...recentItems, separator]
}

const commandToQuickPickItem = (
  command: RecentCommand
): ScriptQuickPickItem => {
  const timeAgo = formatTimeAgo(command.timestamp)

  return {
    label: formatLabel(command.scriptName),
    description: timeAgo,
    detail: formatDetail(command),
    scriptName: command.scriptName,
    scriptCommand: command.scriptCommand,
    packageName: command.packageName,
    packagePath: command.packagePath,
  }
}

const formatLabel = (scriptName: string): string => {
  const icon = getIconForScript(scriptName)
  return `${icon} ${scriptName}`
}

const getIconForScript = (scriptName: string): string => {
  if (SCRIPT_ICONS[scriptName]) {
    return SCRIPT_ICONS[scriptName]
  }

  for (const [keyword, icon] of Object.entries(SCRIPT_ICONS)) {
    if (scriptName.toLowerCase().includes(keyword)) {
      return icon
    }
  }

  return DEFAULT_ICON
}

const formatDetail = (command: RecentCommand): string =>
  command.workspaceFolder
    ? `${command.packageName} (${command.workspaceFolder})`
    : command.packageName

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
  label: '',
  kind: SEPARATOR_KIND,
})
