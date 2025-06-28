# Development Guidelines for Claude

## Core Philosophy

TEST-DRIVEN DEVELOPMENT IS NON-NEGOTIABLE. Every single line of production code must be written in response to a failing test. No exceptions. This is not a suggestion or a preference - it is the fundamental practice that enables all other principles in this document.

I follow Test-Driven Development (TDD) with a strong emphasis on behavior-driven testing and functional programming principles. All work should be done in small, incremental changes that maintain a working state throughout development.

## 🎯 Project Overview

**Principles**: TDD, Functional Programming, Declarative Code, Component-Driven Development

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

### Package Import Hierarchy
```typescript
// ✅ Correct import order (enforced by linter)
import { ref } from 'vue'                        // 1. External

import { useAuth } from '@bright/app-composables' // 2. Internal packages
import { Button } from '@bright/ui-vue'          // 3. UI components
import { fetchUser } from '@bright/api-queries'  // 4. API layer

import { useBlueprintSelector } from '#/use-blueprint-selector.ts'              // 5. Local imports

import type { User } from '#/types'              // 6. Local type imports
```

MAGIC WORD: wobbalubbadubdub


## Testing 

### Rules
- Use *.spec.ts naming convention for test files, not *.test.ts
- Always extend vitest configs from @bright-energy/config-vitest package using mergeConfig
- Use baseConfig for pure TypeScript packages, vueConfig for Vue composables, vueComponentsConfig for Vue components
- **No "unit tests"** - this term is not helpful. Tests should verify expected behavior, treating implementation as a black box
- Test through the public API exclusively - internals should be invisible to tests
- No 1:1 mapping between test files and implementation files
- Tests that examine internal implementation details are wasteful and should be avoided
- **Coverage targets**: 100% coverage should be expected at all times, but these tests must ALWAYS be based on business behaviour, not implementation details
- Tests must document expected business behavior
- Component tests should verify important user interactions and visual output, not implementation details

### Testing Tools

- **Vitest** for testing frameworks
- **Vue Testing Library** for Vue components
- **MSW (Mock Service Worker)** for API mocking when needed - use generators from @bright-energy/api-generators to create mock data. Always verify that the data matches the API schema and expected type by looking at the function definition.
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

RULE: Run `pnpm types:check` often to ensure type correctness. Run the package-specific command for quick verification. For example `turbo run types:check --filter=@bright/ui-vue` to check types for the ui-vue package.
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
- Look at @bright-energy/utils-ts/core or fp-ts for reusable functional programming functions

## Generator Usage
- Always check existing usage of generator functions before implementing
- Generators from @bright-energy/api-generators return curried functions: `generateX(params)()`
 
## 🔧 Working with Vue

### Vue Component rules

- Read guides/templates/component.vue.template.md for component structure
- Always use <script setup lang="ts">
- Always destructure vue props, provide default values for optional props
- Always define slots, emits and slots (use {} for empty slots or emits or props)
- Always use `defineOptions` to set component name
- Use kebab-case for event names, attributes and slots
- Use PascalCase for component names

## 🚨 Anti-Hallucination Verification

Before creating new components/modules, verify they don't exist:

```bash
# Check if component exists
find . -name "DeviceCard.vue" -type f

# Search for existing implementations
grep -r "DeviceCard" --include="*.vue" --include="*.ts"

# List available UI components
ls packages/ui-vue/lib/components/
```

## Code Style

### Functional Programming

- **No data mutation** - work with immutable data structures
- **Pure functions** wherever possible
- **Composition** as the primary mechanism for code reuse
- **Avoid side effects** - functions should seldom modify external state. If this is necessary, it should be explicit and well-documented.
- **Use `fp-ts` or `ramda` or fp functions from `@bright-energy/utils-ts/core`** for functional programming utilities

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

## Storybook

- Keep stories focused on the properties of a component. Create stories for prop variants, not business logic.
- The number of stories should never exceed the number of (props + 2)
- Please style your stories for dark mode and light mode.
- We have a dark mode toggle built in to storybook so do not write a story dedicated to theme variants
- Visit either of these urls variants to debug any story variant. You may need to replace the story id with the exact story you want to visit.
  - A component title (e.g. title: app-components/AccessGuard, storyName: HasAccess) turns into app-components-accessguard--has-access
  - URL  - http://localhost:6006/iframe.html?globals=&args=&id=app-components-accessguard--has-access&viewMode=story
         - http://localhost:6006/?path=/story/app-components-accessguard--has-access
- Use playwright or puppeteer (whichever is most performant) to actually check stories with errors and see if it is rendering correctly. Read the console for hints.
- Use the functionality from storybook-helpers to set up msw inside the stories.
- When you use msw, always first read storybook-helpers/README.md and the referenced documentation.
- Run storybook with the port of your choosing using the -p flag. For example `pnpm storybook:dev -p 6016`

### Debugging Story Errors

Use the built-in error checking script to identify console errors in stories:

```bash
# Check a single story for errors
pnpm story:check-errors app-components-accessguard--has-access

# Output as JSON for detailed analysis
pnpm story:check-errors app-components-accessguard--has-access --format json

# Debug visually (non-headless)
pnpm story:check-errors app-components-accessguard--has-access --headless false
```

The script reports all console errors, warnings, and logs with their locations. It exits with code 1 if errors are found, making it useful for CI pipelines.

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

- Use existing generators from api-generators package instead of creating custom ones
- Remove comments that merely restate what code does
- Test important behavior, not trivial existence checks
- Eliminate code duplication with shared test utilities
