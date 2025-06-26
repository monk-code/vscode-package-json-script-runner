# Project Setup Review

This review assesses the current state of the project setup based on the project goals and best practices.

## 1. Analysis

### 1.1. Directory Structure & Test Location

*   **Observation:** The `vitest.config.ts` is currently configured to find tests within the `src` directory (`include: ['src/**/*.spec.ts']`).
*   **Critique:** This mixes test code with source code. To maintain a clean separation of concerns, tests must be isolated in a dedicated top-level directory.
*   **Recommendation:** Tests must be located in a `__tests__` directory at the project root.

### 1.2. Import Paths

*   **Observation:** Neither `tsconfig.json` nor `vitest.config.ts` have path aliases configured.
*   **Critique:** This will lead to fragile and difficult-to-read relative imports (e.g., `import { util } from '../../core/utils'`). The project requires non-relative imports.
*   **Recommendation:** An alias (e.g., `#/*`) must be configured to map to the `src` directory, enabling absolute-like imports (e.g., `import { util } from '#/core/utils'`).

### 1.3. Programming Style

*   **Observation:** No source code has been written yet.
*   **Critique:** The project plan requires a specific programming paradigm. It is critical to establish this convention before implementation begins to ensure consistency.
*   **Recommendation:** The project must exclusively use a **Functional Programming (FP)** style. Object-Oriented Programming (OOP), including the use of `class`, is prohibited. All logic must be implemented with pure functions, composition, and immutable data structures where possible.

## 2. Plan for Remediation

To align the project with the required standards, the following actions will be taken:

1.  **Create `__tests__` Directory:** A new directory named `__tests__` will be created at the project root to house all test files.
2.  **Update `vitest.config.ts`:**
    *   The `test.include` path will be changed to `['__tests__/**/*.spec.ts']`.
    *   A `resolve.alias` will be added to map `#` to the `src` directory.
3.  **Update `tsconfig.json`:**
    *   A `baseUrl` of `.` and a `paths` property will be added to mirror the Vitest alias (`{ "#/*": ["src/*"] }`).
    *   The `__tests__` directory will be added to the `exclude` array to prevent TypeScript from trying to compile test files as source.

This remediation will establish a clean, scalable project structure and enforce the required coding conventions from the start.
