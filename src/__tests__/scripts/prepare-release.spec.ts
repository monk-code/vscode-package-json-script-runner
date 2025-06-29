import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { spawn } from 'node:child_process'

describe('prepare-release script', () => {
  const projectRoot = join(__dirname, '../../..')
  const scriptPath = join(projectRoot, 'scripts/prepare-release.mjs')

  it('should exist', () => {
    expect(existsSync(scriptPath)).toBe(true)
  })

  it('should be executable', async () => {
    // Run the script with --help flag to test it's executable
    return new Promise<void>((resolve, reject) => {
      const child = spawn('node', [scriptPath, '--help'], {
        cwd: projectRoot,
        stdio: 'pipe',
      })

      let output = ''
      child.stdout.on('data', (data) => {
        output += data.toString()
      })

      child.stderr.on('data', (data) => {
        output += data.toString()
      })

      child.on('close', (code) => {
        expect(code).toBe(0)
        expect(output).toContain('prepare-release')
        resolve()
      })

      child.on('error', reject)
    })
  })

  it('should check for uncommitted changes', async () => {
    return new Promise<void>((resolve, reject) => {
      const child = spawn('node', [scriptPath, '--dry-run'], {
        cwd: projectRoot,
        stdio: 'pipe',
      })

      let output = ''
      child.stdout.on('data', (data) => {
        output += data.toString()
      })

      child.stderr.on('data', (data) => {
        output += data.toString()
      })

      child.on('close', () => {
        // Should check git status
        expect(output.toLowerCase()).toMatch(/check|git|uncommitted|clean/i)
        resolve()
      })

      child.on('error', reject)
    })
  })
})
