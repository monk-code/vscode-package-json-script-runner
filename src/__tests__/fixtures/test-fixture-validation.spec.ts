import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const fixturesDir = join(__dirname, '../../../test/fixtures')

describe('Test Fixture Validation', () => {
  it('should have long-running scripts in monorepo web-app fixture', () => {
    const packageJsonPath = join(
      fixturesDir,
      'monorepo/apps/web-app/package.json'
    )
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

    expect(packageJson.scripts).toHaveProperty('dev')
    expect(packageJson.scripts).toHaveProperty('watch')
    expect(packageJson.scripts).toHaveProperty('serve')
    expect(packageJson.scripts).toHaveProperty('test:watch')
  })

  it('should have long-running scripts in monorepo api-server fixture', () => {
    const packageJsonPath = join(
      fixturesDir,
      'monorepo/packages/api-server/package.json'
    )
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

    expect(packageJson.scripts).toHaveProperty('dev')
    expect(packageJson.scripts).toHaveProperty('watch')
  })
})
