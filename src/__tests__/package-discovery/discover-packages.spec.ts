import { discoverPackages } from '#/package-discovery/discover-packages.js'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'

const getWorkspacePath = (subdirectory?: string) => {
  const base = join(process.cwd(), 'test/fixtures/monorepo')
  return subdirectory ? join(base, subdirectory) : base
}

describe('discoverPackages', () => {
  test('discovers packages from any directory without workspace detection', async () => {
    // Test that it works with non-workspace directories
    const singlePackagePath = getWorkspacePath('packages/ui-components')
    const packages = await discoverPackages(singlePackagePath)

    expect(packages).toHaveLength(1)
    expect(packages[0].path).toBe(singlePackagePath)
    expect(packages[0].name).toBe('@test/ui-components')
  })

  test('discovers packages recursively from starting point', async () => {
    // Test that it finds all packages under the given path
    const packagesPath = getWorkspacePath('packages')
    const packages = await discoverPackages(packagesPath)

    expect(packages.length).toBeGreaterThanOrEqual(5) // ui-components, api-server, shared-utils, no-scripts, no-name, broken-package
    const packageNames = packages.map((p) => p.name).filter(Boolean)
    expect(packageNames).toContain('@test/ui-components')
    expect(packageNames).toContain('@test/api-server')
  })
  test('discovers a single package.json file', async () => {
    const workspacePath = getWorkspacePath('packages/ui-components')
    const packages = await discoverPackages(workspacePath)

    expect(packages).toHaveLength(1)
    expect(packages[0]).toMatchObject({
      path: workspacePath,
    })
  })

  test('discovers multiple package.json files in workspace', async () => {
    const workspacePath = getWorkspacePath()
    const packages = await discoverPackages(workspacePath)

    expect(packages.length).toBeGreaterThan(1)
    expect(packages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: expect.not.stringContaining('package.json'),
        }),
      ])
    )
  })

  test('excludes node_modules directories', async () => {
    const workspacePath = getWorkspacePath()
    const packages = await discoverPackages(workspacePath)

    expect(packages.every((pkg) => !pkg.path.includes('node_modules'))).toBe(
      true
    )
  })

  test('extracts script name and command from package.json', async () => {
    const workspacePath = getWorkspacePath('packages/ui-components')
    const packages = await discoverPackages(workspacePath)

    expect(packages[0].scripts).toBeDefined()
    expect(packages[0].scripts).toEqual(
      expect.objectContaining({
        build: 'vite build',
        dev: 'vite',
        test: 'vitest run',
      })
    )
  })

  test('handles package.json with missing scripts field gracefully', async () => {
    const workspacePath = getWorkspacePath('packages/no-scripts')
    const packages = await discoverPackages(workspacePath)

    expect(packages).toHaveLength(1)
    expect(packages[0].scripts).toEqual({})
    expect(packages[0].name).toBe('@test/no-scripts')
  })

  test('handles package.json with missing name field gracefully', async () => {
    const workspacePath = getWorkspacePath('packages/no-name')
    const packages = await discoverPackages(workspacePath)

    expect(packages).toHaveLength(1)
    expect(packages[0].name).toBeUndefined()
    expect(packages[0].scripts).toEqual({
      test: "echo 'testing'",
    })
  })

  test('includes package name and path in results', async () => {
    const workspacePath = getWorkspacePath('packages/ui-components')
    const packages = await discoverPackages(workspacePath)

    expect(packages[0].name).toBe('@test/ui-components')
    expect(packages[0]).not.toHaveProperty('relativePath')
  })

  test('path property should be the directory containing package.json, not the file itself', async () => {
    const workspacePath = getWorkspacePath('packages/api-server')
    const packages = await discoverPackages(workspacePath)

    expect(packages).toHaveLength(1)
    expect(packages[0].path).toBe(workspacePath)
    expect(packages[0].path).not.toContain('package.json')
  })
})
