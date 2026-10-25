---
title: Documentation plugin
---

# Documentation plugin

`Docs` gives a package a [VitePress](https://vitepress.dev) site, embedded in your Vite dev server and built with your library. The API reference comes from the TypeDoc plugin ([`@mrmt/unplugin-typedoc`](../../unplugin-typedoc/docs/index.md)), the sidebar from [`@mrmt/vitepress-plugin-sidebar`](../../vitepress-plugin-sidebar/docs/index.md).

## How it works

There are two complementary pieces:

1. **[`Docs`](./api/docs.md#docs)** — a Vite plugin (included in `Lib` by default) that scaffolds a VitePress site and embeds its dev server into your main Vite dev server.
2. **`TypeDocPlugin`** — a Vite (and Rolldown) plugin, from [`@mrmt/unplugin-typedoc`](../../unplugin-typedoc/docs/index.md), added to your main `vite.config.ts` that generates Markdown from your source files' JSDoc comments (included in `Lib` by default).

## Dev mode

When you run `vite dev`, the docs are served at `http://localhost:5173/docs/` alongside your main app — no separate terminal needed. TypeDoc (see above) also runs in watch mode, so the API reference stays up-to-date as you edit source files.

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
