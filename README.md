# PHP LSP — VS Code Extension

PHP language support for VS Code powered by [php-lsp](https://github.com/jorgsowa/php-lsp) — a high-performance Language Server written in Rust.

## Features

- **Completions** — type-aware `->` / `::` chains, `match` enum-case, auto `use` insertion
- **Hover** — inline type and doc information
- **Go to definition / declaration / type definition**
- **Find references & rename**
- **Diagnostics** — undefined variables, functions, classes, arity errors, type errors, deprecated calls
- **Call hierarchy & type hierarchy**
- **Semantic tokens, inlay hints, code lens**
- **Signature help & document highlight**
- **Code actions** — extract variable/method/constant, inline variable, generate constructor/getters/setters, implement missing methods, organize imports, add PHPDoc, add return type
- **Folding, selection range, on-type formatting, document links**

## Bundled versions

| Component | Version |
|---|---|
| `php-lsp` | [v0.1.53](https://github.com/jorgsowa/php-lsp/releases/tag/v0.1.53) |

## Requirements

The extension ships a pre-built `php-lsp` binary for your platform — no separate installation needed.

If you prefer to manage the binary yourself, install via Cargo:

```bash
cargo install php-lsp
```

Or download a pre-built binary from [php-lsp releases](https://github.com/jorgsowa/php-lsp/releases) and place it on your `PATH`.

## Extension Settings

| Setting | Default | Description |
|---|---|---|
| `php-lsp.serverPath` | `""` | Absolute path to the `php-lsp` binary. Leave empty to use the bundled binary, PATH, or auto-download. |
| `php-lsp.phpVersion` | `"8.3"` | PHP version for diagnostics and completions (`7.4`–`8.3`). |
| `php-lsp.excludePaths` | `[]` | Glob patterns to exclude from workspace indexing. |
| `php-lsp.diagnostics.enabled` | `true` | Master switch for all diagnostics. |
| `php-lsp.diagnostics.undefinedVariables` | `true` | Undefined variable references. |
| `php-lsp.diagnostics.undefinedFunctions` | `true` | Calls to undefined functions. |
| `php-lsp.diagnostics.undefinedClasses` | `true` | References to undefined classes, interfaces, or traits. |
| `php-lsp.diagnostics.arityErrors` | `true` | Wrong number of arguments. |
| `php-lsp.diagnostics.typeErrors` | `true` | Return-type mismatches. |
| `php-lsp.diagnostics.deprecatedCalls` | `true` | Calls to `@deprecated` members. |
| `php-lsp.diagnostics.duplicateDeclarations` | `true` | Duplicate class or function declarations. |

## Commands

| Command | Description |
|---|---|
| `PHP LSP: Restart Server` | Restart the language server. |
| `PHP LSP: Show Output Channel` | Open the PHP LSP output log. |

## License

[MIT](LICENSE)
