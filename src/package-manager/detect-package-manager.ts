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

export const detectPackageManager = async (
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
