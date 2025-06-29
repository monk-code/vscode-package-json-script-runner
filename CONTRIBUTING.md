# Contributing to VSCode Package JSON Script Runner

We welcome contributions from the community! Please follow these guidelines to ensure a smooth development process.

## 🛠️ Development

### Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)
- Visual Studio Code

### Setup

```bash
# Clone the repository
git clone https://github.com/bright-energy/vscode-package-json-script-runner.git
cd vscode-package-json-script-runner

# Install dependencies
pnpm install

# Build the extension
pnpm build
```

### Available Scripts

```bash
# Build
pnpm build              # Compile TypeScript to JavaScript

# Testing
pnpm test               # Run tests once
pnpm test:watch         # Run tests in watch mode

# Code Quality
pnpm validate           # Run all checks (types, lint, format, tests)
pnpm types:check        # TypeScript type checking
pnpm lint               # Run linter
pnpm lint:fix           # Fix linting issues
pnpm format             # Check formatting
pnpm format:fix         # Fix formatting issues
```

### Testing the Extension Locally

1. **Open the project in VSCode**
   ```bash
   code vscode-package-json-script-runner
   ```

2. **Build the extension**
   ```bash
   pnpm build
   ```

3. **Start debugging**
   - Press `F5` or go to Run → Start Debugging
   - This will:
     - Compile the TypeScript code
     - Launch a new VSCode window (Extension Development Host)
     - Load your extension in this new window
     - Open the test-workspace folder automatically

4. **Test the extension**
   - In the Extension Development Host window:
     - Press `Ctrl+Shift+R` / `Cmd+Shift+R` to activate the extension
     - You should see scripts from the test-workspace packages
     - Select a script to run it

5. **Debug your code**
   - Set breakpoints in the source code (src/ folder)
   - The debugger will pause at breakpoints when you use the extension
   - Use the Debug Console to inspect variables

### Understanding the Debug Configuration

The `.vscode/launch.json` configuration:
- **"Run Extension"**: Launches the Extension Development Host
- **preLaunchTask**: Automatically builds the extension before debugging
- **args**: Opens the test-workspace folder for testing
- **outFiles**: Maps compiled JavaScript back to TypeScript for debugging

## 📁 Codebase Overview

### Project Structure

```
├── src/                      # Source code
│   ├── extension/           # Extension entry point and activation
│   ├── package-discovery/   # Logic for finding package.json files
│   ├── package-manager/     # Package manager detection (npm/yarn/pnpm)
│   ├── script-execution/    # Script execution and command generation
│   ├── script-quick-pick/   # UI for script selection
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── test-workspace/         # Sample monorepo for testing
├── __tests__/             # Test files
└── out/                   # Compiled JavaScript output
```

### Key Components

#### Extension Entry (`src/extension/extension.ts`)
- Registers the `runScript` command
- Coordinates the overall flow

#### Package Discovery (`src/package-discovery/`)
- Recursively finds all package.json files
- Excludes node_modules and hidden directories
- Returns package metadata

#### Script Quick Pick (`src/script-quick-pick/`)
- Creates the fuzzy-searchable UI
- Uses Fuse.js for intelligent search
- Formats items with package context

#### Script Execution (`src/script-execution/`)
- Detects the appropriate package manager
- Generates correct commands for monorepo contexts
- Manages VSCode terminal creation

### Architecture Decisions

1. **TypeScript with Strict Mode**: Ensures type safety and better IDE support
2. **Functional Approach**: Pure functions where possible, immutable data
3. **Modular Design**: Each component has a single responsibility
4. **Comprehensive Testing**: Unit tests for all business logic
5. **Modern ESM**: Uses ES modules for better tree-shaking and standards compliance

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository** and create your branch from `main`
2. **Write tests** for any new functionality
3. **Ensure all tests pass**: Run `pnpm validate`
4. **Follow the code style**: The project uses Biome for linting and formatting
5. **Update documentation** as needed
6. **Submit a Pull Request** with a clear description

### Code Style

- 2-space indentation
- Single quotes for strings
- No semicolons
- Functional programming patterns preferred
- All code must pass TypeScript strict mode
