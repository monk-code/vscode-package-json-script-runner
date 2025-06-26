import { describe, expect, test } from 'vitest'
import { join } from 'node:path'
import { discoverPackages } from '#/package-discovery/discover-packages.js'

const getWorkspacePath = (subdirectory?: string) => {
  const base = join(process.cwd(), 'test-workspace')
  return subdirectory ? join(base, subdirectory) : base
}

describe('discoverPackages', () => {
  test('discovers a single package.json file', async () => {
    const workspacePath = getWorkspacePath('packages/ui-components')
    const packages = await discoverPackages(workspacePath)

    expect(packages).toHaveLength(1)
    expect(packages[0]).toMatchObject({
      path: join(workspacePath, 'package.json'),
    })
  })

  test('discovers multiple package.json files in workspace', async () => {
    const workspacePath = getWorkspacePath()
    const packages = await discoverPackages(workspacePath)

    expect(packages.length).toBeGreaterThan(1)
    expect(packages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: expect.stringContaining('package.json'),
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

  test('handles malformed package.json gracefully', async () => {
    const workspacePath = getWorkspacePath('packages/broken-package')

    // Should not throw
    await expect(discoverPackages(workspacePath)).resolves.toBeDefined()

    const packages = await discoverPackages(workspacePath)
    // No packages should be found in a broken directory
    expect(packages).toHaveLength(0)
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
    expect(packages[0].relativePath).toBe('packages/ui-components')
  })
})
