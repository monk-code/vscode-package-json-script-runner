# Actionable Item: VS Code Marketplace Release Best Practices

## Description

Here is a checklist to guide your release process:

### Preparation

- [ ] **Create a Publisher Account**: If you don't have one, create a publisher account on the [VS Code Marketplace](https://marketplace.visualstudio.com/manage).
- [ ] **Install `vsce`**: Install the official CLI tool for publishing extensions: `pnpm install -g @vscode/vsce`.
- [ ] **Finalize `package.json`**: Implement the high-priority recommendations above. Ensure `name`, `publisher`, `version`, and `repository` are correct.
- [ ] **Create a `.vscodeignore` file**: Similar to `.gitignore`, this file prevents unnecessary files from being included in your extension package, reducing its size. At a minimum, it should include:
    ```
    .vscode/**
    .github/**
    node_modules/**
    src/**
    test/**
    .editorconfig
    .gitignore
    *.md
    !README.md
    !LICENSE
    *.ts
    *.mjs
    *.json
    !package.json
    pnpm-lock.yaml
    ```
    *(Note: `vsce` has some default ignores, but being explicit is good practice)*.

### Packaging & Publishing

1.  **Package the Extension**: Run `vsce package` to create a `.vsix` file. This is the file that gets installed in VS Code. You can use this for final local testing by installing it from the command line (`code --install-extension <file>.vsix`).
2.  **Login to your Publisher**: Run `vsce login <publisher-name>`. You will need a Personal Access Token (PAT) from your Azure DevOps organization.
3.  **Publish**: Run `vsce publish`. If you only want to package and not publish, use `vsce package`.

### Post-Release

*   **Semantic Versioning**: Use semantic versioning (`major.minor.patch`) to signal the nature of your updates. Use `vsce publish minor` or `vsce publish major` to increment the version automatically.
*   **Engage with Users**: Monitor your GitHub issues and Marketplace page for feedback and bug reports.
*   **Add a `CHANGELOG.md`**: For future releases, maintain a `CHANGELOG.md` to document changes between versions.
