import { describe, test, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('Biome Configuration', () => {
  test('should have biome.json configuration file', () => {
    const biomeConfigPath = join(__dirname, '../../../biome.json')
    expect(existsSync(biomeConfigPath)).toBe(true)

    const biomeConfig = JSON.parse(readFileSync(biomeConfigPath, 'utf-8'))
    expect(biomeConfig).toBeDefined()
    expect(biomeConfig.linter).toBeDefined()
    expect(biomeConfig.formatter).toBeDefined()
  })

  test('should have linting and formatting scripts in package.json', () => {
    const packageJsonPath = join(__dirname, '../../../package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

    expect(packageJson.scripts.lint).toBeDefined()
    expect(packageJson.scripts['lint:fix']).toBeDefined()
    expect(packageJson.scripts.format).toBeDefined()
    expect(packageJson.scripts['format:fix']).toBeDefined()
    expect(packageJson.scripts.validate).toBeDefined()
  })

  test('validate script should include all checks', () => {
    const packageJsonPath = join(__dirname, '../../../package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

    const validateScript = packageJson.scripts.validate
    expect(validateScript).toContain('types:check')
    expect(validateScript).toContain('lint')
    expect(validateScript).toContain('format')
    expect(validateScript).toContain('test')
  })
})
