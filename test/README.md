# Test Fixtures

This directory contains test workspaces used for debugging and testing the VS Code Package JSON Script Runner extension with different package managers.

## Structure

```
test/
└── fixtures/
    ├── monorepo/          # Complex monorepo structure (original test-workspace)
    ├── npm-workspace/     # Simple NPM project with package-lock.json
    ├── yarn-workspace/    # Yarn workspace with yarn.lock
    └── pnpm-workspace/    # PNPM workspace with pnpm-lock.yaml
```

## Test Workspaces

### 1. Monorepo (`fixtures/monorepo`)
- **Purpose**: Tests the extension with a complex monorepo structure
- **Structure**: Multiple packages in `apps/`, `packages/`, and `tools/` directories
- **Package Manager**: Flexible (no lock file present)
- **Use Case**: Testing workspace discovery and script organization in large projects

### 2. NPM Workspace (`fixtures/npm-workspace`)
- **Purpose**: Tests package manager detection with NPM
- **Lock File**: `package-lock.json`
- **Structure**: Simple project with basic scripts
- **Use Case**: Testing NPM-specific command generation

### 3. Yarn Workspace (`fixtures/yarn-workspace`)
- **Purpose**: Tests Yarn workspaces functionality
- **Lock File**: `yarn.lock`
- **Structure**: Workspace with multiple packages
- **Config**: Uses `workspaces` field in package.json
- **Use Case**: Testing Yarn workspace commands and script discovery

### 4. PNPM Workspace (`fixtures/pnpm-workspace`)
- **Purpose**: Tests PNPM workspace functionality
- **Lock File**: `pnpm-lock.yaml`
- **Structure**: Workspace with multiple packages
- **Config**: Uses `pnpm-workspace.yaml`
- **Use Case**: Testing PNPM-specific commands and workspace features

## Debugging the Extension

To debug the extension with different package managers:

1. Open VS Code
2. Press `F5` or go to Run > Start Debugging
3. Select the appropriate launch configuration:
   - "Run Extension - Monorepo" for the complex monorepo
   - "Run Extension - NPM" for NPM projects
   - "Run Extension - Yarn" for Yarn workspaces
   - "Run Extension - PNPM" for PNPM workspaces

## Adding New Test Scenarios

To add a new test workspace:

1. Create a new directory under `test/fixtures/`
2. Add appropriate `package.json` file(s)
3. Include the relevant lock file for package manager detection
4. Add a new launch configuration in `.vscode/launch.json`
5. Update this README with the new workspace details

## Special Test Cases

The monorepo fixture includes several edge cases:
- `packages/no-scripts/`: Package without any scripts
- `packages/no-name/`: Package without a name field
- `packages/broken-package/`: For testing error handling
- `node_modules/some-package/`: To test node_modules exclusion