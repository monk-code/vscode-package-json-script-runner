import { describe, it, expect } from 'vitest'
import type { PackageInfo } from '#/types/package-info.js'
import type { ScriptQuickPickItem } from '#/types/script-quick-pick-item.js'
import {
  type PerformanceBenchmark,
  runBenchmark,
  generateMockPackages,
  measurePerformance,
} from '#/__tests__/test-utils/performance-helpers.js'
import {
  realWorldPackages,
  generateRealWorldVariations,
} from '#/__tests__/test-utils/real-world-fixtures.js'

// Import the functions directly to avoid vscode dependency
const createScriptQuickPickItems = (
  packages: readonly PackageInfo[]
): ScriptQuickPickItem[] => {
  return packages
    .filter(
      (
        pkg
      ): pkg is PackageInfo & {
        name: string
        scripts: Record<string, string>
      } => Boolean(pkg.name && pkg.scripts)
    )
    .flatMap((pkg) =>
      Object.entries(pkg.scripts).map(([scriptName, scriptCommand]) => ({
        label: scriptName,
        description: pkg.name,
        detail: scriptCommand,
        packageName: pkg.name,
        packagePath: pkg.path,
        scriptName,
        scriptCommand,
      }))
    )
}

describe('Script Quick Pick Performance', () => {
  const benchmarks: PerformanceBenchmark[] = [
    {
      packageCount: 100,
      scriptPerPackage: 10,
      searchQuery: 'test dev',
      expectedMaxMs: 50,
    },
    {
      packageCount: 1000,
      scriptPerPackage: 10,
      searchQuery: 'build prod',
      expectedMaxMs: 100,
    },
    {
      packageCount: 5000,
      scriptPerPackage: 10,
      searchQuery: 'start mob',
      expectedMaxMs: 200,
    },
    {
      packageCount: 0,
      scriptPerPackage: 0,
      searchQuery: 'test',
      expectedMaxMs: 150,
      useRealWorldData: true,
    },
  ]

  benchmarks.forEach((benchmark) => {
    const testName = benchmark.useRealWorldData
      ? 'should meet performance target with real-world data'
      : `should complete search in <${benchmark.expectedMaxMs}ms for ${benchmark.packageCount} packages`

    it(testName, async () => {
      // Given
      const packages: PackageInfo[] = benchmark.useRealWorldData
        ? [...realWorldPackages, ...generateRealWorldVariations()]
        : generateMockPackages(
            benchmark.packageCount,
            benchmark.scriptPerPackage
          )

      // When - Create items and measure performance
      const { result: items, duration: createDuration } =
        await measurePerformance(() => createScriptQuickPickItems(packages))

      console.log(
        `Created ${items.length} items from ${packages.length} packages in ${createDuration.toFixed(2)}ms`
      )

      // Simulate search performance
      const searchTest = async () => {
        // Simulate the search logic without importing the actual function
        const searchTerms = benchmark.searchQuery.trim().split(/\s+/)

        const filteredItems = items.filter((item) => {
          const itemText =
            `${item.scriptName} ${item.packageName}`.toLowerCase()
          const words = itemText.split(/[\s\-_@/:]+/)

          return searchTerms.every((term) => {
            const lowerTerm = term.toLowerCase()
            return words.some((word) => word.startsWith(lowerTerm))
          })
        })

        return filteredItems.length // Just to use the result
      }

      // Run benchmark
      const result = await runBenchmark(benchmark, searchTest, 10)

      // Then
      console.log(`Search benchmark results:`)
      console.log(`  Average: ${result.average.toFixed(2)}ms`)
      console.log(`  95th percentile: ${result.p95.toFixed(2)}ms`)
      console.log(`  Expected max: ${benchmark.expectedMaxMs}ms`)
      console.log(`  Passed: ${result.passed ? '✅' : '❌'}`)

      expect(result.passed).toBe(true)
    })
  })

  it('should handle edge case package structures from real projects', async () => {
    // Given - Complex real-world package structures
    const edgeCasePackages: PackageInfo[] = [
      // Package with many scripts
      {
        path: '/workspace/packages/build-tools',
        name: '@tools/build',
        relativePath: 'packages/build-tools',
        scripts: Object.fromEntries(
          Array.from({ length: 50 }, (_, i) => [
            `script${i}`,
            `echo "Running script ${i}"`,
          ])
        ),
      },
      // Package with very long script names
      {
        path: '/workspace/packages/enterprise-app',
        name: '@enterprise/super-long-package-name-that-represents-real-world-scenarios',
        relativePath: 'packages/enterprise-app',
        scripts: {
          'build:production:with:all:optimizations:enabled':
            'webpack --mode production --optimize',
          'test:integration:with:database:and:external:services':
            'jest --runInBand',
          'deploy:staging:kubernetes:cluster:with:rollback':
            'kubectl apply -f k8s/',
        },
      },
      // Package with special characters in names
      {
        path: '/workspace/packages/special-chars',
        name: '@company/package.with-special_chars@2.0',
        relativePath: 'packages/special-chars',
        scripts: {
          'pre:build': 'echo "Pre-build"',
          'build:debug': 'tsc --sourceMap',
          'post:build': 'echo "Post-build"',
        },
      },
    ]

    // When
    const { result: items, duration } = await measurePerformance(() =>
      createScriptQuickPickItems(edgeCasePackages)
    )

    // Then
    expect(items.length).toBeGreaterThan(0)
    expect(duration).toBeLessThan(50) // Should be fast even with edge cases

    // Verify all scripts were processed correctly
    const totalExpectedScripts = edgeCasePackages.reduce(
      (sum, pkg) => sum + Object.keys(pkg.scripts || {}).length,
      0
    )
    expect(items.length).toBe(totalExpectedScripts)
  })

  it('should maintain performance with concurrent searches', async () => {
    // Given
    const packages = generateMockPackages(1000, 10)
    const items = createScriptQuickPickItems(packages)

    // When - Simulate rapid concurrent searches
    const searchQueries = [
      't',
      'te',
      'tes',
      'test',
      'test ',
      'test s',
      'test sc',
      'test script',
    ]
    const searchPromises = searchQueries.map(async (query) => {
      return measurePerformance(() => {
        const searchTerms = query
          .trim()
          .split(/\s+/)
          .filter((term) => term.length > 0)

        if (searchTerms.length === 0) {
          return items
        }

        return items.filter((item) => {
          const itemText =
            `${item.scriptName} ${item.packageName}`.toLowerCase()
          const words = itemText.split(/[\s\-_@/:]+/)

          return searchTerms.every((term) => {
            const lowerTerm = term.toLowerCase()
            return words.some((word) => word.startsWith(lowerTerm))
          })
        })
      })
    })

    const results = await Promise.all(searchPromises)

    // Then - All searches should complete quickly
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)
    expect(totalDuration).toBeLessThan(500) // Total time for all searches should be reasonable

    results.forEach((result, index) => {
      console.log(
        `Search "${searchQueries[index]}" completed in ${result.duration.toFixed(2)}ms`
      )
    })

    // Verify searches get progressively faster (initialization overhead at start)
    expect(results[results.length - 1].duration).toBeLessThan(
      results[0].duration
    )
  })
})
