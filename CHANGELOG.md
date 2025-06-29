# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of VS Code Package.json Script Runner
- Fuzzy search for package.json scripts across monorepo workspaces
- Support for multiple package managers (npm, yarn, pnpm, bun)
- Terminal reuse strategies (new, per-package, per-workspace, single)
- Recent commands tracking with quick access
- Configurable settings for terminal behavior
- Keyboard shortcuts for quick script execution
- Search optimization with caching and debouncing
- Comprehensive test coverage

### Fixed
- Fixed negative test duration issue in timer-based tests

### Security
- No known security issues

## [1.0.0] - TBD

- Initial public release

[unreleased]: https://github.com/monk-code/vscode-package-json-script-runner/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/monk-code/vscode-package-json-script-runner/releases/tag/v1.0.0