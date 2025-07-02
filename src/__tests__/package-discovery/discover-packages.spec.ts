import { discoverPackages } from '#/package-discovery/discover-packages.js'
import { join, dirname } from 'node:path'
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
        dev: expect.stringContaining('Vite dev server'),
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

  describe('cross-platform path handling', () => {
    test('string.replace with hardcoded separator fails on Windows paths', () => {
      // Test the specific bug: .replace('/package.json', '') fails on Windows

      // Simulate paths on different platforms
      const unixPath = '/home/user/project/package.json'
      const windowsPath = 'C:\\Users\\project\\package.json'

      // Current buggy implementation using string.replace
      const buggyUnixResult = unixPath.replace('/package.json', '')
      const buggyWindowsResult = windowsPath.replace('/package.json', '')

      // The bug: Unix paths work but Windows paths don't
      expect(buggyUnixResult).toBe('/home/user/project') // ✓ Works
      expect(buggyWindowsResult).toBe('C:\\Users\\project\\package.json') // ✗ No replacement!

      // This demonstrates that the current implementation is broken for Windows
      expect(windowsPath.includes('\\package.json')).toBe(true)
      expect(windowsPath.includes('/package.json')).toBe(false)
    })

    test('dirname correctly extracts directory on all platforms', () => {
      // Show that dirname works correctly as the solution

      // For Unix paths
      const unixPath = '/home/user/project/package.json'
      const unixDir = dirname(unixPath)
      expect(unixDir).toBe('/home/user/project')

      // Note: dirname behavior on our test system (Unix) will normalize paths
      // The important thing is that it removes the filename correctly
      const testPath = join('test', 'dir', 'package.json')
      const testDir = dirname(testPath)
      expect(testDir).toBe(join('test', 'dir'))
      expect(testDir).not.toContain('package.json')
    })

    test('handles edge cases in path extraction', () => {
      // Test various edge cases that might occur across platforms

      // Paths with spaces
      const pathWithSpaces = join('my project', 'sub folder', 'package.json')
      expect(dirname(pathWithSpaces)).toBe(join('my project', 'sub folder'))

      // Paths with special characters
      const pathWithSpecialChars = join('project@2.0', 'src', 'package.json')
      expect(dirname(pathWithSpecialChars)).toBe(join('project@2.0', 'src'))

      // Deeply nested paths
      const deepPath = join('a', 'b', 'c', 'd', 'e', 'f', 'package.json')
      expect(dirname(deepPath)).toBe(join('a', 'b', 'c', 'd', 'e', 'f'))

      // Root level package.json
      expect(dirname('package.json')).toBe('.')
      expect(dirname('./package.json')).toBe('.')

      // Relative paths
      const relativePath = join('..', 'project', 'package.json')
      expect(dirname(relativePath)).toBe(join('..', 'project'))
    })

    test('discoverPackages works with various path formats', async () => {
      // Test that the fixed implementation works with real package discovery

      // Test with existing fixture
      const packages = await discoverPackages(
        getWorkspacePath('packages/ui-components')
      )
      expect(packages).toHaveLength(1)
      expect(packages[0].path).toBe(getWorkspacePath('packages/ui-components'))
      expect(packages[0].path).not.toContain('package.json')

      // Verify path is absolute and properly formatted
      expect(packages[0].path).toMatch(/^[/\\]/) // Starts with / or \
    })
  })
})
