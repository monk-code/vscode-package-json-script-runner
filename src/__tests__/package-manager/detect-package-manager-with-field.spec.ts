import { beforeEach, describe, expect, test, vi } from 'vitest'
import { promises as fs } from 'node:fs'

import type { PackageManager } from '#/package-manager/package-manager-types.js'

// Mock fs.access and fs.readFile to simulate file operations
vi.mock('node:fs', () => ({
  promises: {
    access: vi.fn(),
    readFile: vi.fn(),
  },
}))

const mockFs = vi.mocked(fs)

describe('detectPackageManager with packageManager field', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('detects pnpm from packageManager field', async () => {
    const { detectPackageManager } = await import(
      '#/package-manager/detect-package-manager.js'
    )

    // Mock package.json with packageManager field
    mockFs.readFile.mockResolvedValueOnce(
      JSON.stringify({
        name: 'test-project',
        packageManager: 'pnpm@8.0.0',
      })
    )

    // Mock no lock files exist
    mockFs.access.mockRejectedValue(
      new Error('ENOENT: no such file or directory')
    )

    const result = await detectPackageManager('/test/workspace')

    expect(result).toBe('pnpm' as PackageManager)
    expect(mockFs.readFile).toHaveBeenCalledWith(
      '/test/workspace/package.json',
      'utf-8'
    )
  })

  test('detects yarn from packageManager field', async () => {
    const { detectPackageManager } = await import(
      '#/package-manager/detect-package-manager.js'
    )

    // Mock package.json with yarn packageManager
    mockFs.readFile.mockResolvedValueOnce(
      JSON.stringify({
        name: 'test-project',
        packageManager: 'yarn@3.5.0',
      })
    )

    // Mock no lock files exist
    mockFs.access.mockRejectedValue(
      new Error('ENOENT: no such file or directory')
    )

    const result = await detectPackageManager('/test/workspace')

    expect(result).toBe('yarn' as PackageManager)
  })

  test('detects npm from packageManager field', async () => {
    const { detectPackageManager } = await import(
      '#/package-manager/detect-package-manager.js'
    )

    // Mock package.json with npm packageManager
    mockFs.readFile.mockResolvedValueOnce(
      JSON.stringify({
        name: 'test-project',
        packageManager: 'npm@10.0.0',
      })
    )

    // Mock no lock files exist
    mockFs.access.mockRejectedValue(
      new Error('ENOENT: no such file or directory')
    )

    const result = await detectPackageManager('/test/workspace')

    expect(result).toBe('npm' as PackageManager)
  })

  test('falls back to lock file detection when packageManager field is missing', async () => {
    const { detectPackageManager } = await import(
      '#/package-manager/detect-package-manager.js'
    )

    // Mock package.json without packageManager field
    mockFs.readFile.mockResolvedValueOnce(
      JSON.stringify({
        name: 'test-project',
      })
    )

    // Mock yarn.lock exists
    mockFs.access.mockImplementation(async (path) => {
      if (String(path).includes('yarn.lock')) {
        return // File exists
      }
      throw new Error('ENOENT: no such file or directory')
    })

    const result = await detectPackageManager('/test/workspace')

    expect(result).toBe('yarn' as PackageManager)
  })

  test('falls back to lock file detection when package.json does not exist', async () => {
    const { detectPackageManager } = await import(
      '#/package-manager/detect-package-manager.js'
    )

    // Mock package.json does not exist
    mockFs.readFile.mockRejectedValueOnce(
      new Error('ENOENT: no such file or directory')
    )

    // Mock pnpm-lock.yaml exists
    mockFs.access.mockImplementation(async (path) => {
      if (String(path).includes('pnpm-lock.yaml')) {
        return // File exists
      }
      throw new Error('ENOENT: no such file or directory')
    })

    const result = await detectPackageManager('/test/workspace')

    expect(result).toBe('pnpm' as PackageManager)
  })

  test('handles malformed packageManager field gracefully', async () => {
    const { detectPackageManager } = await import(
      '#/package-manager/detect-package-manager.js'
    )

    // Mock package.json with invalid packageManager field
    mockFs.readFile.mockResolvedValueOnce(
      JSON.stringify({
        name: 'test-project',
        packageManager: 'invalid-format',
      })
    )

    // Mock npm lock file exists
    mockFs.access.mockImplementation(async (path) => {
      if (String(path).includes('package-lock.json')) {
        return // File exists
      }
      throw new Error('ENOENT: no such file or directory')
    })

    const result = await detectPackageManager('/test/workspace')

    expect(result).toBe('npm' as PackageManager)
  })

  test('handles unknown package manager in packageManager field', async () => {
    const { detectPackageManager } = await import(
      '#/package-manager/detect-package-manager.js'
    )

    // Mock package.json with unknown package manager
    mockFs.readFile.mockResolvedValueOnce(
      JSON.stringify({
        name: 'test-project',
        packageManager: 'bun@1.0.0',
      })
    )

    // Mock yarn lock file exists
    mockFs.access.mockImplementation(async (path) => {
      if (String(path).includes('yarn.lock')) {
        return // File exists
      }
      throw new Error('ENOENT: no such file or directory')
    })

    const result = await detectPackageManager('/test/workspace')

    expect(result).toBe('yarn' as PackageManager)
  })

  test('handles malformed JSON in package.json', async () => {
    const { detectPackageManager } = await import(
      '#/package-manager/detect-package-manager.js'
    )

    // Mock package.json with invalid JSON
    mockFs.readFile.mockResolvedValueOnce('{ invalid json')

    // Mock pnpm lock file exists
    mockFs.access.mockImplementation(async (path) => {
      if (String(path).includes('pnpm-lock.yaml')) {
        return // File exists
      }
      throw new Error('ENOENT: no such file or directory')
    })

    const result = await detectPackageManager('/test/workspace')

    expect(result).toBe('pnpm' as PackageManager)
  })

  test('prioritizes packageManager field over lock files', async () => {
    const { detectPackageManager } = await import(
      '#/package-manager/detect-package-manager.js'
    )

    // Mock package.json with npm in packageManager field
    mockFs.readFile.mockResolvedValueOnce(
      JSON.stringify({
        name: 'test-project',
        packageManager: 'npm@10.0.0',
      })
    )

    // Mock pnpm-lock.yaml exists (conflicting with packageManager field)
    mockFs.access.mockImplementation(async (path) => {
      if (String(path).includes('pnpm-lock.yaml')) {
        return // File exists
      }
      throw new Error('ENOENT: no such file or directory')
    })

    const result = await detectPackageManager('/test/workspace')

    // Should prefer packageManager field over lock file
    expect(result).toBe('npm' as PackageManager)
  })
})
