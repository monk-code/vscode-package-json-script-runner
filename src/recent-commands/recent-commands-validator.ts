import type { RecentCommand } from '#/types/recent-command.js'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'

type PackageJson = {
  scripts?: Record<string, string>
}

export const validateRecentCommands = async (
  commands: RecentCommand[],
  workspaceRoot: string
): Promise<RecentCommand[]> => {
  if (commands.length === 0) {
    return []
  }

  const validationPromises = commands.map((command) =>
    validateSingleCommand(command, workspaceRoot)
  )

  const results = await Promise.all(validationPromises)
  return results.filter(isValidCommand)
}

const validateSingleCommand = async (
  command: RecentCommand,
  workspaceRoot: string
): Promise<RecentCommand | null> => {
  const packageJson = await readPackageJson(command.packagePath, workspaceRoot)

  if (!packageJson) {
    return null
  }

  const currentScript = getScriptCommand(packageJson, command.scriptName)

  if (!currentScript) {
    return null
  }

  return currentScript === command.scriptCommand
    ? command
    : { ...command, scriptCommand: currentScript }
}

const readPackageJson = async (
  packagePath: string,
  workspaceRoot: string
): Promise<PackageJson | null> => {
  try {
    const packageJsonPath = path.join(
      workspaceRoot,
      packagePath,
      'package.json'
    )
    const content = await fs.readFile(packageJsonPath, 'utf-8')
    return JSON.parse(content) as PackageJson
  } catch {
    return null
  }
}

const getScriptCommand = (
  packageJson: PackageJson,
  scriptName: string
): string | null => {
  return packageJson.scripts?.[scriptName] ?? null
}

const isValidCommand = (
  result: RecentCommand | null
): result is RecentCommand => {
  return result !== null
}
