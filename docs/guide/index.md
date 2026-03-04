---
title: Getting Started
---

# Getting Started

Marmotte is an extensible development toolkit for TypeScript projects. It provides composable [Vite](https://vitejs.dev) plugins that handle the boring parts of project setup — bundling, type declarations, documentation, and testing — so you can focus on your actual code.

## Installation

```sh
npm install --save-dev marmotte
```

Marmotte has optional peer dependencies depending on which plugins you use:

| Feature           | Peer dependency      |
| ----------------- | -------------------- |
| All plugins       | `vite`, `typescript` |
| Documentation     | `vitepress`          |
| Testing utilities | `vitest`             |
| Vue routing       | `vue-router`         |

## What's included

| Import path                  | Purpose                                 |
| ---------------------------- | --------------------------------------- |
| `marmotte/vite/lib`          | Build a TypeScript library              |
| `marmotte/vite/ui`           | Build a Vue + Vuetify app or library    |
| `marmotte/vite/docs`         | Embed VitePress docs in your dev server |
| `marmotte/vite/typedoc`      | Auto-generate API reference from JSDoc  |
| `marmotte/vitepress/sidebar` | Auto-generate VitePress sidebar         |
| `marmotte/vitest`            | Helpers for tests                       |

## Concepts

### Plugin composition

Functions exported from `marmotte/vite/<plugin-name>` return a Vite `Plugin` or `Plugin[]`. You use them directly inside the `plugins` array of your `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import { Lib } from "marmotte/vite/lib";

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

`Lib` (and `LibConfig`) use [`resolveEntries`](/reference/api/utils/fs) to walk your `src/` directory and build a Rollup entry map automatically. Control which files become entries with a `RegExp` or predicate via the `entries` option.

## Next steps

- [Build a TypeScript library →](./lib)
- [Build a Vue app or library →](./ui)
- [Set up documentation →](./docs)
- [Testing utilities →](./vitest)
