import { promises as fs, type Dirent } from 'node:fs'
import { join, relative } from 'node:path'
import type { PackageInfo } from '#/types/package-info.js'

const EXCLUDED_DIRECTORIES = new Set(['node_modules'])

const shouldExcludeDirectory = (name: string): boolean =>
  EXCLUDED_DIRECTORIES.has(name)

const parsePackageJson = async (
  filePath: string,
  rootPath: string
): Promise<PackageInfo | null> => {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    const packageData = JSON.parse(content)
    const packageDir = filePath.replace('/package.json', '')
    const relativePath = relative(rootPath, packageDir)

    return {
      path: filePath,
      name: packageData.name,
      relativePath: relativePath || '.',
      scripts: packageData.scripts || {},
    }
  } catch {
    return null
  }
}

const findWorkspaceRoot = async (startPath: string): Promise<string> => {
  let currentPath = startPath

  while (currentPath !== '/') {
    try {
      const packageJsonPath = join(currentPath, 'package.json')
      const content = await fs.readFile(packageJsonPath, 'utf8')
      const packageData = JSON.parse(content)

      if (packageData.workspaces) {
        return currentPath
      }
    } catch {}

    const parentPath = join(currentPath, '..')
    if (parentPath === currentPath) {
      break
    }
    currentPath = parentPath
  }

  return startPath
}

const getDirectoryEntries = async (dir: string) => {
  try {
    return await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }
}

const processEntry = async (
  dir: string,
  entry: Dirent,
  rootPath: string
): Promise<PackageInfo[]> => {
  const fullPath = join(dir, entry.name)

  if (entry.isDirectory() && !shouldExcludeDirectory(entry.name)) {
    return discoverPackagesInDirectory(fullPath, rootPath)
  }

  if (entry.name === 'package.json') {
    const packageInfo = await parsePackageJson(fullPath, rootPath)
    return packageInfo ? [packageInfo] : []
  }

  return []
}

const discoverPackagesInDirectory = async (
  dir: string,
  rootPath: string
): Promise<PackageInfo[]> => {
  const entries = await getDirectoryEntries(dir)

  const packageInfoArrays = await Promise.all(
    entries.map((entry) => processEntry(dir, entry, rootPath))
  )

  return packageInfoArrays.flat()
}

export const discoverPackages = async (
  workspacePath: string
): Promise<readonly PackageInfo[]> => {
  const rootPath = await findWorkspaceRoot(workspacePath)
  return discoverPackagesInDirectory(workspacePath, rootPath)
}
