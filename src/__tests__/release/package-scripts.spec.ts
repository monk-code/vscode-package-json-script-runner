import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('package.json release scripts', () => {
  const projectRoot = join(__dirname, '../../..')
  const packageJsonPath = join(projectRoot, 'package.json')

  const getPackageJson = () => {
    const content = readFileSync(packageJsonPath, 'utf8')
    return JSON.parse(content)
  }

  it('should have vsce as a devDependency', () => {
    const packageJson = getPackageJson()

    expect(packageJson.devDependencies).toBeDefined()
    expect(packageJson.devDependencies['@vscode/vsce']).toBeDefined()
  })

  it('should have release-related scripts', () => {
    const packageJson = getPackageJson()

    expect(packageJson.scripts).toBeDefined()

    // Essential release scripts
    const requiredScripts = [
      'package',
      'publish:patch',
      'publish:minor',
      'publish:major',
    ]

    requiredScripts.forEach((script) => {
      expect(packageJson.scripts[script]).toBeDefined()
    })
  })

  it('should have correct script commands', () => {
    const packageJson = getPackageJson()

    // Verify script commands use vsce
    expect(packageJson.scripts.package).toContain('vsce package')
    expect(packageJson.scripts['publish:patch']).toContain('vsce publish patch')
    expect(packageJson.scripts['publish:minor']).toContain('vsce publish minor')
    expect(packageJson.scripts['publish:major']).toContain('vsce publish major')
  })

  it('should have a prepublish script that runs validation', () => {
    const packageJson = getPackageJson()

    // Should validate before publishing
    expect(packageJson.scripts.prepublish).toBeDefined()
    expect(packageJson.scripts.prepublish).toContain('validate')
  })
})
