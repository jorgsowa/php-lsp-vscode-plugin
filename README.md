# PHP LSP — VS Code Extension

PHP language support for VS Code powered by [php-lsp](https://github.com/jorgsowa/php-lsp) — a high-performance Language Server written in Rust.

## What makes it different

php-lsp covers the full LSP 3.17 spec, things like call hierarchy and semantic tokens that a lot of PHP servers charge extra for or don't bother implementing. Diagnostics come from [`mir`](https://github.com/jorgsowa/mir), a separate static-analysis engine, so you can keep PHPStan or PHPCS running alongside it instead of tearing them out. It also understands Laravel: `env()`, `config()`, `view()`, translations, and named routes all jump to their actual definitions. And since it's built in Rust, it starts in milliseconds and barely touches memory.

## Features

- **Completions** — type-aware `->` / `::` chains, `match` enum-case, auto `use` insertion
- **Hover** — inline type and doc information
- **Go to definition / declaration / type definition**
- **Find references & rename**
- **Diagnostics** — undefined variables, functions, classes, arity errors, type errors, deprecated calls, missing types, mixed usage
- **Laravel** — string-key navigation and completion for `env()`, `config()`, `view()`, `__()`/`trans()`, and named routes
- **Call hierarchy & type hierarchy**
- **Semantic tokens, inlay hints, code lens**
- **Signature help & document highlight**
- **Code actions** — extract variable/method/constant/interface, inline variable, generate constructor/getters/setters, implement missing methods, organize imports, add/update PHPDoc, add return type, add missing `@throws` tags, change visibility, convert local variable to instance property, convert `switch` to `match`, convert between closures and arrow functions
- **Folding, selection range, on-type formatting, document links**

## Bundled versions

| Component | Version |
|---|---|
| Extension | [v0.7.0](https://github.com/jorgsowa/php-lsp-vscode-plugin/releases/tag/v0.7.0) |
| `php-lsp` | [v0.22.0](https://github.com/jorgsowa/php-lsp/releases/tag/v0.22.0) |

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
| `php-lsp.phpVersion` | `"8.3"` | PHP version for diagnostics and completions (`7.4`–`8.5`). |
| `php-lsp.excludePaths` | `[]` | Glob patterns to exclude from workspace indexing. |
| `php-lsp.maxIndexedFiles` | `50000` | Maximum number of files indexed during workspace scanning. |
| `php-lsp.diagnostics.enabled` | `true` | Master switch for all diagnostics. |
| `php-lsp.diagnostics.undefinedVariables` | `true` | Undefined variable references. |
| `php-lsp.diagnostics.undefinedFunctions` | `true` | Calls to undefined functions. |
| `php-lsp.diagnostics.undefinedClasses` | `true` | References to undefined classes, interfaces, or traits. |
| `php-lsp.diagnostics.arityErrors` | `true` | Wrong number of arguments. |
| `php-lsp.diagnostics.typeErrors` | `true` | Return-type mismatches. |
| `php-lsp.diagnostics.deprecatedCalls` | `true` | Calls to `@deprecated` members. |
| `php-lsp.diagnostics.duplicateDeclarations` | `true` | Duplicate class or function declarations. |
| `php-lsp.diagnostics.missingTypes` | `false` | Missing return, parameter, and property type declarations. |
| `php-lsp.diagnostics.mixedUsage` | `false` | Usages of mixed-typed values. |

## Commands

| Command | Description |
|---|---|
| `PHP LSP: Restart Server` | Restart the language server. |
| `PHP LSP: Show Output Channel` | Open the PHP LSP output log. |

## License

[MIT](LICENSE)
