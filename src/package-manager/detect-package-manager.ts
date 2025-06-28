import { promises as fs } from 'node:fs'
import { join } from 'node:path'

import type { PackageManager } from './package-manager-types.js'

const checkFileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

const lockFileChecks: Array<{ file: string; manager: PackageManager }> = [
  { file: 'pnpm-lock.yaml', manager: 'pnpm' },
  { file: 'yarn.lock', manager: 'yarn' },
  { file: 'package-lock.json', manager: 'npm' },
]

const parsePackageManagerField = (field: string): PackageManager | null => {
  const match = field.match(/^(npm|yarn|pnpm)@/)
  return match ? (match[1] as PackageManager) : null
}

const readPackageManagerField = async (
  workspacePath: string
): Promise<PackageManager | null> => {
  try {
    const packageJsonPath = join(workspacePath, 'package.json')
    const content = await fs.readFile(packageJsonPath, 'utf-8')
    const packageData = JSON.parse(content)

    if (packageData.packageManager) {
      return parsePackageManagerField(packageData.packageManager)
    }

    return null
  } catch {
    return null
  }
}

const detectFromLockFiles = async (
  workspacePath: string
): Promise<PackageManager> => {
  for (const { file, manager } of lockFileChecks) {
    const lockFilePath = join(workspacePath, file)
    if (await checkFileExists(lockFilePath)) {
      return manager
    }
  }

  return 'npm'
}

export const detectPackageManager = async (
  workspacePath: string
): Promise<PackageManager> => {
  // First, try to detect from packageManager field
  const fieldManager = await readPackageManagerField(workspacePath)
  if (fieldManager) {
    return fieldManager
  }

  // Fall back to lock file detection
  return detectFromLockFiles(workspacePath)
}
