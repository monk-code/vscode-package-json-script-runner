import { describe, expect, test } from 'vitest'

import { formatUserError } from '#/utils/error-handling.js'

describe('formatUserError', () => {
  test('formats Error objects with helpful messages', () => {
    const error = new Error('File not found')
    const result = formatUserError(error, 'discovering packages')

    expect(result).toBe('Error discovering packages: File not found')
  })

  test('formats string errors', () => {
    const error = 'Something went wrong'
    const result = formatUserError(error, 'running script')

    expect(result).toBe('Error running script: Something went wrong')
  })

  test('handles unknown error types gracefully', () => {
    const error = { someProperty: 'value', nested: { data: 123 } }
    const result = formatUserError(error, 'reading file')

    expect(result).toContain('Error reading file:')
    expect(result).toContain('Unknown error')
  })

  test('handles null/undefined errors', () => {
    const result1 = formatUserError(null, 'testing')
    const result2 = formatUserError(undefined, 'testing')

    expect(result1).toBe('Error testing: Unknown error occurred')
    expect(result2).toBe('Error testing: Unknown error occurred')
  })

  test('provides user-friendly messages for common Node.js errors', () => {
    const enoentError = { code: 'ENOENT', path: '/missing/file.json' }
    const result = formatUserError(enoentError, 'reading package.json')

    expect(result).toContain('file or directory not found')
  })
})
