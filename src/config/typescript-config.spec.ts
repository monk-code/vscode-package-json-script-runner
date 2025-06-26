import { describe, test, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('TypeScript Configuration', () => {
  test('should enforce strict mode settings', () => {
    const tsconfigPath = join(__dirname, '../../tsconfig.json')
    const tsconfigContent = readFileSync(tsconfigPath, 'utf-8')
    const tsConfig = JSON.parse(tsconfigContent)
    
    expect(tsConfig.compilerOptions.strict).toBe(true)
    expect(tsConfig.compilerOptions.noImplicitAny).toBe(true)
    expect(tsConfig.compilerOptions.strictNullChecks).toBe(true)
    expect(tsConfig.compilerOptions.strictFunctionTypes).toBe(true)
    expect(tsConfig.compilerOptions.strictBindCallApply).toBe(true)
    expect(tsConfig.compilerOptions.strictPropertyInitialization).toBe(true)
    expect(tsConfig.compilerOptions.noImplicitThis).toBe(true)
    expect(tsConfig.compilerOptions.alwaysStrict).toBe(true)
    expect(tsConfig.compilerOptions.noImplicitReturns).toBe(true)
    expect(tsConfig.compilerOptions.noFallthroughCasesInSwitch).toBe(true)
    expect(tsConfig.compilerOptions.noUnusedLocals).toBe(true)
    expect(tsConfig.compilerOptions.noUnusedParameters).toBe(true)
  })
})