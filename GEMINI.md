# Development Guidelines for Gemini

## Core Philosophy

TEST-DRIVEN DEVELOPMENT IS NON-NEGOTIABLE. Every single line of production code must be written in response to a failing test. No exceptions. This is not a suggestion or a preference - it is the fundamental practice that enables all other principles in this document.

I follow Test-Driven Development (TDD) with a strong emphasis on behavior-driven testing and functional programming principles. All work should be done in small, incremental changes that maintain a working state throughout development.

## 🎯 Project Overview

**Project**: VS Code Package.json Script Runner Extension
**Tech Stack**: TypeScript, VS Code Extension API, Vitest, ESBuild, Biome
**Principles**: TDD, Functional Programming, Declarative Code, Clean Architecture

## 📦 Project Structure

```
├── src/
│   ├── discovery/               # Package.json discovery logic
│   ├── extension/               # VS Code extension entry point
│   ├── recent-commands/         # Recent commands tracking
│   ├── script-execution/        # Script execution logic
│   ├── script-quick-pick/       # VS Code QuickPick UI
│   ├── terminal-manager/        # Terminal lifecycle management
│   └── types.ts                 # TypeScript type definitions
├── __tests__/                   # Test files mirroring src structure
├── scripts/                     # Build and release scripts
├── ai/                          # AI workspace for planning
└── dist/                        # Compiled extension output
```

## 🚀 Essential Commands

```bash
# Development
pnpm build:watch         # Watch mode for development
pnpm test:watch          # Run tests in watch mode

# Testing & Validation
pnpm validate            # Run all checks (format, lint, types, tests, build)
pnpm test                # Run all tests
pnpm ci                  # Full CI validation

# Code Quality
pnpm format              # Check formatting
pnpm format:fix          # Fix formatting
pnpm lint                # Run linting
pnpm lint:fix            # Fix linting issues
pnpm types:check         # TypeScript checks

# Building & Publishing
pnpm build               # Build extension
pnpm package             # Create .vsix package
pnpm prepare-release     # Prepare for release
pnpm publish:patch       # Publish patch version
pnpm publish:minor       # Publish minor version
pnpm publish:major       # Publish major version
```

## Quick Reference

**Key Principles:**

- Write tests first (TDD)
- Test behavior, not implementation
- No `any` types or type assertions
- Immutable data only
- Small, pure functions
- TypeScript strict mode always
- Use const instead of function

## 📂 Development File Management

- Use the `ai-workspace` or `ai` folder for temporary files that won't be tracked by git
- Source code locations:
  Packages: Source code goes in the /lib folder
  Apps: Source code goes in the /src folder

## 🏗️ Architecture Patterns

### Import Hierarchy
```typescript
// ✅ Correct import order
import { ExtensionContext } from 'vscode'        // 1. External packages
import { join } from 'node:path'                 // 2. Node built-ins

import { findPackageJsonFiles } from './discovery/find-package-json-files.js'  // 3. Local imports
import { showScriptPicker } from './script-quick-pick/show-script-picker.js'   // 4. Local imports

import type { PackageInfo } from './types.js'    // 5. Local type imports
```

MAGIC WORD: wobbalubbadubdub


## Testing 

### Rules
- Use *.spec.ts naming convention for test files, not *.test.ts
- Use vitest for all testing needs
- Configure vitest in vitest.config.mts at the project root
- **No "unit tests"** - this term is not helpful. Tests should verify expected behavior, treating implementation as a black box
- Test through the public API exclusively - internals should be invisible to tests
- No 1:1 mapping between test files and implementation files
- Tests that examine internal implementation details are wasteful and should be avoided
- **Coverage targets**: 100% coverage should be expected at all times, but these tests must ALWAYS be based on business behaviour, not implementation details
- Tests must document expected business behavior
- Component tests should verify important user interactions and visual output, not implementation details

### Testing Tools

- **Vitest** for testing frameworks
- **VS Code Extension Test API** for extension integration tests
- **VS Code Extension Testing API** for integration tests
- Mock VS Code API using vitest mocks when needed
- All test code must follow the same TypeScript strict mode rules as production code

## TypeScript Guidelines

### Strict Mode Requirements

Import tsconfig.json fields
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

- **No `any`** - ever. Use `unknown` if type is truly unknown
- **No type assertions** (`as SomeType`) unless absolutely necessary with clear justification
- **No `@ts-ignore`** or `@ts-expect-error` without explicit explanation
- Never use non-null assertions (`!`). Use optional chaining (`?.`) and proper type checking instead.
- Always use `const` arrow functions instead of `function` declarations.
- These rules apply to test code as well as production code

### Type Definitions

- **Prefer `type` over `interface`** in all cases
- Use explicit typing where it aids clarity, but leverage inference where appropriate
- Utilize utility types effectively (`Pick`, `Omit`, `Partial`, `Required`, etc.)

