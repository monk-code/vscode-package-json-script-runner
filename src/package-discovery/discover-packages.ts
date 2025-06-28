import { promises as fs, type Dirent } from 'node:fs'
import { join } from 'node:path'
import type { PackageInfo } from '#/types/package-info.js'

const EXCLUDED_DIRECTORIES = new Set(['node_modules'])

const shouldExcludeDirectory = (name: string): boolean =>
  EXCLUDED_DIRECTORIES.has(name)

const parsePackageJson = async (
  filePath: string
): Promise<PackageInfo | null> => {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    const packageData = JSON.parse(content)
    const packageDir = filePath.replace('/package.json', '')

    return {
      path: packageDir,
      name: packageData.name,
      scripts: packageData.scripts || {},
    }
  } catch {
    return null
  }
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
  entry: Dirent
): Promise<PackageInfo[]> => {
  const fullPath = join(dir, entry.name)

  if (entry.isDirectory() && !shouldExcludeDirectory(entry.name)) {
    return discoverPackagesInDirectory(fullPath)
  }

  if (entry.name === 'package.json') {
    const packageInfo = await parsePackageJson(fullPath)
    return packageInfo ? [packageInfo] : []
  }

  return []
}

const discoverPackagesInDirectory = async (
  dir: string
): Promise<PackageInfo[]> => {
  const entries = await getDirectoryEntries(dir)

  const packageInfoArrays = await Promise.all(
    entries.map((entry) => processEntry(dir, entry))
  )

  return packageInfoArrays.flat()
}

export const discoverPackages = async (
  workspacePath: string
): Promise<readonly PackageInfo[]> => {
  return discoverPackagesInDirectory(workspacePath)
}
