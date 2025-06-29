import { describe, expect, it, vi } from 'vitest'

const mockGetConfiguration = vi.fn()

const mockWorkspace = {
  getConfiguration: mockGetConfiguration,
}

vi.mock('vscode', () => ({
  workspace: mockWorkspace,
}))

describe('getTerminalConfig', () => {
  it('should return default configuration when no settings are provided', async () => {
    const { getTerminalConfig } = await import(
      '../../terminal/terminal-config.js'
    )
    const mockConfig = {
      get: vi.fn((_key: string, defaultValue?: unknown) => defaultValue),
    }
    mockGetConfiguration.mockReturnValue(mockConfig)

    const config = getTerminalConfig()

    expect(mockGetConfiguration).toHaveBeenCalledWith('packageJsonScriptRunner')
    expect(config).toEqual({
      terminalReuseStrategy: 'per-package',
      clearTerminalBeforeReuse: true,
      maxTerminals: 10,
    })
  })

  it('should return user configuration when settings are provided', async () => {
    const { getTerminalConfig } = await import(
      '../../terminal/terminal-config.js'
    )
    const mockConfig = {
      get: vi.fn((key: string) => {
        const settings: Record<string, unknown> = {
          terminalReuseStrategy: 'single',
          clearTerminalBeforeReuse: false,
          maxTerminals: 5,
        }
        return settings[key]
      }),
    }
    mockGetConfiguration.mockReturnValue(mockConfig)

    const config = getTerminalConfig()

    expect(config).toEqual({
      terminalReuseStrategy: 'single',
      clearTerminalBeforeReuse: false,
      maxTerminals: 5,
    })
  })

  it('should use default values for missing configuration properties', async () => {
    const { getTerminalConfig } = await import(
      '../../terminal/terminal-config.js'
    )
    const mockConfig = {
      get: vi.fn((key: string, defaultValue?: unknown) => {
        const settings: Record<string, unknown> = {
          terminalReuseStrategy: 'per-workspace',
        }
        return settings[key] ?? defaultValue
      }),
    }
    mockGetConfiguration.mockReturnValue(mockConfig)

    const config = getTerminalConfig()

    expect(config).toEqual({
      terminalReuseStrategy: 'per-workspace',
      clearTerminalBeforeReuse: true,
      maxTerminals: 10,
    })
  })

  it('should handle invalid terminal reuse strategy by using default', async () => {
    const { getTerminalConfig } = await import(
      '../../terminal/terminal-config.js'
    )
    const mockConfig = {
      get: vi.fn((key: string, defaultValue?: unknown) => {
        if (key === 'terminalReuseStrategy') {
          return 'invalid-strategy'
        }
        return defaultValue
      }),
    }
    mockGetConfiguration.mockReturnValue(mockConfig)

    const config = getTerminalConfig()

    expect(config.terminalReuseStrategy).toBe('per-package')
  })
})
