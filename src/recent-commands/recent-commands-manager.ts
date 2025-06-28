import type { ExtensionContext } from 'vscode'
import type {
  RecentCommand,
  RecentCommandsStorage,
} from '#/types/recent-command.js'
import { validateRecentCommands } from '#/recent-commands/recent-commands-validator.js'

export const STORAGE_KEY = 'vscodePackageJsonScriptRunner.recentCommands'
export const MAX_ITEMS = 15
export const CURRENT_VERSION = 1

export class RecentCommandsManager {
  constructor(private readonly context: ExtensionContext) {}

  async getRecentCommands(): Promise<RecentCommand[]> {
    const storage = await this.getStorageData()
    return storage.commands
  }

  async addRecentCommand(command: RecentCommand): Promise<void> {
    const storage = await this.getStorageData()
    const dedupedCommands = this.deduplicateCommands(storage.commands, command)
    const newCommands = [command, ...dedupedCommands].slice(0, MAX_ITEMS)

    await this.updateStorage({
      version: CURRENT_VERSION,
      commands: newCommands,
    })
  }

  async clearRecentCommands(): Promise<void> {
    await this.updateStorage({ version: CURRENT_VERSION, commands: [] })
  }

  async getValidatedRecentCommands(
    workspaceRoot: string
  ): Promise<RecentCommand[]> {
    const storage = await this.getStorageData()
    const validatedCommands = await validateRecentCommands(
      storage.commands,
      workspaceRoot
    )

    const hasChanges = this.hasCommandsChanged(
      storage.commands,
      validatedCommands
    )

    if (hasChanges) {
      await this.updateStorage({
        version: CURRENT_VERSION,
        commands: validatedCommands,
      })
    }

    return validatedCommands
  }

  private async getStorageData(): Promise<RecentCommandsStorage> {
    const stored = this.context.workspaceState.get<
      RecentCommandsStorage | RecentCommand[]
    >(STORAGE_KEY)

    if (!stored) {
      return this.createEmptyStorage()
    }

    if (Array.isArray(stored)) {
      const migrated = this.migrateFromUnversioned(stored)
      await this.updateStorage(migrated)
      return migrated
    }

    return stored
  }

  private deduplicateCommands(
    commands: RecentCommand[],
    newCommand: RecentCommand
  ): RecentCommand[] {
    const newKey = this.getDeduplicationKey(newCommand)
    return commands.filter((cmd) => this.getDeduplicationKey(cmd) !== newKey)
  }

  private getDeduplicationKey(command: RecentCommand): string {
    return `${command.packageName}+${command.scriptName}`
  }

  private migrateFromUnversioned(
    commands: RecentCommand[]
  ): RecentCommandsStorage {
    return { version: CURRENT_VERSION, commands }
  }

  private createEmptyStorage(): RecentCommandsStorage {
    return { version: CURRENT_VERSION, commands: [] }
  }

  private async updateStorage(storage: RecentCommandsStorage): Promise<void> {
    await this.context.workspaceState.update(STORAGE_KEY, storage)
  }

  private hasCommandsChanged(
    original: RecentCommand[],
    validated: RecentCommand[]
  ): boolean {
    if (original.length !== validated.length) {
      return true
    }

    return original.some((cmd, index) => {
      const validatedCmd = validated[index]
      return (
        cmd.scriptCommand !== validatedCmd.scriptCommand ||
        cmd.scriptName !== validatedCmd.scriptName ||
        cmd.packageName !== validatedCmd.packageName
      )
    })
  }
}
