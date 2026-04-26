# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-04-26

### Changed

- Bundled `php-lsp` v0.2.0 binaries.
- Semantic diagnostics are now **disabled by default** in `php-lsp` (upstream breaking change); enable them via `php-lsp.diagnostics.enabled`.
- Significant performance improvements in completion, references, hover, and workspace indexing.
- Configurable `maxIndexedFiles` limit (default 1 000) in the language server.

### Fixed

- `goto implementation` now correctly resolves FQN-aware use imports.
- References now found inside `switch`, `throw`, `unset`, and property defaults.
- Constructor refs, promoted-property refs, and trait method declarations in references.
- Namespace-prefix completion no longer duplicates a leading backslash.
- Token cache is now evicted on document close, preventing stale completions.

## [0.1.5] - 2026-04-15

### Changed

- Bundled `php-lsp` v0.1.54 binaries.

## [0.1.4] - 2026-04-12

### Changed

- Bundled `php-lsp` v0.1.53 binaries.
- Added bundled versions table to README.

## [0.1.3] - 2026-04-12

### Fixed

- `PHP LSP: Restart Server` command no longer reports an error when the server
  process has already died. `client.stop()` is now called with a 2-second
  timeout and any resulting error is caught, allowing the restart to proceed
  regardless of the server's prior state.

## [0.1.2] - 2025-04-10

### Changed

- Bundled all dependencies with esbuild to fix missing `vscode-languageclient`
  at runtime.

## [0.1.1] - 2025-04-09

### Added

- Extension icon and gallery banner.
- Platform-specific binary bundling in `.vsix` packages.

## [0.1.0] - 2025-04-08

### Added

- Initial release.
- PHP language server integration via `vscode-languageclient` over stdio.
- Auto-download of `php-lsp` binary on first use.
- `PHP LSP: Restart Server` and `PHP LSP: Show Output Channel` commands.
- Configurable diagnostics, PHP version, and exclude paths.
