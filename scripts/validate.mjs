import ora from 'ora'
import chalk from 'chalk'
import { spawn } from 'node:child_process'

const EXECUTION_GROUPS = [
  {
    concurrent: true,
    steps: [
      { name: 'Type checking', command: 'pnpm', args: ['types:check'] },
      { name: 'Linting', command: 'pnpm', args: ['lint'] },
      { name: 'Formatting', command: 'pnpm', args: ['format'] },
    ],
  },
  {
    concurrent: false,
    steps: [
      { name: 'Testing', command: 'pnpm', args: ['test'] },
      { name: 'Building', command: 'pnpm', args: ['build'] },
    ],
  },
]

const captureStream = (stream) => {
  let output = ''
  stream.on('data', (data) => {
    output += data.toString()
  })
  return () => output
}

const handleCommandExit = (code, spinner, step, getStderr, startTime) => {
  const duration = Date.now() - startTime
  const timeStr = chalk.gray(`(${duration}ms)`)
  
  if (code === 0) {
    spinner.succeed(chalk.green(`${step.name} ${timeStr}`))
  } else {
    spinner.fail(chalk.red(`${step.name} ${timeStr}`))
    const stderr = getStderr()
    if (stderr) {
      console.error(chalk.red(stderr))
    }
  }
}

const executeCommand = async (step, spinner) => {
  const startTime = Date.now()
  const child = spawn(step.command, step.args, {
    stdio: ['inherit', 'pipe', 'pipe'],
  })
  
  const getStderr = captureStream(child.stderr)
  
  return new Promise((resolve) => {
    child.on('exit', (code) => {
      handleCommandExit(code, spinner, step, getStderr, startTime)
      resolve(code)
    })
  })
}

const createStepExecutor = (step, stepNumber, totalSteps) => {
  const progressText = `[${stepNumber}/${totalSteps}] ${step.name}`
  const spinner = ora(progressText).start()
  return executeCommand(step, spinner)
}

const runConcurrentSteps = async (steps, startNumber, totalSteps) => {
  const promises = steps.map((step, index) => 
    createStepExecutor(step, startNumber + index, totalSteps)
  )
  const results = await Promise.all(promises)
  return results.some((code) => code !== 0)
}

const runSequentialSteps = async (steps, startNumber, totalSteps) => {
  for (let i = 0; i < steps.length; i++) {
    const exitCode = await createStepExecutor(steps[i], startNumber + i, totalSteps)
    if (exitCode !== 0) {
      return true // has failure
    }
  }
  return false // no failure
}

export const runValidation = async () => {
  const startTime = Date.now()
  let hasFailure = false
  
  // Calculate total steps
  const totalSteps = EXECUTION_GROUPS.reduce((acc, group) => acc + group.steps.length, 0)
  let currentStepNumber = 1
  
  for (const group of EXECUTION_GROUPS) {
    if (group.concurrent) {
      hasFailure = await runConcurrentSteps(group.steps, currentStepNumber, totalSteps)
    } else {
      hasFailure = await runSequentialSteps(group.steps, currentStepNumber, totalSteps)
    }
    
    currentStepNumber += group.steps.length
    
    if (hasFailure) {
      process.exitCode = 1
      break
    }
  }
  
  // Display summary
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log() // Empty line for spacing
  
  if (hasFailure) {
    console.log(chalk.red('✗ Validation failed'))
  } else {
    console.log(chalk.green('✓ All validations passed'))
  }
  
  console.log(chalk.gray(`Total time: ${totalTime}s`))
  
  return hasFailure
}

// Auto-run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runValidation()
}