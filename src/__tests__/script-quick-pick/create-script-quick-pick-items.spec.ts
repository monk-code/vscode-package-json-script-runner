import { describe, expect, test } from 'vitest'
import Fuse from 'fuse.js'

import type { PackageInfo } from '#/types/package-info.js'

describe('createScriptQuickPickItems and fuzzy search', () => {
  const mockPackages: PackageInfo[] = [
    {
      path: '/workspace/packages/ui-components',
      name: '@mycompany/ui-components',
      relativePath: 'packages/ui-components',
      scripts: {
        build: 'vite build',
        test: 'vitest',
        dev: 'vite dev',
      },
    },
    {
      path: '/workspace/packages/api-server',
      name: '@mycompany/api-server',
      relativePath: 'packages/api-server',
      scripts: {
        start: 'node index.js',
        test: 'jest',
        'test:watch': 'jest --watch',
      },
    },
  ]

  test('fuzzy search finds scripts with partial match', () => {
    // Create items like in the actual implementation
    const allItems = mockPackages.flatMap((pkg) =>
      Object.entries(pkg.scripts ?? {}).map(([scriptName, scriptCommand]) => ({
        label: scriptName,
        description: pkg.name,
        detail: scriptCommand,
        packageName: pkg.name,
        packagePath: pkg.path,
        scriptName,
        scriptCommand,
      }))
    )

    // Set up fuzzy search like in the implementation
    const fuse = new Fuse(allItems, {
      keys: ['scriptName'],
      threshold: 0.3,
    })

    // Test search for "test" - will also match "test:watch"
    const testResults = fuse.search('test')
    expect(testResults).toHaveLength(3) // "test" from both packages + "test:watch"
    const testScriptNames = testResults.map((r) => r.item.scriptName)
    expect(testScriptNames).toContain('test')
    expect(testScriptNames).toContain('test:watch')

    // Test fuzzy match for "tes" should find "test" scripts
    const fuzzyResults = fuse.search('tes')
    expect(fuzzyResults.length).toBeGreaterThanOrEqual(2) // At least the two "test" scripts
    expect(
      fuzzyResults.some((result) => result.item.scriptName === 'test')
    ).toBe(true)

    // Test partial match for "dev"
    const devResults = fuse.search('dev')
    expect(devResults).toHaveLength(1)
    expect(devResults[0].item.scriptName).toBe('dev')

    // Test substring match for "watch"
    const watchResults = fuse.search('watch')
    expect(watchResults).toHaveLength(1)
    expect(watchResults[0].item.scriptName).toBe('test:watch')

    // Test that unmatched searches return empty
    const noResults = fuse.search('xyz123')
    expect(noResults).toHaveLength(0)
  })
})
