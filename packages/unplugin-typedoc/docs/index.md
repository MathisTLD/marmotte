---
title: TypeDoc plugin
---

# TypeDoc plugin

`@mrmt/unplugin-typedoc` generates an API reference as [VitePress](https://vitepress.dev)-ready Markdown from your source files' JSDoc comments, using [TypeDoc](https://typedoc.org). It is an [unplugin](https://github.com/unjs/unplugin) supporting **Vite** and **Rolldown** (`vp pack` / tsdown).

```sh
npm install --save-dev @mrmt/unplugin-typedoc
```

`Lib()` from [`@mrmt/vite`](../../vite/docs/lib.md) already includes it. In a monorepo where each package keeps its docs next to its code, point `out` at the package's `docs/api` folder: that is what this repository does for every package.

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

Generated Markdown files land in `docs/reference/api/` by default (override with the `out` TypeDoc option). By default the plugin writes a `.gitignore` containing `*` inside that directory so the generated files are excluded from git automatically — no manual `.gitignore` entry needed.

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
