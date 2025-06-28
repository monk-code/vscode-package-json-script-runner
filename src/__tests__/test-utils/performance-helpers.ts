import { performance } from 'node:perf_hooks'

export type PerformanceBenchmark = {
  packageCount: number
  scriptPerPackage: number
  searchQuery: string
  expectedMaxMs: number
  useRealWorldData?: boolean
}

export type BenchmarkResult = {
  benchmark: PerformanceBenchmark
  runs: number[]
  average: number
  p95: number
  passed: boolean
}

export const measurePerformance = async <T>(
  fn: () => T | Promise<T>
): Promise<{ result: T; duration: number }> => {
  const start = performance.now()
  const result = await fn()
  const duration = performance.now() - start
  return { result, duration }
}

export const runBenchmark = async (
  benchmark: PerformanceBenchmark,
  testFn: () => Promise<unknown>,
  runs = 5
): Promise<BenchmarkResult> => {
  const durations: number[] = []

  for (let i = 0; i < runs; i++) {
    const { duration } = await measurePerformance(testFn)
    durations.push(duration)
  }

  const average = durations.reduce((sum, d) => sum + d, 0) / durations.length
  const sortedDurations = [...durations].sort((a, b) => a - b)
  const p95Index = Math.floor(durations.length * 0.95)
  const p95 =
    sortedDurations[p95Index] || sortedDurations[sortedDurations.length - 1]

  return {
    benchmark,
    runs: durations,
    average,
    p95,
    passed: p95 <= benchmark.expectedMaxMs,
  }
}

export const generateMockPackages = (
  packageCount: number,
  scriptsPerPackage: number
) => {
  const packages = []

  for (let i = 0; i < packageCount; i++) {
    const scripts: Record<string, string> = {}

    for (let j = 0; j < scriptsPerPackage; j++) {
      const scriptTypes = [
        'build',
        'test',
        'start',
        'dev',
        'lint',
        'format',
        'deploy',
      ]
      const scriptType = scriptTypes[j % scriptTypes.length]
      scripts[`${scriptType}${j >= scriptTypes.length ? `-${j}` : ''}`] =
        `npm run ${scriptType}`
    }

    packages.push({
      path: `/workspace/packages/package-${i}`,
      name: `@company/package-${i}`,
      relativePath: `packages/package-${i}`,
      scripts,
    })
  }

  return packages
}
