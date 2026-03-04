---
title: CLI
---

# CLI

The `marmotte` CLI scaffolds new projects and adds tooling to existing ones. Every command works in two modes:

- **Interactive** — prompts guide you through each choice.
- **Non-interactive** — pass flags to skip prompts entirely, useful in CI or scripts.

## Installation

The CLI is included when you install marmotte:

```sh
npm install --save-dev marmotte
npx marmotte --help
```

Or install globally:

```sh
npm install -g marmotte
marmotte --help
```

---

## `marmotte create [dir]`

Scaffold a new project from a template.

```sh
marmotte create [dir] [options]
```

### Options

| Flag | Description |
|------|-------------|
| `-t, --template <id>` | Template ID or remote source. Skips the template prompt and enables non-interactive mode. |
| `-n, --name <name>` | Project name written into `package.json`. Defaults to the directory basename. |
| `--no-examples` | Omit example source files (built-in templates only). |
| `-f, --features <ids...>` | Space-separated feature IDs to apply. Skips the feature prompt. |

### Built-in templates

| ID | Description |
|----|-------------|
| `node-library` | TypeScript library with `Lib()`, DTS, and docs |
| `ui-library` | Vue 3 + Vuetify component library with `UILib()` |
| `ui-app` | Vue 3 + Vuetify SPA with routing and `UIApp()` |

Custom templates are also supported — pass a git source or local path as the template value:

```sh
# GitHub shorthand
marmotte create ./my-app -t user/my-template

# giget sources
marmotte create ./my-app -t github:user/repo
marmotte create ./my-app -t gitlab:user/repo

# Local path
marmotte create ./my-app -t ./path/to/template
```

### Examples

```sh
# Fully interactive
marmotte create

# Specify directory, prompt for the rest
marmotte create ./my-lib

# Non-interactive: built-in template, no examples
marmotte create ./my-lib --template node-library --name my-lib --no-examples

# Non-interactive with features
marmotte create ./my-app -t ui-app -n my-app -f lint format
```

---

## `marmotte setup [dir]`

Add tooling features to an existing project. Reads `package.json`, patches it with the selected features, and runs `npm install`.

```sh
marmotte setup [dir] [options]
```

### Options

| Flag | Description |
|------|-------------|
| `-f, --features <ids...>` | Space-separated feature IDs to apply. Skips the feature prompt. |

### Available features

| ID | What it adds |
|----|-------------|
| `lint` | [oxlint](https://oxc.rs/docs/guide/usage/linter) — `lint` and `lint:fix` scripts |
| `format` | [oxfmt](https://github.com/nicolo-ribaudo/oxfmt) — `fmt` and `fmt:check` scripts |
| `pre-commit` | [husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged) pre-commit hook |
| `changesets` | [@changesets/cli](https://github.com/changesets/changesets) — `changeset`, `version`, and `release` scripts |

### Examples

```sh
# Fully interactive
marmotte setup

# Non-interactive: apply lint and format to an existing project
marmotte setup -f lint format

# Target a specific directory
marmotte setup ./packages/my-lib -f lint format pre-commit
```
