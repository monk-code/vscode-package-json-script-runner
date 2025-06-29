# VSCode Package JSON Script Runner

A powerful Visual Studio Code extension that simplifies running npm/yarn/pnpm scripts in monorepo environments with an intuitive fuzzy search interface.

## 🚀 Features

- **🔍 Fuzzy Search**: Quickly find and run any script from any package.json in your workspace.
- **📦 Monorepo Support**: Automatically discovers all package.json files in your workspace, including nested packages.
- **🎯 Smart Package Manager Detection**: Automatically uses the correct package manager (npm, yarn, or pnpm) based on lock files.
- **⚡ Fast Navigation**: Use keyboard shortcut `Ctrl+Alt+R` (Windows/Linux) or `Cmd+Alt+R` (macOS).
- **🔄 Recent Commands**: Press `Ctrl+Alt+L` (Windows/Linux) or `Cmd+Alt+L` (macOS) to instantly run your last used script.
- **🖥️ Terminal Integration**: Creates properly named terminals with correct working directories.

## 🎮 Usage

### Running Scripts

1. **Open Script Picker**: Press `Ctrl+Alt+R` (Windows/Linux) or `Cmd+Alt+R` (macOS) to search and run any script.
2. **Run Last Script**: Press `Ctrl+Alt+L` (Windows/Linux) or `Cmd+Alt+L` (macOS) to instantly run your most recent script.
3. **Using Command Palette**:
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS).
   - Type "Run Package Script" or "Run Last Package Script".
   - Press Enter.

### The Script Picker

When activated, the extension will:
1. Scan your entire workspace for package.json files.
2. Display all available scripts in a searchable list.
3. Show package names and paths for easy identification.
4. Allow fuzzy searching to quickly find the script you need.

### Example Workflow

Imagine a monorepo structure like this:

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

## 🤝 Contributing

Interested in contributing? We'd love your help! Please see our [**Contributing Guidelines**](CONTRIBUTING.md) for more details on how to get started.

## 🐛 Troubleshooting

### Extension not activating
- Check the Output panel in VSCode for any error messages.

### Scripts not found
- Verify that your `package.json` files are present in the workspace.
- Ensure that the files are not located in excluded directories (e.g., `node_modules`, `.git`).

### Wrong package manager used
- The extension detects the package manager based on 1) the "packageManager" field in `package.json` and 2) the lock file (`package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml`).
- Make sure your lock files are committed to your repository or you have the "packageManager" field defined.

### Keyboard Shortcuts
- **Why different shortcuts?** We use `Ctrl+Alt+R` for the script picker and `Ctrl+Alt+L` for running the last script to avoid VS Code's chord keybinding limitations. This ensures both commands work instantly without delays.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [GitHub Repository](https://github.com/bright-energy/vscode-package-json-script-runner)
- [Issue Tracker](https://github.com/bright-energy/vscode-package-json-script-runner/issues)
- [Visual Studio Code Extension API](https://code.visualstudio.com/api)

---

Made with ❤️ by monkcode
