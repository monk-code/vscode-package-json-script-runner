import { describe, test, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

describe('Vitest Configuration', () => {
  test('should use spec.ts naming convention', async () => {
    const vitestConfigPath = join(__dirname, '../../../vitest.config.mts')
    expect(existsSync(vitestConfigPath)).toBe(true)

    // Import the config dynamically
    const config = await import(vitestConfigPath)
    const testConfig = config.default.test

    expect(testConfig).toBeDefined()
    expect(testConfig.include).toBeDefined()
    expect(testConfig.include).toContain('src/__tests__/**/*.spec.ts')
  })

  test('should have proper test environment configured', async () => {
    const vitestConfigPath = join(__dirname, '../../../vitest.config.mts')
    const config = await import(vitestConfigPath)
    const testConfig = config.default.test

    expect(testConfig.globals).toBe(true)
    expect(testConfig.environment).toBe('node')
  })
})
