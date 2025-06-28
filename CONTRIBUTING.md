# Contributing to VS Code Package.json Script Runner

Thank you for your interest in contributing! This guide will help you get started with development.

## 📋 Table of Contents

- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Code Quality Standards](#code-quality-standards)
- [Git Hooks and Automation](#git-hooks-and-automation)
- [Platform-Specific Instructions](#platform-specific-instructions)
- [Troubleshooting](#troubleshooting)
- [Quick Validation Mode](#quick-validation-mode)

## 🚀 Development Setup

### Prerequisites

- Node.js 20.x or 22.x
- pnpm 10.4.1 (automatically installed via corepack if not present)
- Git
- VS Code (for extension development)

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/bright-energy/vscode-package-json-script-runner.git
   cd vscode-package-json-script-runner
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Verify setup**
   ```bash
   pnpm validate
   ```

Git hooks will be automatically installed via Husky during the installation process.

## 🔄 Development Workflow

### Core Principles

This project follows **Test-Driven Development (TDD)**. This is non-negotiable:

1. **RED**: Write a failing test for the desired behavior
2. **GREEN**: Write the minimum code to make the test pass
3. **REFACTOR**: Improve the code while keeping tests green

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm test` | Run tests once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm types:check` | Check TypeScript types |
| `pnpm lint` | Check linting issues |
| `pnpm lint:fix` | Auto-fix linting issues |
| `pnpm format` | Check formatting |
| `pnpm format:fix` | Auto-fix formatting |
| `pnpm build` | Build the extension |
| `pnpm validate` | Run full validation suite |
| `pnpm quick-validate` | Run only lint and format (fast) |

### Development Flow

1. Create a new branch for your feature/fix
2. Write tests first (TDD)
3. Implement the feature
4. Run `pnpm validate` to ensure everything passes
5. Commit your changes (hooks will validate automatically)
6. Push and create a pull request

## 📝 Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format
```
type(scope): description

[optional body]

[optional footer(s)]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions or updates
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Other maintenance tasks
- `revert`: Revert a previous commit

### Examples
```bash
feat(script-runner): add support for yarn workspaces
fix(search): correct fuzzy search scoring algorithm
docs: update API documentation
test(picker): add tests for edge cases
```

### Important Rules
- **NO AI ATTRIBUTION**: Never include "Generated with Claude" or similar messages
- Keep the subject line under 72 characters
- Use present tense ("add" not "added")
- Reference issues when applicable

## 🔧 Code Quality Standards

### TypeScript
- Strict mode is enforced
- No `any` types
- No type assertions without justification
- Use `const` arrow functions

### Testing
- 100% behavior coverage expected
- Use `*.spec.ts` naming convention
- Test behavior, not implementation
- No testing of internal details

### Code Style
- Self-documenting code (minimal comments)
- Small, focused functions
- Immutable data patterns
- Early returns over nested conditionals

## 🪝 Git Hooks and Automation

### Pre-commit Hook

The pre-commit hook runs automatically and performs:

1. **Lint-staged** on staged files
   - Formats TypeScript files
   - Runs linting with auto-fix
   
2. **Type checking** on the entire project
   
3. **Tests** to ensure nothing is broken

**Note**: Lint-staged temporarily stashes unstaged changes while running. If you see unexpected behavior, check your unstaged changes.

### Commit-msg Hook

Validates commit messages against conventional commit format and blocks AI attributions.

### Bypassing Hooks (Emergency Only)

```bash
git commit --no-verify
```

⚠️ Use sparingly and ensure code quality before pushing!

## 💻 Platform-Specific Instructions

### Windows

1. **Line Endings Configuration**
   ```bash
   git config core.autocrlf true
   ```

2. **File Permissions**
   - Husky hooks should work automatically
   - If issues occur, run Git Bash as administrator

### macOS / Linux

1. **Line Endings Configuration**
   ```bash
   git config core.autocrlf input
   ```

2. **File Permissions**
   - Hooks are automatically made executable
   - No additional setup required

### All Platforms

Configure Git to handle line endings consistently:
```bash
git config core.eol lf
```

## 🔍 Troubleshooting

### "My hook failed, but I don't see any errors"

Run the validation manually to see detailed output:
```bash
pnpm validate
```

### "How do I bypass a hook temporarily?"

Use `--no-verify` flag:
```bash
git commit --no-verify -m "WIP: temporary commit"
```

### "My editor is reformatting files differently than Biome"

1. Install the Biome extension for VS Code
2. Ensure VS Code settings use Biome as default formatter
3. Check `.vscode/settings.json` is applied

### "Lint-staged behavior with unstaged changes"

Lint-staged stashes unstaged changes before running. This means:
- Only staged changes are validated
- Unstaged changes are temporarily hidden
- After completion, unstaged changes are restored

If type checking fails due to unstaged changes, you'll need to either:
- Stage all related changes
- Fix type errors in unstaged files

### "When to use --no-verify flag appropriately"

Use `--no-verify` only when:
- Making WIP commits on a feature branch
- Committing incomplete work before switching contexts
- Emergency hotfixes where full validation would delay critical fixes

Never use for:
- Commits to main branch
- Final commits before PR
- "Fixing" validation errors by skipping them

## ⚡ Quick Validation Mode

For rapid iteration during development:

```bash
pnpm quick-validate
```

This runs only:
- Linting
- Formatting

Use this when:
- Making frequent small changes
- Iterating on code style
- You've already run full validation recently

Always run full validation before committing:
```bash
pnpm validate
```

## 📊 Performance Considerations

### Large Commits

If committing more than 50 files, the pre-commit hook will warn you. Consider:
- Breaking into smaller, logical commits
- Using `pnpm quick-validate` for initial checks
- Running full validation separately

### Expected Execution Times

- Quick validation: ~5 seconds
- Full validation: ~30 seconds
- Pre-commit hook: ~20 seconds (depends on staged files)

## 🤝 Getting Help

- Check existing issues on GitHub
- Read the [CLAUDE.md](./CLAUDE.md) for detailed development guidelines
- Ask questions in pull requests or issues

Remember: Quality over speed. Take time to write tests, refactor when needed, and maintain code standards.