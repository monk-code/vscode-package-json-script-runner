#!/usr/bin/env node

import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import chalk from 'chalk'
import ora from 'ora'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const projectRoot = join(__dirname, '..')

const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const showHelp = args.includes('--help') || args.includes('-h')

if (showHelp) {
  console.log(`
${chalk.bold('prepare-release')} - Prepare VS Code extension for release

${chalk.yellow('Usage:')}
  node scripts/prepare-release.mjs [options]

${chalk.yellow('Options:')}
  --dry-run    Show what would be done without actually doing it
  --help, -h   Show this help message

${chalk.yellow('Description:')}
  This script prepares the VS Code extension for release by:
  1. Checking for uncommitted changes
  2. Validating package.json fields
  3. Running the test suite
  4. Creating a packaged .vsix file
  `)
  process.exit(0)
}

const runCommand = (command, description) => {
  if (isDryRun) {
    console.log(chalk.gray(`[DRY RUN] Would run: ${command}`))
    return ''
  }

  const spinner = ora(description).start()
  try {
    const output = execSync(command, { 
      cwd: projectRoot, 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    })
    spinner.succeed()
    return output
  } catch (error) {
    spinner.fail()
    console.error(chalk.red(`Command failed: ${command}`))
    console.error(error.message)
    process.exit(1)
  }
}

const checkGitStatus = () => {
  const status = runCommand('git status --porcelain', 'Checking for uncommitted changes')
  
  if (status && status.trim()) {
    console.error(chalk.red('\n✗ You have uncommitted changes:'))
    console.error(status)
    console.error(chalk.yellow('\nPlease commit or stash your changes before releasing.'))
    if (!isDryRun) process.exit(1)
  } else {
    console.log(chalk.green('✓ Working directory is clean'))
  }
}

const validatePackageJson = () => {
  const spinner = ora('Validating package.json').start()
  
  try {
    const packageJsonPath = join(projectRoot, 'package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
    
    const requiredFields = ['name', 'publisher', 'version', 'repository', 'engines']
    const missingFields = requiredFields.filter(field => !packageJson[field])
    
    if (missingFields.length > 0) {
      spinner.fail()
      console.error(chalk.red(`\n✗ Missing required fields in package.json: ${missingFields.join(', ')}`))
      if (!isDryRun) process.exit(1)
    } else {
      spinner.succeed()
    }
  } catch (error) {
    spinner.fail()
    console.error(chalk.red('Failed to read or parse package.json'))
    if (!isDryRun) process.exit(1)
  }
}

const main = async () => {
  console.log(chalk.bold.blue('\n🚀 Preparing VS Code Extension for Release\n'))
  
  // Step 1: Check git status
  checkGitStatus()
  
  // Step 2: Validate package.json
  validatePackageJson()
  
  // Step 3: Run validation
  runCommand('pnpm validate', 'Running validation suite')
  
  // Step 4: Package extension
  if (!isDryRun) {
    runCommand('pnpm package', 'Creating extension package')
    
    // Check if .vsix was created
    const files = execSync('ls -la *.vsix', { 
      cwd: projectRoot, 
      encoding: 'utf8' 
    }).trim()
    
    console.log(chalk.green('\n✅ Extension packaged successfully:'))
    console.log(files)
    console.log(chalk.yellow('\nNext steps:'))
    console.log('  1. Test the .vsix file locally: code --install-extension <file>.vsix')
    console.log('  2. Update CHANGELOG.md with release notes')
    console.log('  3. Publish with: pnpm publish:[patch|minor|major]')
  } else {
    console.log(chalk.gray('\n[DRY RUN] Would package the extension'))
  }
}

main().catch(error => {
  console.error(chalk.red('Unexpected error:'), error)
  process.exit(1)
})