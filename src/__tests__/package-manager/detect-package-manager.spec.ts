import { beforeEach, describe, expect, test, vi } from 'vitest'
import { promises as fs } from 'node:fs'

import type { PackageManager } from '#/package-manager/package-manager-types.js'

// Mock fs.access to simulate file existence
vi.mock('node:fs', () => ({
  promises: {
    access: vi.fn(),
  },
}))

const mockFs = vi.mocked(fs)

describe('detectPackageManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('detects pnpm when pnpm-lock.yaml exists', async () => {
    const { detectPackageManager } = await import(
      '#/package-manager/detect-package-manager.js'
    )

    // Mock pnpm-lock.yaml exists, others don't
    mockFs.access.mockImplementation(async (path) => {
      if (String(path).includes('pnpm-lock.yaml')) {
        return // File exists
      }
      throw new Error('ENOENT: no such file or directory')
    })

    const result = await detectPackageManager('/test/workspace')

    expect(result).toBe('pnpm' as PackageManager)
    expect(mockFs.access).toHaveBeenCalledWith('/test/workspace/pnpm-lock.yaml')
  })

  test('detects yarn when yarn.lock exists and pnpm-lock.yaml does not', async () => {
    const { detectPackageManager } = await import(
      '#/package-manager/detect-package-manager.js'
    )

    // Mock yarn.lock exists, pnpm-lock.yaml doesn't
    mockFs.access.mockImplementation(async (path) => {
      if (String(path).includes('yarn.lock')) {
        return // File exists
      }
      throw new Error('ENOENT: no such file or directory')
    })

    const result = await detectPackageManager('/test/workspace')

    expect(result).toBe('yarn' as PackageManager)
    expect(mockFs.access).toHaveBeenCalledWith('/test/workspace/pnpm-lock.yaml')
    expect(mockFs.access).toHaveBeenCalledWith('/test/workspace/yarn.lock')
  })

  test('detects npm when package-lock.json exists and others do not', async () => {
    const { detectPackageManager } = await import(
      '#/package-manager/detect-package-manager.js'
    )

    // Mock package-lock.json exists, others don't
    mockFs.access.mockImplementation(async (path) => {
      if (String(path).includes('package-lock.json')) {
        return // File exists
      }
      throw new Error('ENOENT: no such file or directory')
    })

    const result = await detectPackageManager('/test/workspace')

    expect(result).toBe('npm' as PackageManager)
    expect(mockFs.access).toHaveBeenCalledWith('/test/workspace/pnpm-lock.yaml')
    expect(mockFs.access).toHaveBeenCalledWith('/test/workspace/yarn.lock')
    expect(mockFs.access).toHaveBeenCalledWith(
      '/test/workspace/package-lock.json'
    )
  })

  test('defaults to npm when no lock files exist', async () => {
    const { detectPackageManager } = await import(
      '#/package-manager/detect-package-manager.js'
    )

    // Mock all files don't exist
    mockFs.access.mockRejectedValue(
      new Error('ENOENT: no such file or directory')
    )

    const result = await detectPackageManager('/test/workspace')

    expect(result).toBe('npm' as PackageManager)
    expect(mockFs.access).toHaveBeenCalledWith('/test/workspace/pnpm-lock.yaml')
    expect(mockFs.access).toHaveBeenCalledWith('/test/workspace/yarn.lock')
    expect(mockFs.access).toHaveBeenCalledWith(
      '/test/workspace/package-lock.json'
    )
  })

  test('prioritizes pnpm over yarn when both lock files exist', async () => {
    const { detectPackageManager } = await import(
      '#/package-manager/detect-package-manager.js'
    )

    // Mock both pnpm-lock.yaml and yarn.lock exist
    mockFs.access.mockImplementation(async (path) => {
      if (
        String(path).includes('pnpm-lock.yaml') ||
        String(path).includes('yarn.lock')
      ) {
        return // File exists
      }
      throw new Error('ENOENT: no such file or directory')
    })

    const result = await detectPackageManager('/test/workspace')

    expect(result).toBe('pnpm' as PackageManager)
  })

  test('prioritizes yarn over npm when both yarn.lock and package-lock.json exist', async () => {
    const { detectPackageManager } = await import(
      '#/package-manager/detect-package-manager.js'
    )

    // Mock yarn.lock and package-lock.json exist, pnpm-lock.yaml doesn't
    mockFs.access.mockImplementation(async (path) => {
      if (
        String(path).includes('yarn.lock') ||
        String(path).includes('package-lock.json')
      ) {
        return // File exists
      }
      throw new Error('ENOENT: no such file or directory')
    })

    const result = await detectPackageManager('/test/workspace')

    expect(result).toBe('yarn' as PackageManager)
  })

  test('handles permission errors gracefully', async () => {
    const { detectPackageManager } = await import(
      '#/package-manager/detect-package-manager.js'
    )

    // Mock permission denied error
    mockFs.access.mockRejectedValue(new Error('EACCES: permission denied'))

    const result = await detectPackageManager('/test/workspace')

    expect(result).toBe('npm' as PackageManager)
  })

  test('handles empty workspace path', async () => {
    const { detectPackageManager } = await import(
      '#/package-manager/detect-package-manager.js'
    )

    mockFs.access.mockRejectedValue(
      new Error('ENOENT: no such file or directory')
    )

    const result = await detectPackageManager('')

    expect(result).toBe('npm' as PackageManager)
  })

  test('handles relative workspace paths correctly', async () => {
    const { detectPackageManager } = await import(
      '#/package-manager/detect-package-manager.js'
    )

    mockFs.access.mockImplementation(async (path) => {
      if (String(path).includes('pnpm-lock.yaml')) {
        return // File exists
      }
      throw new Error('ENOENT: no such file or directory')
    })

    const result = await detectPackageManager('./test/fixtures/monorepo')

    expect(result).toBe('pnpm' as PackageManager)
    expect(mockFs.access).toHaveBeenCalledWith(
      'test/fixtures/monorepo/pnpm-lock.yaml'
    )
  })
})