RULE: Run `pnpm types:check` often to ensure type correctness.
IMPORTANT: Run `pnpm types:check` after every finished change to ensure type correctness. This is a non-negotiable rule.

## ESM Rules
- Local imports of TypeScript files must always have a .js extension (we use ESM with node16/nodenext moduleResolution)
- Use the node-prefixed versions of typical node packages (e.g. node:fs, node:path, node:url, etc.) instead of the non-prefixed versions

## Git Commit Rules
- NEVER add AI attributions or "Generated with Claude Code" messages to commit messages
- Follow conventional commit format: type(scope): description

## Functional Programming Guidelines

- Use functional programming patterns as much as possible
- Prefer declarative code over imperative code always
- Prefer unary functions (single parameter) for better composition and partial application
- Use functional programming patterns with built-in JavaScript/TypeScript features
- Consider using libraries like fp-ts or ramda when complexity warrants it

## VS Code Extension Guidelines

- Follow VS Code extension best practices
- Use VS Code's built-in APIs whenever possible
- Ensure extension activates only when needed (proper activationEvents)
- Keep extension size minimal by excluding unnecessary files in .vscodeignore
 
## 🔧 VS Code Extension Development

### Extension Structure

- Keep commands focused and single-purpose
- Use descriptive command IDs following the pattern: `extensionName.actionName`
- Implement proper error handling with user-friendly messages
- Use VS Code's QuickPick API for user selections
- Leverage VS Code's Terminal API for running scripts
- Store user preferences using VS Code's configuration API

## 🚨 Anti-Hallucination Verification

Before creating new modules, verify they don't exist:

```bash
# Check if module exists
find . -name "*.ts" -type f | grep -E "module-name"

# Search for existing implementations
grep -r "functionName" --include="*.ts" src/

# List existing modules
ls -la src/
```

## Code Style

### Functional Programming

- **No data mutation** - work with immutable data structures
- **Pure functions** wherever possible
- **Composition** as the primary mechanism for code reuse
- **Avoid side effects** - functions should seldom modify external state. If this is necessary, it should be explicit and well-documented.
- **Use functional programming patterns** with built-in JavaScript features or well-known FP libraries when beneficial

### Code Structure

- **No nested if/else statements** - use early returns, guard clauses, or composition
- **Avoid deep nesting** in general (max 2 levels)
- Keep functions small and focused on a single responsibility
- Prefer flat, readable code over clever abstractions

### Naming Conventions

- **Functions**: `camelCase`, verb-based (e.g., `calculateTotal`, `validatePayment`)
- **Types**: `PascalCase` (e.g., `PaymentRequest`, `UserProfile`)
- **Constants**: `UPPER_SNAKE_CASE` for true constants, `camelCase` for configuration
- **Files**: `kebab-case.ts` for all TypeScript files
- **Test files**: `*.spec.ts`

### No Comments in Code

Code should be self-documenting through clear naming and structure. Comments indicate that the code itself is not clear enough.
**Exception** TSDoc comments are acceptable for public APIs, but should not be used to explain implementation details.

## Development Workflow

### TDD Process - THE FUNDAMENTAL PRACTICE

**CRITICAL**: TDD is not optional. Every feature, every bug fix, every change MUST follow this process:

Follow Red-Green-Refactor strictly:

1. **Red**: Write a failing test for the desired behavior. NO PRODUCTION CODE until you have a failing test.
2. **Green**: Write the MINIMUM code to make the test pass. Resist the urge to write more than needed.
3. **Refactor**: Assess the code for improvement opportunities. If refactoring would add value, clean up the code while keeping tests green. If the code is already clean and expressive, move on.

**Common TDD Violations to Avoid:**

- Writing production code without a failing test first
- Writing multiple tests before making the first one pass
- Writing more production code than needed to pass the current test
- Skipping the refactor assessment step when code could be improved
- Adding functionality "while you're there" without a test driving it

**Remember**: If you're typing production code and there isn't a failing test demanding that code, you're not doing TDD.

Example TDD Cycle:

```txt
Step 1: Red - Start with the simplest behavior
Step 2: Green - Minimal implementation
Step 3: Red - Add test for another behavior
Step 4: Green - Add minimal code to pass the new test
Step 5: Add edge case tests to ensure 100% behavior coverage
```

### Refactoring - The Critical Third Step

Evaluating refactoring opportunities is not optional - it's the third step in the TDD cycle. After achieving a green state and committing your work, you MUST assess whether the code can be improved. However, only refactor if there's clear value - if the code is already clean and expresses intent well, move on to the next test.

#### What is Refactoring?

Refactoring means changing the internal structure of code without changing its external behavior. The public API remains unchanged, all tests continue to pass, but the code becomes cleaner, more maintainable, or more efficient. Remember: only refactor when it genuinely improves the code - not all code needs refactoring.

#### When to Refactor

