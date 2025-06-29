import { describe, expect, test } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('package.json configuration', () => {
  const loadPackageJson = (): Record<string, unknown> => {
    const content = readFileSync(join(process.cwd(), 'package.json'), 'utf-8')
    return JSON.parse(content)
  }

  const packageJson = loadPackageJson()

  test('should have required VS Code extension fields', () => {
    expect(packageJson).toHaveProperty('name')
    expect(packageJson).toHaveProperty('displayName')
    expect(packageJson).toHaveProperty('description')
    expect(packageJson).toHaveProperty('version')
    expect(packageJson).toHaveProperty('publisher')
    expect(packageJson).toHaveProperty('engines')
    expect(packageJson).toHaveProperty('categories')
    expect(packageJson).toHaveProperty('main')
    expect(packageJson).toHaveProperty('contributes')
  })

  test('should have correct publisher ID', () => {
    expect(packageJson.publisher).toBe('monkcode')
  })

  test('should have correct repository URLs', () => {
    const repository = packageJson.repository as Record<string, string>
    expect(repository.url).toBe(
      'https://github.com/monk-code/vscode-package-json-script-runner.git'
    )

    const bugs = packageJson.bugs as Record<string, string>
    expect(bugs.url).toBe(
      'https://github.com/monk-code/vscode-package-json-script-runner/issues'
    )

    expect(packageJson.homepage).toBe(
      'https://github.com/monk-code/vscode-package-json-script-runner#readme'
    )
  })

  test('should not reference Bright Energy in author field', () => {
    const author = packageJson.author as string
    expect(author).toBeDefined()
    expect(author.toLowerCase()).not.toContain('bright energy')
  })

  test('should have non-conflicting keybindings', () => {
    const contributes = packageJson.contributes as Record<string, unknown>
    const keybindings = contributes.keybindings as Array<Record<string, string>>
    expect(keybindings).toBeDefined()
    expect(keybindings.length).toBeGreaterThan(0)

    const firstKeybinding = keybindings[0]
    expect(firstKeybinding.key).toBe('ctrl+alt+r')
    expect(firstKeybinding.mac).toBe('cmd+alt+r')
  })

  test('should target compatible VS Code engine version', () => {
    const engines = packageJson.engines as Record<string, string>
    expect(engines.vscode).toBe('^1.85.0')
  })

  test('should have appropriate categories including Task Running', () => {
    const categories = packageJson.categories as string[]
    expect(categories).toBeDefined()
    expect(categories).toContain('Task Running')
    expect(categories).toContain('Other')
  })

  test('should have icon configuration', () => {
    expect(packageJson.icon).toBe('images/logo.png')
  })
})
