# Release Guide for VS Code Package.json Script Runner

This guide provides step-by-step instructions for releasing the VS Code Package.json Script Runner extension to the Visual Studio Code Marketplace.

## Prerequisites

### One-Time Setup

1. **Publisher Account**: Ensure you have a publisher account on the [VS Code Marketplace](https://marketplace.visualstudio.com/manage)

2. **Personal Access Token (PAT)**: Create a PAT in Azure DevOps
   - Go to [Azure DevOps](https://dev.azure.com)
   - Click on User Settings (gear icon) → Personal Access Tokens
   - Create a new token with "Marketplace (Publish)" scope
   - Save this token securely - you'll need it for publishing

3. **Install vsce**: The VS Code Extension CLI tool
   ```bash
   pnpm install -g @vscode/vsce
   ```

4. **Login to Publisher**: Authenticate with your publisher account
   ```bash
   vsce login monkcode
   # Enter your PAT when prompted
   ```

## Release Process

### 1. Pre-Release Checklist

Before starting the release process, ensure:

- [ ] All features for this release are complete and tested
- [ ] All tests are passing: `pnpm test`
- [ ] Code quality checks pass: `pnpm validate`
- [ ] No TypeScript errors: `pnpm types:check`
- [ ] Code is properly formatted: `pnpm format`
- [ ] No linting issues: `pnpm lint`
- [ ] You're on the `main` branch: `git checkout main`
- [ ] Your branch is up to date: `git pull origin main`

### 2. Update Documentation

1. **Update CHANGELOG.md**
   - Add a new section for the upcoming version
   - Document all changes, improvements, and fixes
   - Follow the format of existing entries
   - Use semantic versioning guidelines:
     - **MAJOR**: Breaking changes
     - **MINOR**: New features (backwards compatible)
     - **PATCH**: Bug fixes and minor improvements

2. **Update README.md** (if needed)
   - Update any documentation that reflects new features
   - Update screenshots if UI has changed
   - Ensure all examples are current

### 3. Prepare for Release

Run the automated prepare-release script:

```bash
pnpm prepare-release
```

This script will:
- Check for uncommitted changes
- Validate required fields in `package.json`
- Run the full validation suite (tests, lint, type checks)
- Create a packaged `.vsix` file for testing

If you want to see what the script will do without executing:
```bash
pnpm prepare-release --dry-run
```

### 4. Test the Package Locally

Before publishing, test the packaged extension:

```bash
# Install the generated .vsix file
code --install-extension vscode-package-json-script-runner-*.vsix

# Test the extension functionality:
# 1. Open VS Code in a project with package.json files
# 2. Press Cmd+Alt+R (Mac) or Ctrl+Alt+R (Windows/Linux)
# 3. Verify the script picker appears and works correctly
# 4. Test running scripts from different packages
# 5. Test the "Run Last Script" command (Cmd+Alt+L / Ctrl+Alt+L)

# Uninstall the test version when done
code --uninstall-extension monkcode.vscode-package-json-script-runner
```

### 5. Commit Changes

If you made any documentation updates:

```bash
git add .
git commit -m "docs: update CHANGELOG for v<version>"
```

### 6. Publish to Marketplace

Choose the appropriate version bump based on your changes:

```bash
# For bug fixes and minor improvements
pnpm publish:patch

# For new features (backwards compatible)
pnpm publish:minor

# For breaking changes
pnpm publish:major
```

The publish command will:
1. Increment the version in `package.json`
2. Create a git commit for the version bump
3. Create a git tag for the release
4. Build and publish the extension to the VS Code Marketplace

**Note**: The `--no-dependencies` flag is automatically included because this project uses pnpm.

### 7. Post-Release Tasks

1. **Push Changes to GitHub**
   ```bash
   git push origin main
   git push origin --tags
   ```

2. **Create GitHub Release**
   - Go to the [Releases page](https://github.com/monk-code/vscode-package-json-script-runner/releases)
   - Click "Create a new release"
   - Select the tag that was just created
   - Use the CHANGELOG entry as the release description
   - Attach the `.vsix` file as a release asset

3. **Verify Marketplace Listing**
   - Visit your [extension page](https://marketplace.visualstudio.com/items?itemName=monkcode.vscode-package-json-script-runner)
   - Verify the new version is displayed
   - Check that all information is correct

4. **Monitor for Issues**
   - Watch the GitHub issues for any problems reported by users
   - Monitor the extension ratings and reviews on the marketplace

## Troubleshooting

### Common Issues

1. **"Git working directory not clean" error**
   - Ensure all changes are committed: `git status`
   - Stash uncommitted changes: `git stash`

2. **"Invalid category" error**
   - The extension uses only the "Other" category
   - This has been fixed in the package.json

3. **npm dependency errors with vsce**
   - The publish scripts include `--no-dependencies` to handle pnpm compatibility
   - If issues persist, ensure you're using the npm scripts, not running vsce directly

4. **Authentication failures**
   - Your PAT may have expired - create a new one
   - Ensure your PAT has "Marketplace (Publish)" scope
   - Re-login with `vsce login monkcode`

### Manual Publishing (Emergency Only)

If the automated scripts fail, you can publish manually:

```bash
# 1. Ensure working directory is clean
git status

# 2. Build the extension
pnpm build

# 3. Package the extension
vsce package --no-dependencies

# 4. Publish with version bump
vsce publish [patch|minor|major] --no-dependencies
```

## Version Guidelines

Follow semantic versioning (MAJOR.MINOR.PATCH):

- **PATCH** (x.x.1): Bug fixes, typos, small improvements
- **MINOR** (x.1.0): New features, significant improvements, backwards compatible
- **MAJOR** (1.0.0): Breaking changes, major rewrites, incompatible API changes

## Additional Resources

- [VS Code Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [Azure DevOps PAT Documentation](https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate)
