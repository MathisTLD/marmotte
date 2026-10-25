---
title: Getting Started
---

# Getting Started

Marmotte is an extensible development toolkit for TypeScript projects. It provides composable [Vite](https://vitejs.dev) plugins that handle the boring parts of project setup — bundling, type declarations, documentation, and testing — so you can focus on your actual code.

## Installation

Marmotte is a set of packages. Install only what you need:

```sh
npm install --save-dev @mrmt/vite          # library build plugins (Lib, Docs, dts)
npm install --save-dev @mrmt/unplugin-typedoc   # TypeDoc API reference plugin
npm install --save-dev @mrmt/vitepress-plugin-sidebar   # VitePress sidebar plugin
npm install --save-dev @mrmt/vite-ui       # Vue + Vuetify apps and libraries
npm install --save-dev @mrmt/vitest        # test helpers
npm install --save-dev @mrmt/tsconfig      # shared tsconfig bases
npm install --save-dev marmotte            # CLI and MCP server
```

Peer dependencies depend on which packages you use:

| Package         | Peer dependencies                                  |
| --------------- | -------------------------------------------------- |
| `@mrmt/vite`    | `vite`, `typescript`, `vitepress` (optional, docs) |
| `@mrmt/vite-ui` | `vite`, `vue-router`                               |
| `@mrmt/vitest`  | `vitest`                                           |

## What's included

| Import path                      | Purpose                                 |
| -------------------------------- | --------------------------------------- |
| `@mrmt/vite/lib`                 | Build a TypeScript library              |
| `@mrmt/vite-ui`                  | Build a Vue + Vuetify app or library    |
| `@mrmt/vite/docs`                | Embed VitePress docs in your dev server |
| `@mrmt/unplugin-typedoc`         | Auto-generate API reference from JSDoc  |
| `@mrmt/vitepress-plugin-sidebar` | Auto-generate VitePress sidebar         |
| `@mrmt/vitest`                   | Helpers for tests                       |

## Concepts

### Plugin composition

Functions exported from `@mrmt/vite/<plugin-name>` return a Vite `Plugin` or `Plugin[]`. You use them directly inside the `plugins` array of your `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import { Lib } from "@mrmt/vite/lib";

export default defineConfig({
  plugins: Lib(),
});
```

Higher-level plugins (`Lib`, `UILib`, `UIApp`) are pre-composed bundles of lower-level ones. You can always drop down to individual plugins when you need more control.

### Auto-managed vs default files

When the `Docs` plugin is active it writes two kinds of files into `docs/`:

- **Default files** (e.g. `docs/index.md`, `docs/.vitepress/config.ts`) — written once on first run. You are free to edit them; they won't be overwritten.
- **Auto-managed files** — always regenerated. Do not edit them. If you do, a `.backup` copy is created.

### Entry point discovery

`Lib` (and `LibConfig`) use `resolveEntries` to walk your `src/` directory and build a Rollup entry map automatically. Control which files become entries with a `RegExp` or predicate via the `entries` option.

## Next steps

- [Scaffold a project with the CLI →](../../packages/cli/docs/index.md)
- [Build a TypeScript library →](../../packages/vite/docs/lib.md)
- [Build a Vue app or library →](../../packages/vite-ui/docs/index.md)
- [Set up documentation →](../../packages/vite/docs/docs.md)
- [Testing utilities →](../../packages/vitest/docs/index.md)
- [AI integration (MCP server + programmatic API) →](../../packages/cli/docs/ai.md)
