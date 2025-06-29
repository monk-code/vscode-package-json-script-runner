import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

describe('CHANGELOG.md validation', () => {
  const projectRoot = join(__dirname, '../../..')
  const changelogPath = join(projectRoot, 'CHANGELOG.md')

  it('should exist in project root', () => {
    expect(existsSync(changelogPath)).toBe(true)
  })

  it('should follow Keep a Changelog format', () => {
    const content = readFileSync(changelogPath, 'utf8')

    // Should have the standard header
    expect(content).toContain('# Changelog')
    expect(content).toContain(
      'All notable changes to this project will be documented in this file.'
    )
    expect(content).toContain('[Keep a Changelog](https://keepachangelog.com/')
    expect(content).toContain('[Semantic Versioning](https://semver.org/')
  })

  it('should have an Unreleased section', () => {
    const content = readFileSync(changelogPath, 'utf8')

    expect(content).toMatch(/## \[Unreleased\]/i)
  })

  it('should use proper change type sections', () => {
    const content = readFileSync(changelogPath, 'utf8')

    // Check for at least one of the standard change types
    const changeTypes = [
      '### Added',
      '### Changed',
      '### Deprecated',
      '### Removed',
      '### Fixed',
      '### Security',
    ]

    const hasChangeTypes = changeTypes.some((type) => content.includes(type))
    expect(hasChangeTypes).toBe(true)
  })

  it('should include comparison links format', () => {
    const content = readFileSync(changelogPath, 'utf8')

    // Should include the unreleased comparison link format
    expect(content).toMatch(
      /\[unreleased\]:\s*https:\/\/github\.com\/.*\/compare\//i
    )
  })
})
