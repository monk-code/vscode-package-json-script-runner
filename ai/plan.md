# Plan to Setup Husky with Pre-commit Hook and Best Practices

## 1. Goals
- **Business Goal**: Ensure code quality and consistency before commits reach the repository
- **Technical Goal**: Setup automated pre-commit validation using Husky, lint-staged, and additional development best practices

## 2. Context
**Current Setup**:
- Project uses pnpm as package manager
- Has validation script: `pnpm validate` (runs types:check, lint, format, test, build)
- Uses Biome for linting and formatting
- Uses Vitest for testing
- TypeScript with strict mode
- No existing git hooks or CI/CD setup

**CLAUDE.md Requirements**:
- Follow conventional commit format: type(scope): description
- No AI attributions in commits
- TDD is non-negotiable
- Code should be self-documenting

## 3. Implementation Plan

### Phase 1: Setup Husky and Pre-commit Hook
1. **Install Husky**
   - Add husky as dev dependency
   - Initialize husky with `pnpm exec husky init`
   - This creates `.husky` directory with git hooks
   - **Consider**: Document platform-specific setup requirements (Windows vs Unix file permissions)

2. **Create Pre-commit Hook**
   - Create `.husky/pre-commit` with validation script
   - Make it executable
   - **Requirement**: Implement clear, actionable error messages that guide developers on fixing failures
     - Example: "Linting failed. Run `pnpm lint:fix` to automatically resolve issues"
     - Example: "Type errors found. Run `pnpm types:check` to see detailed errors"
   - **Consider**: Include clear documentation about `--no-verify` flag usage policy for emergency bypasses

3. **Update .gitignore**
   - Ensure `.husky` is NOT ignored (it should be committed)

### Phase 2: Setup Lint-staged for Performance
1. **Install lint-staged**
   - Add lint-staged as dev dependency
   - Configure to run only on staged files for faster commits
   - **Important**: Document lint-staged's stash/unstash behavior
     - Lint-staged temporarily stashes unstaged changes before running
     - Runs checks on staged files in isolation
     - Unstashes changes after completion
   - **Performance**: Implement file count thresholds
     - Warning if commit involves >50 files
     - Consider running subset of checks for large commits

2. **Configure lint-staged**
   - Add configuration to package.json
   - Run biome format/lint only on staged TypeScript files
   - Run type checking on the whole project (required for TypeScript)
   - **Consider**: The potential confusion when staged files pass but project doesn't compile due to unstaged changes
   - **Quick Mode**: Add `pnpm quick-validate` script
     - Runs only essential, fast checks (linting, formatting)
     - Skips time-consuming tasks (full type-checking, tests)
     - Document use case for rapid iteration in development

### Phase 3: Add Commit Message Validation
1. **Install commitlint**
   - Add @commitlint/cli and @commitlint/config-conventional
   - Create commitlint configuration
   - **Custom Rule**: Add specific rule to prevent AI attributions
     - Block "Generated with Claude Code" messages
     - Block any AI attribution patterns
     - Enforce clean commit messages per CLAUDE.md

2. **Setup commit-msg Hook**
   - Create `.husky/commit-msg` hook
   - Validate commit messages follow conventional format
   - Ensure no AI attributions are included

### Phase 4: Additional Best Practices

1. **GitHub Actions CI/CD**
   - Create `.github/workflows/ci.yml`
   - Run validation on pull requests
   - Run tests on multiple Node versions
   - Cache pnpm dependencies for speed

2. **VS Code Settings**
   - Create `.vscode/settings.json` for consistent development
   - Enable format on save
   - Configure Biome as default formatter

3. **EditorConfig**
   - Create `.editorconfig` for cross-editor consistency
   - Define indentation, line endings, etc.
   - **Git Line Endings**: Provide guidance on git configuration
     - Document `git config core.autocrlf` settings
     - Document `git config core.eol` settings
     - Explain platform differences (Windows CRLF vs Unix LF)
     - Include troubleshooting for line ending issues

4. **Package Scripts Enhancement**
   - Add `prepare` script to auto-install husky
   - Add `ci` script for CI environments
   - Add `pretest` to ensure build before tests

5. **Development Documentation**
   - Create `CONTRIBUTING.md` with:
     - Setup instructions
     - Commit message guidelines
     - Development workflow
     - TDD requirements from CLAUDE.md
     - **Platform-Specific Instructions**: Step-by-step setup for Windows, macOS, Linux
       - File permission differences
       - Shell environment setup
       - Line ending configuration
     - **Comprehensive Troubleshooting Guide**:
       - "My hook failed, but I don't see any errors"
       - "How do I bypass a hook temporarily?"
       - "My editor is reformatting files differently than Biome"
       - Lint-staged behavior with unstaged changes
       - When to use `--no-verify` flag appropriately
     - **Quick Validation Mode**: Document `pnpm quick-validate` usage

### Phase 5: Future Enhancements (Optional)

1. **Pre-push Hook**
   - Consider adding for more extensive validation
   - Run full test suite before pushing
   - Include security scans
   - Run complete build process
   - Document as optional enhancement for teams needing extra validation

## 4. Files to Create/Modify

**New Files**:
- `.husky/pre-commit`
- `.husky/commit-msg`
- `.commitlintrc.json`
- `.github/workflows/ci.yml`
- `.vscode/settings.json`
- `.editorconfig`
- `CONTRIBUTING.md`

**Modified Files**:
- `package.json` (add deps, scripts, lint-staged config)
- `.gitignore` (ensure proper ignores)

## 5. Final Configuration

The pre-commit hook will run:
1. Biome format check on staged files
2. Biome lint on staged files
3. TypeScript type checking on whole project
4. Unit tests

**Performance Considerations**:
- Consider implementing conditional test execution based on changeset size
- Document expected execution times for typical commits
- Provide guidance on when full validation vs quick validation is appropriate

The commit-msg hook will:
1. Validate conventional commit format
2. Ensure no AI attributions

## 6. Validation
After implementation:
1. Test pre-commit hook with intentional failures
   - Verify actionable error messages are displayed
   - Confirm fix suggestions work correctly
2. Test commit message validation
   - Ensure AI attributions are blocked
   - Verify conventional format enforcement
3. Ensure CI runs on a test PR
4. Verify VS Code integration works
5. Test staged vs unstaged file scenarios
   - Confirm lint-staged stash/unstash behavior
   - Document any confusing edge cases
6. Verify platform compatibility (Windows/Mac/Linux)
   - Test file permissions on each platform
   - Verify line ending handling
7. Document and test recovery procedures when hooks fail
8. Test `pnpm quick-validate` for rapid iteration
9. Verify performance with large changesets (>50 files)