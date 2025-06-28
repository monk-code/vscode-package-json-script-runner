import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { ExtensionContext, Memento } from 'vscode'
import { RecentCommandsManager } from '#/recent-commands/recent-commands-manager.js'
import type {
  RecentCommand,
  RecentCommandsStorage,
} from '#/types/recent-command.js'
import { validateRecentCommands } from '#/recent-commands/recent-commands-validator.js'

vi.mock('#/recent-commands/recent-commands-validator.js')

describe('RecentCommandsManager', () => {
  let mockContext: ExtensionContext
  let mockWorkspaceState: Memento
  let manager: RecentCommandsManager

  beforeEach(() => {
    mockWorkspaceState = {
      get: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
      keys: vi.fn().mockReturnValue([]),
    }

    mockContext = {
      workspaceState: mockWorkspaceState,
    } as unknown as ExtensionContext

    manager = new RecentCommandsManager(mockContext)

    vi.mocked(validateRecentCommands).mockImplementation(
      async (commands) => commands
    )
  })

  describe('initialization and migration', () => {
    it('should initialize with empty commands when no data exists', async () => {
      mockWorkspaceState.get = vi.fn().mockReturnValue(undefined)

      const commands = await manager.getRecentCommands()

      expect(commands).toEqual([])
      expect(mockWorkspaceState.get).toHaveBeenCalledWith(
        'vscodePackageJsonScriptRunner.recentCommands'
      )
    })

    it('should migrate unversioned data to current version', async () => {
      const oldData: RecentCommand[] = [
        {
          scriptName: 'test',
          packageName: 'app',
          packagePath: './packages/app',
          scriptCommand: 'npm test',
          timestamp: Date.now(),
        },
      ]

      mockWorkspaceState.get = vi.fn().mockReturnValue(oldData)

      const commands = await manager.getRecentCommands()

      expect(commands).toEqual(oldData)
      expect(mockWorkspaceState.update).toHaveBeenCalledWith(
        'vscodePackageJsonScriptRunner.recentCommands',
        expect.objectContaining({
          version: 1,
          commands: oldData,
        })
      )
    })

    it('should handle versioned data without migration', async () => {
      const currentData: RecentCommandsStorage = {
        version: 1,
        commands: [
          {
            scriptName: 'build',
            packageName: 'ui',
            packagePath: './packages/ui',
            scriptCommand: 'npm run build',
            timestamp: Date.now(),
          },
        ],
      }

      mockWorkspaceState.get = vi.fn().mockReturnValue(currentData)

      const commands = await manager.getRecentCommands()

      expect(commands).toEqual(currentData.commands)
      expect(mockWorkspaceState.update).not.toHaveBeenCalled()
    })
  })

  describe('storing commands', () => {
    it('should store a new command', async () => {
      const command: RecentCommand = {
        scriptName: 'test',
        packageName: 'core',
        packagePath: './packages/core',
        scriptCommand: 'npm test',
        timestamp: Date.now(),
      }

      await manager.addRecentCommand(command)

      expect(mockWorkspaceState.update).toHaveBeenCalledWith(
        'vscodePackageJsonScriptRunner.recentCommands',
        expect.objectContaining({
          version: 1,
          commands: [command],
        })
      )
    })

    it('should deduplicate commands by packageName + scriptName', async () => {
      const existingCommand: RecentCommand = {
        scriptName: 'test',
        packageName: 'app',
        packagePath: './packages/app',
        scriptCommand: 'npm test',
        timestamp: 1000,
      }

      const storage: RecentCommandsStorage = {
        version: 1,
        commands: [existingCommand],
      }

      mockWorkspaceState.get = vi.fn().mockReturnValue(storage)

      const newCommand: RecentCommand = {
        ...existingCommand,
        timestamp: 2000,
        scriptCommand: 'npm test -- --watch',
      }

      await manager.addRecentCommand(newCommand)

      expect(mockWorkspaceState.update).toHaveBeenCalledWith(
        'vscodePackageJsonScriptRunner.recentCommands',
        expect.objectContaining({
          version: 1,
          commands: [newCommand],
        })
      )
    })

    it('should maintain order with most recent first', async () => {
      const command1: RecentCommand = {
        scriptName: 'test',
        packageName: 'app',
        packagePath: './packages/app',
        scriptCommand: 'npm test',
        timestamp: 1000,
      }

      const command2: RecentCommand = {
        scriptName: 'build',
        packageName: 'ui',
        packagePath: './packages/ui',
        scriptCommand: 'npm run build',
        timestamp: 2000,
      }

      // Simulate the state after first command
      mockWorkspaceState.get = vi
        .fn()
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce({ version: 1, commands: [command1] })

      await manager.addRecentCommand(command1)
      await manager.addRecentCommand(command2)

      const lastUpdate = vi.mocked(mockWorkspaceState.update).mock.lastCall
      expect(lastUpdate?.[1]).toEqual({
        version: 1,
        commands: [command2, command1],
      })
    })

    it('should respect maximum items limit', async () => {
      const commands: RecentCommand[] = Array.from({ length: 20 }, (_, i) => ({
        scriptName: `script${i}`,
        packageName: `package${i}`,
        packagePath: `./packages/package${i}`,
        scriptCommand: `npm run script${i}`,
        timestamp: i,
      }))

      // Simulate accumulating state
      let currentStorage: RecentCommandsStorage = { version: 1, commands: [] }

      mockWorkspaceState.get = vi.fn(() => currentStorage)
      mockWorkspaceState.update = vi.fn().mockImplementation((_key, value) => {
        currentStorage = value as RecentCommandsStorage
        return Promise.resolve()
      })

      for (const command of commands) {
        await manager.addRecentCommand(command)
      }

      expect(currentStorage.commands).toHaveLength(15)
      expect(currentStorage.commands[0]).toEqual(commands[19])
      expect(currentStorage.commands[14]).toEqual(commands[5])
    })
  })

  describe('multi-root workspace support', () => {
    it('should store workspace folder information when provided', async () => {
      const command: RecentCommand = {
        scriptName: 'test',
        packageName: 'app',
        packagePath: './packages/app',
        scriptCommand: 'npm test',
        timestamp: Date.now(),
        workspaceFolder: 'frontend',
      }

      await manager.addRecentCommand(command)

      expect(mockWorkspaceState.update).toHaveBeenCalledWith(
        'vscodePackageJsonScriptRunner.recentCommands',
        expect.objectContaining({
          version: 1,
          commands: [command],
        })
      )
    })
  })

  describe('clearing commands', () => {
    it('should clear all recent commands', async () => {
      const storage: RecentCommandsStorage = {
        version: 1,
        commands: [
          {
            scriptName: 'test',
            packageName: 'app',
            packagePath: './packages/app',
            scriptCommand: 'npm test',
            timestamp: Date.now(),
          },
        ],
      }

      mockWorkspaceState.get = vi.fn().mockReturnValue(storage)

      await manager.clearRecentCommands()

      expect(mockWorkspaceState.update).toHaveBeenCalledWith(
        'vscodePackageJsonScriptRunner.recentCommands',
        {
          version: 1,
          commands: [],
        }
      )
    })
  })

  describe('validation integration', () => {
    it('should validate commands when retrieving with workspace root', async () => {
      const commands: RecentCommand[] = [
        {
          scriptName: 'test',
          packageName: 'app',
          packagePath: './packages/app',
          scriptCommand: 'npm test',
          timestamp: Date.now(),
        },
      ]

      const storage: RecentCommandsStorage = {
        version: 1,
        commands,
      }

      mockWorkspaceState.get = vi.fn().mockReturnValue(storage)

      const validatedCommands = [
        {
          ...commands[0],
          scriptCommand: 'npm test -- --coverage',
        },
      ]

      vi.mocked(validateRecentCommands).mockResolvedValueOnce(validatedCommands)

      const result = await manager.getValidatedRecentCommands('/workspace')

      expect(validateRecentCommands).toHaveBeenCalledWith(
        commands,
        '/workspace'
      )
      expect(result).toEqual(validatedCommands)
    })

    it('should save validated commands back to storage if changed', async () => {
      const commands: RecentCommand[] = [
        {
          scriptName: 'test',
          packageName: 'app',
          packagePath: './packages/app',
          scriptCommand: 'npm test',
          timestamp: Date.now(),
        },
      ]

      const storage: RecentCommandsStorage = {
        version: 1,
        commands,
      }

      mockWorkspaceState.get = vi.fn().mockReturnValue(storage)

      const validatedCommands = [
        {
          ...commands[0],
          scriptCommand: 'npm test -- --coverage',
        },
      ]

      vi.mocked(validateRecentCommands).mockResolvedValueOnce(validatedCommands)

      await manager.getValidatedRecentCommands('/workspace')

      expect(mockWorkspaceState.update).toHaveBeenCalledWith(
        'vscodePackageJsonScriptRunner.recentCommands',
        {
          version: 1,
          commands: validatedCommands,
        }
      )
    })
  })
})
