---
title: Building a Library
---

# Building a TypeScript Library

The [`Lib`](/reference/api/vite/lib#lib) plugin configures Vite to build an ESM TypeScript library with sensible defaults.

## Basic setup

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { Lib } from "marmotte/vite/lib";

export default defineConfig({
  plugins: Lib(),
});
```

This single call wires up:

- **ESM-only output** (`formats: ["es"]`) with hidden source maps and no minification.
- **Preserved modules** — the output mirrors your source tree, which is ideal for tree-shaking by consumers.
- **TypeScript declarations** (`.d.ts` + `.d.ts.map`) via `vite-plugin-dts`. The build **fails** on type errors.
- **Node externals** — everything in `dependencies` and `peerDependencies` is excluded from the bundle.
- **VitePress docs** embedded in the dev server (see [Documentation](./docs)).
- **`@` alias** pointing to your `src/` directory.
- **`VITE_PACKAGE_NAME` / `VITE_PACKAGE_VERSION`** env vars injected from `package.json`.

## Entry points

By default, `src/index.ts` is the single entry point. Use the `entries` option to expose multiple modules:

```ts
Lib({
  // include every .ts file that isn't a declaration, test, or test-type file
  entries: /(?<!\.d)(?<!\.test)(?<!\.test-d)\.ts$/,
});
```

`entries` accepts a `RegExp` or a `(absolutePath: string) => boolean` predicate. Files are discovered by recursively walking `src/`. Entry names in the Rollup output map match the relative path without extension.

You can also define entries manually in `vite.config.ts` (`build.lib.entry`) alongside or instead of the `entries` filter.

## Options

```ts
Lib({
  // Entry filter (see above)
  entries: /\.ts$/,

  // Pass-through to vite-plugin-dts (deep-merged with defaults)
  dts: {
    tsconfigPath: "./tsconfig.lib.json",
  },

  // Pass-through to rollup-plugin-node-externals
  externals: {
    devDeps: false, // don't externalise devDependencies
  },

  // Disable the embedded docs server
  docs: false,
});
```

### Skipping `dts` defaults

`dts` options are **deep-merged** with marmotte's defaults (e.g. `exclude` patterns for test files are concatenated rather than replaced). Pass `noDefaults: true` to bypass this and use your options as-is:

```ts
Lib({
  dts: {
    noDefaults: true,
    exclude: ["**/my-own-excludes/**"],
  },
});
```

See the [API reference](/reference/api/vite/lib) for the full option types.

## Source maps

`Lib` produces **hidden** source maps by default (`sourcemap: "hidden"`). Hidden maps are written as `.js.map` files alongside the output but are **not** referenced by a `//# sourceMappingURL` comment in the JS. This keeps the maps available for local debugging tools without embedding a pointer that consumers would download unnecessarily.

> [!WARNING]
> Hidden source maps should be **excluded from your npm publish**. Add them to `.npmignore` or limit `files` in `package.json`:
>
> ```json
> { "files": ["dist/**/*.js", "dist/**/*.d.ts"] }
> ```

Override the default by setting `build.sourcemap` in your Vite config:

```ts
export default defineConfig({
  build: { sourcemap: true },
  plugins: Lib(),
});
```

> [!CAUTION]
> `sourcemap: true` embeds a `//# sourceMappingURL` comment in every output file. If the referenced `.map` file is missing in the consumer's `node_modules` (e.g. excluded from the publish), Vite will emit a `Failed to load source map for ...` warning for every file it processes. Prefer `"hidden"` (the default) or ensure the maps are included in your published package.

## Low-level: `LibConfig`

[`LibConfig`](/reference/api/vite/lib#libconfig) is the inner plugin that only handles entry resolution and build settings. Use it if you want to compose your own plugin stack without the DTS generator, externals, or docs:

```ts
import { LibConfig } from "marmotte/vite/lib";

export default defineConfig({
  plugins: [
    LibConfig({ entries: /\.ts$/ }),
    // add your own plugins
  ],
});
```

## Typical `package.json`

For a library built with `Lib()` the exports map should look like:

```json
{
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

For multi-entry builds produced by the `entries` filter:

```json
{
  "exports": {
    "./*": {
      "types": "./dist/*.d.ts",
      "import": "./dist/*.js"
    }
  }
}
```
