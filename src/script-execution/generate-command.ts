import { relative, resolve } from 'node:path'

import type { PackageManager } from '#/package-manager/package-manager-types.js'
import type { SelectedScript } from '#/types/selected-script.js'

const isDirectoryMatch = (
  packagePath: string,
  currentPath: string
): boolean => {
  return resolve(packagePath) === resolve(currentPath)
}

const getRelativePackagePath = (
  packagePath: string,
  workspacePath: string
): string => {
  const relativePath = relative(workspacePath, packagePath)
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`
}

const getPackageIdentifier = (
  script: SelectedScript,
  workspacePath: string
): string => {
  if (script.packageName) {
    return script.packageName
  }
  return getRelativePackagePath(script.packagePath, workspacePath)
}

const generateDirectCommand = (
  packageManager: PackageManager,
  scriptName: string
): string => {
  switch (packageManager) {
    case 'pnpm':
    case 'yarn':
      return `${packageManager} ${scriptName}`
    case 'npm':
      return `npm run ${scriptName}`
  }
}

const generateWorkspaceCommand = (
  packageManager: PackageManager,
  packageIdentifier: string,
  scriptName: string
): string => {
  switch (packageManager) {
    case 'pnpm':
      return `pnpm --filter ${packageIdentifier} ${scriptName}`
    case 'yarn':
      return `yarn workspace ${packageIdentifier} ${scriptName}`
    case 'npm':
      return `npm run ${scriptName} --workspace=${packageIdentifier}`
  }
}

export const generateCommand = async (
  script: SelectedScript,
  packageManager: PackageManager,
  currentWorkingDirectory: string
): Promise<string> => {
  const isInPackageDirectory = isDirectoryMatch(
    script.packagePath,
    currentWorkingDirectory
  )

  if (isInPackageDirectory) {
    return generateDirectCommand(packageManager, script.scriptName)
  }

  const packageIdentifier = getPackageIdentifier(
    script,
    currentWorkingDirectory
  )
  return generateWorkspaceCommand(
    packageManager,
    packageIdentifier,
    script.scriptName
  )
}
