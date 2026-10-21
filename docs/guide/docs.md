---
title: Documentation
---

# Documentation

Marmotte provides first-class support for [VitePress](https://vitepress.dev) documentation with an API reference automatically generated from your JSDoc comments via [TypeDoc](https://typedoc.org).

## How it works

There are two complementary pieces:

1. **[`Docs`](/reference/api/vite/docs#docs)** — a Vite plugin (included in `Lib` by default) that scaffolds a VitePress site and embeds its dev server into your main Vite dev server.
2. **`TypeDocPlugin`** — a Vite (and Rolldown) plugin added to your main `vite.config.ts` that generates Markdown from your source files' JSDoc comments.

## Dev mode

When you run `vite dev`, the docs are served at `http://localhost:5173/docs/` alongside your main app — no separate terminal needed. TypeDoc also runs in watch mode, so the API reference stays up-to-date as you edit source files.

## Production build

When you run `vite build`, TypeDoc runs first, then VitePress is built automatically as part of the process.

## Default scaffolded files

The first time `Docs` runs it writes these files (only if they don't exist):

| File                             | Type    | Description                        |
| -------------------------------- | ------- | ---------------------------------- |
| `docs/index.md`                  | Default | Home page with hero section        |
| `docs/.vitepress/config.ts`      | Default | VitePress config with auto-sidebar |
| `docs/.vitepress/theme/index.ts` | Default | Theme with sidebar indentation CSS |
| `docs/.gitignore`                | Default | Ignores VitePress build artifacts  |

**Default files** are written once. Delete them to regenerate.

## Configuring the docs plugin

```ts
// vite.config.ts
import { Lib } from "@mrmt/vite/lib";

export default defineConfig({
  plugins: Lib({
    // Serve docs at a different path (must start and end with /)
    docs: { serve: "/documentation/" },

    // Or disable the docs plugin entirely
    docs: false,
  }),
});
```

If you're not using `Lib`, add `Docs` directly:

```ts
import { Docs } from "@mrmt/vite/docs";

export default defineConfig({
  plugins: [Docs()],
});
```

## Configuring TypeDoc

Add `TypeDocPlugin` to your main `vite.config.ts`:

```ts
// vite.config.ts
import TypeDoc from "@mrmt/unplugin-typedoc";

export default defineConfig({
  plugins: [
    TypeDoc({
      // Optional: override the source directory
      // (default: <docsRoot>/../src)
      sourceDir: "./src",

      // Mutate TypeDoc options before the app bootstraps
      onOptions(options) {
        options.exclude = ["**/internal/**"];
      },

      // Run custom logic after files are generated
      async onGenerated() {
        console.log("API docs generated!");
      },

      // Opt out of the automatic .gitignore written in the output dir
      gitignore: false,

      // Any other TypeDoc option is passed through
      excludePrivate: true,
    }),
  ],
});
```

Generated Markdown files land in `docs/reference/api/`. By default the plugin writes a `.gitignore` containing `*` inside that directory so the generated files are excluded from git automatically — no manual `.gitignore` entry needed.

### With `vp pack` / Rolldown

`@mrmt/unplugin-typedoc` is built with [unplugin](https://github.com/unjs/unplugin) and exports one plugin per bundler: `vite` (also the default export and `TypeDocPlugin`) and `rolldown`. Use the Rolldown one with `vp pack` (tsdown); it generates the API reference during the build and fails the build on TypeDoc errors:

```ts
// vite.config.ts
import { defineConfig } from "vite-plus";
import { rolldown as TypeDoc } from "@mrmt/unplugin-typedoc";

export default defineConfig({
  pack: {
    plugins: [TypeDoc({ out: "docs/api" })],
  },
});
```

Outside Vite the project root defaults to the current directory; pass `root` to change it.

## Sidebar and navigation

The default config uses [`generateSidebar`](/reference/api/vitepress-plugin-sidebar/sidebar) from `vitepress-sidebar` to build the sidebar automatically from the docs directory tree. No manual sidebar config needed.

```ts
import { generateSidebar } from "@mrmt/vitepress-plugin-sidebar";

const sidebar = generateSidebar({
  documentRootPath: "docs",
  collapsed: true,
  useFolderTitleFromIndexFile: true,
  useTitleFromFrontmatter: true,
});
```

## Writing JSDoc for the API reference

TypeDoc picks up standard JSDoc comments. A well-documented export looks like:

```ts
/**
 * Short one-line summary.
 *
 * Longer explanation if needed.
 *
 * @param options - describe the options object
 * @returns what is returned
 *
 * @example
 * myFunction({ foo: "bar" })
 */
export function myFunction(options: MyOptions) { … }
```

Use `{@link OtherThing}` for cross-references — TypeDoc resolves them to links in the generated Markdown.
