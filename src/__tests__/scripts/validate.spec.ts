import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { join } from 'node:path'

const scriptPath = join(process.cwd(), 'scripts/validate.mjs')

describe('validate script', () => {
  let mockSpawn: ReturnType<typeof vi.fn>
  let mockOra: ReturnType<typeof vi.fn>
  let mockChalk: {
    green: ReturnType<typeof vi.fn>
    red: ReturnType<typeof vi.fn>
    gray: ReturnType<typeof vi.fn>
  }
  let mockSpinner: {
    start: ReturnType<typeof vi.fn>
    succeed: ReturnType<typeof vi.fn>
    fail: ReturnType<typeof vi.fn>
  }
  let mockChildProcess: {
    on: ReturnType<typeof vi.fn>
    stdout: { on: ReturnType<typeof vi.fn> }
    stderr: { on: ReturnType<typeof vi.fn> }
  }
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    // Create mocks
    mockSpinner = {
      start: vi.fn().mockReturnThis(),
      succeed: vi.fn().mockReturnThis(),
      fail: vi.fn().mockReturnThis(),
    }

    mockOra = vi.fn(() => mockSpinner)

    mockChalk = {
      green: vi.fn((text) => text),
      red: vi.fn((text) => text),
      gray: vi.fn((text) => text),
    }

    // Create a more complete mock child process
    mockChildProcess = {
      on: vi.fn(),
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
    }

    mockSpawn = vi.fn(() => mockChildProcess)

    // Mock modules
    vi.doMock('node:child_process', () => ({ spawn: mockSpawn }))
    vi.doMock('ora', () => ({ default: mockOra }))
    vi.doMock('chalk', () => ({ default: mockChalk }))

    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should load required dependencies', async () => {
    await import(scriptPath)

    expect(mockOra).toBeDefined()
    expect(mockChalk).toBeDefined()
  })

  it('should execute a single command with spinner feedback', async () => {
    // Setup child process to emit exit immediately
    mockChildProcess.on.mockImplementation((event, callback) => {
      if (event === 'exit') {
        setImmediate(() => callback(0))
      }
    })

    const module = await import(scriptPath)
    await module.runValidation()

    expect(mockOra).toHaveBeenCalledWith('[1/5] Type checking')
    expect(mockSpinner.start).toHaveBeenCalled()
    expect(mockSpinner.succeed).toHaveBeenCalled()
    expect(mockSpawn).toHaveBeenCalledWith(
      'pnpm',
      ['types:check'],
      expect.any(Object)
    )
  })

  it('should capture and display stderr on command failure', async () => {
    const errorMessage = 'Type error: foo is not defined'
    let callCount = 0

    // Track which process we're creating
    mockSpawn.mockImplementation(() => {
      const isFirstCall = callCount === 0
      callCount++

      const childProcess = {
        on: vi.fn((event, callback) => {
          if (event === 'exit') {
            setImmediate(() => {
              // Only first process fails
              callback(isFirstCall ? 1 : 0)
            })
          }
        }),
        stdout: { on: vi.fn() },
        stderr: {
          on: vi.fn((event, callback) => {
            if (event === 'data' && isFirstCall) {
              // Only emit stderr for first process
              setImmediate(() => callback(Buffer.from(errorMessage)))
            }
          }),
        },
      }
      return childProcess
    })

    const module = await import(scriptPath)
    await module.runValidation()

    expect(mockSpinner.fail).toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalledWith(mockChalk.red(errorMessage))
  })

  it('should run all validation steps sequentially', async () => {
    // Mock spawn to create new process for each call
    mockSpawn.mockImplementation(() => {
      const childProcess = {
        on: vi.fn((event, callback) => {
          if (event === 'exit') {
            // Emit exit immediately for each process
            setImmediate(() => callback(0))
          }
        }),
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
      }
      return childProcess
    })

    const module = await import(scriptPath)
    await module.runValidation()

    const expectedSteps = [
      ['pnpm', ['types:check']],
      ['pnpm', ['lint']],
      ['pnpm', ['format']],
      ['pnpm', ['test']],
      ['pnpm', ['build']],
    ]

    expect(mockSpawn).toHaveBeenCalledTimes(5)
    expectedSteps.forEach((step, index) => {
      expect(mockSpawn).toHaveBeenNthCalledWith(
        index + 1,
        step[0],
        step[1],
        expect.any(Object)
      )
    })
    expect(mockOra).toHaveBeenCalledTimes(5)
    expect(mockSpinner.succeed).toHaveBeenCalledTimes(5)
  })

  it('should stop on first failure', async () => {
    let processCount = 0

    // Mock spawn to track processes
    mockSpawn.mockImplementation(() => {
      const currentProcess = processCount++

      const childProcess = {
        on: vi.fn((event, callback) => {
          if (event === 'exit') {
            setImmediate(() => {
              // First process of concurrent group fails
              callback(currentProcess === 0 ? 1 : 0)
            })
          }
        }),
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
      }
      return childProcess
    })

    const module = await import(scriptPath)
    await module.runValidation()

    // Should spawn the first concurrent group (3 processes)
    // but not proceed to sequential group due to failure
    expect(mockSpawn).toHaveBeenCalledTimes(3)
    expect(mockSpinner.fail).toHaveBeenCalledTimes(1)
  })

  it('should set process exit code on failure', async () => {
    const originalExitCode = process.exitCode

    // Setup child process to fail immediately
    mockChildProcess.on.mockImplementation((event, callback) => {
      if (event === 'exit') {
        setImmediate(() => callback(1))
      }
    })

    const module = await import(scriptPath)
    await module.runValidation()

    expect(process.exitCode).toBe(1)
    process.exitCode = originalExitCode
  })

  it('should not set process exit code on success', async () => {
    const originalExitCode = process.exitCode

    // Mock spawn to create successful processes
    mockSpawn.mockImplementation(() => {
      const childProcess = {
        on: vi.fn((event, callback) => {
          if (event === 'exit') {
            setImmediate(() => callback(0))
          }
        }),
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
      }
      return childProcess
    })

    const module = await import(scriptPath)
    await module.runValidation()

    expect(process.exitCode).toBe(originalExitCode)
  })

  it('should use ora built-in indicators for successful steps', async () => {
    // Setup child process to succeed
    mockChildProcess.on.mockImplementation((event, callback) => {
      if (event === 'exit') {
        setImmediate(() => callback(0))
      }
    })

    const module = await import(scriptPath)
    await module.runValidation()

    // Ora should be called with step name and timing
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      expect.stringMatching(/Type checking.*\(\d+ms\)/)
    )
    expect(mockChalk.green).toHaveBeenCalledWith(
      expect.stringMatching(/Type checking.*\(\d+ms\)/)
    )
  })

  it('should track and display execution time for each step', async () => {
    // Setup child process to succeed with delay
    mockChildProcess.on.mockImplementation((event, callback) => {
      if (event === 'exit') {
        setTimeout(() => callback(0), 100) // 100ms delay
      }
    })

    const module = await import(scriptPath)
    await module.runValidation()

    // Should call succeed with timing information
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      expect.stringMatching(/Type checking.*\(\d+ms\)/)
    )
  })

  it('should use ora built-in indicators for failed steps', async () => {
    // Setup child process to fail
    mockChildProcess.on.mockImplementation((event, callback) => {
      if (event === 'exit') {
        setImmediate(() => callback(1))
      }
    })

    const module = await import(scriptPath)
    await module.runValidation()

    // Ora should be called with step name and timing
    expect(mockSpinner.fail).toHaveBeenCalledWith(
      expect.stringMatching(/Type checking.*\(\d+ms\)/)
    )
    expect(mockChalk.red).toHaveBeenCalledWith(
      expect.stringMatching(/Type checking.*\(\d+ms\)/)
    )
  })

  it('should display progress indicators with step counters', async () => {
    // Setup child process to succeed
    mockChildProcess.on.mockImplementation((event, callback) => {
      if (event === 'exit') {
        setImmediate(() => callback(0))
      }
    })

    const module = await import(scriptPath)
    await module.runValidation()

    // Should show progress like "[1/5] Type checking"
    expect(mockOra).toHaveBeenCalledWith('[1/5] Type checking')
    expect(mockOra).toHaveBeenCalledWith('[2/5] Linting')
    expect(mockOra).toHaveBeenCalledWith('[3/5] Formatting')
    expect(mockOra).toHaveBeenCalledWith('[4/5] Testing')
    expect(mockOra).toHaveBeenCalledWith('[5/5] Building')
  })

  it('should display a summary with statistics at the end', async () => {
    const originalLog = console.log
    const logSpy = vi.fn()
    console.log = logSpy

    try {
      // Setup all processes to succeed
      mockSpawn.mockImplementation(() => {
        const childProcess = {
          on: vi.fn((event, callback) => {
            if (event === 'exit') {
              setImmediate(() => callback(0))
            }
          }),
          stdout: { on: vi.fn() },
          stderr: { on: vi.fn() },
        }
        return childProcess
      })

      const module = await import(scriptPath)
      await module.runValidation()

      // Should display summary at the end
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('✓ All validations passed')
      )
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Total time: \d+(\.\d+)?s/)
      )
    } finally {
      console.log = originalLog
    }
  })

  it('should display error summary when some steps fail', async () => {
    const originalLog = console.log
    const logSpy = vi.fn()
    console.log = logSpy

    try {
      let callCount = 0
      // Setup first process to fail
      mockSpawn.mockImplementation(() => {
        const isFirstCall = callCount === 0
        callCount++

        const childProcess = {
          on: vi.fn((event, callback) => {
            if (event === 'exit') {
              setImmediate(() => callback(isFirstCall ? 1 : 0))
            }
          }),
          stdout: { on: vi.fn() },
          stderr: { on: vi.fn() },
        }
        return childProcess
      })

      const module = await import(scriptPath)
      await module.runValidation()

      // Should display error summary
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('✗ Validation failed')
      )
    } finally {
      console.log = originalLog
    }
  })

  it('should run type checking, linting, and formatting concurrently', async () => {
    const spawnOrder: string[] = []
    let resolveValidation: () => void

    // Track spawn order
    mockSpawn.mockImplementation((_command, args) => {
      const scriptName = args[0]
      spawnOrder.push(scriptName)

      const childProcess = {
        on: vi.fn((event, callback) => {
          if (event === 'exit') {
            // Simulate immediate success
            setImmediate(() => {
              callback(0)
              // Resolve after all commands have been processed
              if (spawnOrder.length === 5) {
                resolveValidation?.()
              }
            })
          }
        }),
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
      }
      return childProcess
    })

    const module = await import(scriptPath)

    // Run validation and wait for completion
    await Promise.all([
      module.runValidation(),
      new Promise<void>((resolve) => {
        resolveValidation = resolve
      }),
    ])

    // First three commands should be spawned immediately (concurrent)
    expect(spawnOrder.slice(0, 3).sort()).toEqual([
      'format',
      'lint',
      'types:check',
    ])

    // Then test and build should run sequentially
    expect(spawnOrder.slice(3)).toEqual(['test', 'build'])

    // All 5 commands should have been spawned
    expect(mockSpawn).toHaveBeenCalledTimes(5)
  })
})
