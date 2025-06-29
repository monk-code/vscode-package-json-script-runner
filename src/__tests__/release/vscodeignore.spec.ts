import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

describe('.vscodeignore validation', () => {
  const projectRoot = join(__dirname, '../../..')
  const vscodeignorePath = join(projectRoot, '.vscodeignore')

  it('should exist in project root', () => {
    expect(existsSync(vscodeignorePath)).toBe(true)
  })

  it('should exclude development and test files', () => {
    const content = readFileSync(vscodeignorePath, 'utf8')
    const lines = content
      .split('\n')
      .filter((line) => line.trim() && !line.startsWith('#'))

    // Development files that should be excluded
    const requiredExclusions = [
      '.vscode/**',
      '.github/**',
      'node_modules/**',
      'src/**',
      'test/**',
      '.editorconfig',
      '.gitignore',
      '*.ts',
      '*.mjs',
      'pnpm-lock.yaml',
    ]

    requiredExclusions.forEach((pattern) => {
      expect(lines).toContain(pattern)
    })
  })

  it('should include necessary files for extension', () => {
    const content = readFileSync(vscodeignorePath, 'utf8')
    const lines = content
      .split('\n')
      .filter((line) => line.trim() && !line.startsWith('#'))

    // Files that should be included (negated patterns)
    const requiredInclusions = ['!README.md', '!LICENSE', '!package.json']

    requiredInclusions.forEach((pattern) => {
      expect(lines).toContain(pattern)
    })
  })

  it('should exclude all markdown files except README and LICENSE', () => {
    const content = readFileSync(vscodeignorePath, 'utf8')
    const lines = content
      .split('\n')
      .filter((line) => line.trim() && !line.startsWith('#'))

    expect(lines).toContain('*.md')
    expect(lines.indexOf('*.md')).toBeLessThan(lines.indexOf('!README.md'))
  })

  it('should exclude test-workspace directory', () => {
    const content = readFileSync(vscodeignorePath, 'utf8')
    const lines = content
      .split('\n')
      .filter((line) => line.trim() && !line.startsWith('#'))

    expect(lines.some((line) => line.includes('test-workspace'))).toBe(true)
  })

  it('should exclude coverage and build artifacts', () => {
    const content = readFileSync(vscodeignorePath, 'utf8')
    const lines = content
      .split('\n')
      .filter((line) => line.trim() && !line.startsWith('#'))

    const buildArtifacts = ['coverage/**', '.vscode-test/**', 'out/**']

    buildArtifacts.forEach((pattern) => {
      expect(lines).toContain(pattern)
    })
  })
})