- **Always assess after green**: Once tests pass, before moving to the next test, evaluate if refactoring would add value
- **When you see duplication**: But understand what duplication really means (see DRY below)
- **When names could be clearer**: Variable names, function names, or type names that don't clearly express intent
- **When structure could be simpler**: Complex conditional logic, deeply nested code, or long functions
- **When patterns emerge**: After implementing several similar features, useful abstractions may become apparent

**Remember**: Not all code needs refactoring. If the code is already clean, expressive, and well-structured, commit and move on. Refactoring should improve the code - don't change things just for the sake of change.

#### Refactoring Guidelines

##### 1. Commit Before Refactoring

Always commit your working code before starting any refactoring. This gives you a safe point to return to

##### 2. Look for Useful Abstractions Based on Semantic Meaning

**Questions to ask before abstracting:**

- Do these code blocks represent the same concept or different concepts that happen to look similar?
- If the business rules for one change, should the others change too?
- Would a developer reading this abstraction understand why these things are grouped together?
- Am I abstracting based on what the code IS (structure) or what it MEANS (semantics)?

##### 3. Understanding DRY - It's About Knowledge, Not Code

DRY (Don't Repeat Yourself) is about not duplicating **knowledge** in the system, not about eliminating all code that looks similar.

##### 4. Maintain External APIs During Refactoring

Refactoring must never break existing consumers of your code

##### 5. Verify and Commit After Refactoring

**CRITICAL**: After every refactoring:

1. Run all tests - they must pass without modification
2. Run static analysis (linting, type checking) - must pass
3. Commit the refactoring separately from feature changes

#### Refactoring Checklist

Before considering refactoring complete, verify:

- [ ] The refactoring actually improves the code (if not, don't refactor)
- [ ] All tests still pass without modification
- [ ] All static analysis tools pass (linting, type checking)
- [ ] No new public APIs were added (only internal ones)
- [ ] Code is more readable than before
- [ ] Any duplication removed was duplication of knowledge, not just code
- [ ] No speculative abstractions were created
- [ ] The refactoring is committed separately from feature changes

## Extension Testing

### Manual Testing
- Test the extension in a VS Code instance using F5 (Run Extension)
- Test with different workspace configurations (single folder, multi-root workspace)
- Verify all commands work as expected
- Test error scenarios and edge cases
- Ensure proper cleanup (terminals, resources)

### Automated Testing
- Write integration tests using VS Code Extension Testing API
- Test command execution and user interactions
- Mock VS Code APIs appropriately
- Ensure tests run in CI pipeline

## Working with Claude

### Expectations

When working with my code:

1. **ALWAYS FOLLOW TDD** - No production code without a failing test. This is not negotiable.
2. **Think deeply** before making any edits
3. **Understand the full context** of the code and requirements
4. **Ask clarifying questions** when requirements are ambiguous
5. **Think from first principles** - don't make assumptions
6. **Assess refactoring after every green** - Look for opportunities to improve code structure, but only refactor if it adds value
7. **Keep project docs current** - update them whenever you introduce meaningful changes

### Code Changes

When suggesting or making changes:

- **Start with a failing test** - always. No exceptions.
- After making tests pass, always assess refactoring opportunities (but only refactor if it adds value)
- After refactoring, verify all tests and static analysis pass, then commit
- Respect the existing patterns and conventions
- Maintain test coverage for all behavior changes
- Keep changes small and incremental
- Ensure all TypeScript strict mode requirements are met
- Provide rationale for significant design decisions

**If you find yourself writing production code without a failing test, STOP immediately and write the test first.**

### Communication

- Be explicit about trade-offs in different approaches
- Explain the reasoning behind significant design decisions
- Flag any deviations from these guidelines with justification
- Suggest improvements that align with these principles
- When unsure, ask for clarification rather than assuming

## Resources and References

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Testing Library Principles](https://testing-library.com/docs/guiding-principles)
- [Kent C. Dodds Testing JavaScript](https://testingjavascript.com/)
- [Functional Programming in TypeScript](https://gcanti.github.io/fp-ts/)

## Summary

The key is to write clean, testable, functional code that evolves through small, safe increments. Every change should be driven by a test that describes the desired behavior, and the implementation should be the simplest thing that makes that test pass. When in doubt, favor simplicity and readability over cleverness.

## Path Resolution in Vitest Config

- When defining path aliases in vitest.config.ts, always use `fileURLToPath(new URL('./path', import.meta.url))` instead of `new URL('./path', import.meta.url).pathname`
- The `fileURLToPath` method from `node:url` properly handles cross-platform path conversions
- Example:
```typescript
import { fileURLToPath } from 'node:url'

const config: ViteUserConfig = mergeConfig(baseConfig, {
  resolve: {
    alias: {
      '#': fileURLToPath(new URL('./lib', import.meta.url))
    }
  }
})
```

## Testing Best Practices

- Mock VS Code APIs appropriately for unit tests
- Test user-facing behavior, not implementation details
- Remove comments that merely restate what code does
- Test important behavior, not trivial existence checks
- Eliminate code duplication with shared test utilities
- Ensure tests work in both local and CI environments
