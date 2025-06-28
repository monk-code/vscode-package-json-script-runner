import { discoverPackages } from '#/package-discovery/discover-packages.js'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'

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
    expect(packages[0].relativePath).toBe('packages/ui-components')
  })

  test('path property should be the directory containing package.json, not the file itself', async () => {
    const workspacePath = getWorkspacePath('packages/api-server')
    const packages = await discoverPackages(workspacePath)

    expect(packages).toHaveLength(1)
    expect(packages[0].path).toBe(workspacePath)
    expect(packages[0].path).not.toContain('package.json')
  })
})
