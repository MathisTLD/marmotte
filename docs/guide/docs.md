---
title: Documentation
---

# Documentation

Marmotte provides first-class support for [VitePress](https://vitepress.dev) documentation with an API reference automatically generated from your JSDoc comments via [TypeDoc](https://typedoc.org).

## How it works

There are two complementary pieces:

1. **[`Docs`](/reference/api/vite/docs#docs)** — a Vite plugin (included in `Lib` by default) that scaffolds a VitePress site and embeds its dev server into your main Vite dev server.
2. **[`TypeDocPlugin`](/reference/api/vitepress/typedoc#typedocplugin)** — a Vite plugin used *inside the VitePress config* that generates Markdown from your source files' JSDoc comments.

## Dev mode

When you run `vite dev`, the docs are served at `http://localhost:5173/docs/` alongside your main app — no separate terminal needed.

## Production build

When you run `vite build`, VitePress is built automatically as part of the process.

## Default scaffolded files

The first time `Docs` runs it writes these files (only if they don't exist):

| File | Type | Description |
|---|---|---|
| `docs/index.md` | Default | Home page with hero section |
| `docs/.vitepress/config.ts` | Default | VitePress config with TypeDoc and auto-sidebar |
| `docs/.vitepress/theme/index.ts` | Default | Theme with sidebar indentation CSS |
| `docs/.gitignore` | Default | Ignores build artifacts and generated API reference |

**Default files** are written once. Delete them to regenerate.

## Configuring the docs plugin

```ts
// vite.config.ts
import { Lib } from "marmotte/vite/lib"

export default defineConfig({
  plugins: Lib({
    // Serve docs at a different path (must start and end with /)
    docs: { serve: "/documentation/" },

    // Or disable the docs plugin entirely
    docs: false,
  }),
})
```

If you're not using `Lib`, add `Docs` directly:

```ts
import { Docs } from "marmotte/vite/docs"

export default defineConfig({
  plugins: [Docs()],
})
```

## Configuring TypeDoc

The generated `docs/.vitepress/config.ts` includes `TypeDocPlugin` in its `vite.plugins`:

```ts
// docs/.vitepress/config.ts
import TypeDoc from "marmotte/vitepress/typedoc"

export default defineConfig({
  vite: {
    plugins: [
      TypeDoc({
        // Optional: override the source directory
        // (default: <docsRoot>/../src)
        sourceDir: "./src",

        // Mutate TypeDoc options before the app bootstraps
        onOptions(options) {
          options.exclude = ["**/internal/**"]
        },

        // Run custom logic after files are generated
        async onGenerated() {
          console.log("API docs generated!")
        },

        // Any other TypeDoc option is passed through
        excludePrivate: true,
      }),
    ],
  },
})
```

Generated Markdown files land in `docs/reference/api/` and are ignored by git (see the generated `.gitignore`).

## Sidebar and navigation

The default config uses [`generateSidebar`](/reference/api/vitepress/sidebar) from `vitepress-sidebar` to build the sidebar automatically from the docs directory tree. No manual sidebar config needed.

```ts
import { generateSidebar } from "marmotte/vitepress/sidebar"

const sidebar = generateSidebar({
  documentRootPath: "docs",
  collapsed: true,
  useFolderTitleFromIndexFile: true,
  useTitleFromFrontmatter: true,
})
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
