import { describe, it, expect, vi } from 'vitest'
import { validateRecentCommands } from '#/recent-commands/recent-commands-validator.js'
import type { RecentCommand } from '#/types/recent-command.js'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'

vi.mock('node:fs/promises')

describe('validateRecentCommands', () => {
  const workspaceRoot = '/workspace'

  it('should return empty array when no commands provided', async () => {
    const result = await validateRecentCommands([], workspaceRoot)
    expect(result).toEqual([])
  })

  it('should keep valid commands that exist in package.json', async () => {
    const commands: RecentCommand[] = [
      {
        scriptName: 'test',
        packageName: 'app',
        packagePath: './packages/app',
        scriptCommand: 'npm test',
        timestamp: Date.now(),
      },
    ]

    const packageJson = {
      name: 'app',
      scripts: {
        test: 'npm test',
      },
    }

    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(packageJson))

    const result = await validateRecentCommands(commands, workspaceRoot)

    expect(result).toEqual(commands)
    expect(fs.readFile).toHaveBeenCalledWith(
      path.join(workspaceRoot, './packages/app', 'package.json'),
      'utf-8'
    )
  })

  it('should remove commands when package.json does not exist', async () => {
    const commands: RecentCommand[] = [
      {
        scriptName: 'test',
        packageName: 'app',
        packagePath: './packages/app',
        scriptCommand: 'npm test',
        timestamp: Date.now(),
      },
    ]

    vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT'))

    const result = await validateRecentCommands(commands, workspaceRoot)

    expect(result).toEqual([])
  })

  it('should remove commands when script no longer exists in package.json', async () => {
    const commands: RecentCommand[] = [
      {
        scriptName: 'test',
        packageName: 'app',
        packagePath: './packages/app',
        scriptCommand: 'npm test',
        timestamp: Date.now(),
      },
    ]

    const packageJson = {
      name: 'app',
      scripts: {
        build: 'npm run build',
      },
    }

    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(packageJson))

    const result = await validateRecentCommands(commands, workspaceRoot)

    expect(result).toEqual([])
  })

  it('should update scriptCommand when it has changed in package.json', async () => {
    const commands: RecentCommand[] = [
      {
        scriptName: 'test',
        packageName: 'app',
        packagePath: './packages/app',
        scriptCommand: 'npm test',
        timestamp: Date.now(),
      },
    ]

    const packageJson = {
      name: 'app',
      scripts: {
        test: 'npm test -- --coverage',
      },
    }

    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(packageJson))

    const result = await validateRecentCommands(commands, workspaceRoot)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      ...commands[0],
      scriptCommand: 'npm test -- --coverage',
    })
  })

  it('should handle multiple commands with mixed validity', async () => {
    const commands: RecentCommand[] = [
      {
        scriptName: 'test',
        packageName: 'app',
        packagePath: './packages/app',
        scriptCommand: 'npm test',
        timestamp: Date.now(),
      },
      {
        scriptName: 'build',
        packageName: 'ui',
        packagePath: './packages/ui',
        scriptCommand: 'npm run build',
        timestamp: Date.now(),
      },
      {
        scriptName: 'lint',
        packageName: 'core',
        packagePath: './packages/core',
        scriptCommand: 'npm run lint',
        timestamp: Date.now(),
      },
    ]

    const appPackageJson = {
      name: 'app',
      scripts: {
        test: 'npm test',
      },
    }

    const uiPackageJson = {
      name: 'ui',
      scripts: {
        dev: 'npm run dev',
      },
    }

    vi.mocked(fs.readFile)
      .mockResolvedValueOnce(JSON.stringify(appPackageJson))
      .mockResolvedValueOnce(JSON.stringify(uiPackageJson))
      .mockRejectedValueOnce(new Error('ENOENT'))

    const result = await validateRecentCommands(commands, workspaceRoot)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(commands[0])
  })

  it('should handle workspace folders in multi-root workspaces', async () => {
    const commands: RecentCommand[] = [
      {
        scriptName: 'test',
        packageName: 'app',
        packagePath: './packages/app',
        scriptCommand: 'npm test',
        timestamp: Date.now(),
        workspaceFolder: 'frontend',
      },
    ]

    const packageJson = {
      name: 'app',
      scripts: {
        test: 'npm test',
      },
    }

    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(packageJson))

    const result = await validateRecentCommands(commands, workspaceRoot)

    expect(result).toEqual(commands)
  })
})
