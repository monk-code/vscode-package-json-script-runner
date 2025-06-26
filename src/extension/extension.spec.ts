import { describe, test, expect } from 'vitest'
import * as extension from './extension.js'

describe('Extension Setup', () => {
  test('extension should export activate function', () => {
    expect(extension.activate).toBeDefined()
  })
})