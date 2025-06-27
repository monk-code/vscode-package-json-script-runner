# VSCode Package JSON Script Runner

A powerful Visual Studio Code extension that simplifies running npm/yarn/pnpm scripts in monorepo environments with an intuitive fuzzy search interface.

## 🚀 Features

- **🔍 Fuzzy Search**: Quickly find and run any script from any package.json in your workspace
- **📦 Monorepo Support**: Automatically discovers all package.json files in your workspace, including nested packages
- **🎯 Smart Package Manager Detection**: Automatically uses the correct package manager (npm, yarn, or pnpm) based on lock files
- **⚡ Fast Navigation**: Use keyboard shortcut `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (macOS)
- **🖥️ Terminal Integration**: Creates properly named terminals with correct working directories

## 📥 Installation

### From VSCode Marketplace (Coming Soon)
1. Open VSCode Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`)
2. Search for "Package JSON Script Runner"
3. Click Install

### From Source
1. Clone this repository
2. Run `pnpm install`
3. Run `pnpm build`
4. Press `F5` in VSCode to test the extension

## 🎮 Usage

### Running Scripts

1. **Using Keyboard Shortcut**: Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (macOS)
2. **Using Command Palette**: 
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
   - Type "Run Package Script"
   - Press Enter

### The Script Picker

When activated, the extension will:
1. Scan your entire workspace for package.json files
2. Display all available scripts in a searchable list
3. Show package names and paths for easy identification
4. Allow fuzzy searching to quickly find the script you need

### Example Workflow

```
📁 my-monorepo/
├── 📄 package.json          # Root scripts
├── 📁 packages/
│   ├── 📁 frontend/
│   │   └── 📄 package.json  # Frontend scripts
│   └── 📁 backend/
│       └── 📄 package.json  # Backend scripts
└── 📁 apps/
    └── 📁 mobile/
        └── 📄 package.json  # Mobile app scripts
```

Press `Ctrl+Shift+R` and type "build" to see all build scripts across all packages:
- `build` (root)
- `build` (frontend)
- `build:prod` (backend)
- `build:ios` (mobile)

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

## 🐛 Troubleshooting

### Extension not activating
- Ensure you have built the extension: `pnpm build`
- Check the Output panel in VSCode for error messages

### Scripts not found
- Verify package.json files exist in your workspace
- Check that files are not in excluded directories (node_modules, .git)

### Wrong package manager used
- The extension detects package managers by lock files
- Ensure your lock files are committed (package-lock.json, yarn.lock, pnpm-lock.yaml)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- [GitHub Repository](https://github.com/bright-energy/vscode-package-json-script-runner)
- [Issue Tracker](https://github.com/bright-energy/vscode-package-json-script-runner/issues)
- [Visual Studio Code Extension API](https://code.visualstudio.com/api)

---

Made with ❤️ by Bright Energy