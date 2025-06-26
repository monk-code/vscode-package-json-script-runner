import { describe, test, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

describe('Test Workspace Setup', () => {
  test('should have monorepo test structure', () => {
    const testWorkspace = join(__dirname, '../../../test-workspace')

    // Root package.json
    expect(existsSync(join(testWorkspace, 'package.json'))).toBe(true)

    // Package directories
    expect(
      existsSync(join(testWorkspace, 'packages/ui-components/package.json'))
    ).toBe(true)
    expect(
      existsSync(join(testWorkspace, 'packages/api-server/package.json'))
    ).toBe(true)
    expect(
      existsSync(join(testWorkspace, 'packages/shared-utils/package.json'))
    ).toBe(true)

    // Apps directories
    expect(existsSync(join(testWorkspace, 'apps/web-app/package.json'))).toBe(
      true
    )
    expect(
      existsSync(join(testWorkspace, 'apps/mobile-app/package.json'))
    ).toBe(true)

    // Tools directories
    expect(
      existsSync(join(testWorkspace, 'tools/build-scripts/package.json'))
    ).toBe(true)
  })
})
