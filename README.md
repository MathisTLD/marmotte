# marmotte

An extensible development toolkit for TypeScript projects — composable Vite plugins for library bundling, Vue/Vuetify UI, VitePress docs, TypeDoc API generation, and Vitest utilities.

**[Documentation →](https://marmotte.mtld.net/)**

## Packages

| Package          | Purpose                                                      |
| ---------------- | ------------------------------------------------------------ |
| `@mrmt/vite`     | `Lib`, `Docs`, `TypeDocPlugin`, `SidebarPlugin` Vite plugins |
| `@mrmt/vite-ui`  | `UILib` / `UIApp` (Vue + Vuetify)                            |
| `@mrmt/vitest`   | `withTmpDir` / `createTmpDir` test helpers                   |
| `@mrmt/tsconfig` | shared tsconfig bases                                        |
| `marmotte`       | CLI (`marmotte create` / `setup`) and MCP server             |

```sh
npm install -D @mrmt/vite vite typescript   # library + docs plugins
npm install -D @mrmt/vite-ui                # Vue + Vuetify
npm install -D @mrmt/vitest vitest          # test helpers
npm install -D vitepress                    # for Docs, SidebarPlugin
```

## Plugins

### `Lib` — TypeScript library build

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { Lib } from "@mrmt/vite/lib";

export default defineConfig({ plugins: Lib() });
```

Wires up `vite-plugin-dts`, `rollup-plugin-node-externals`, and `Docs` in one call.
Output is ESM-only with sourcemaps and `preserveModules` so every source file stays a separate output file.
Entry points default to `src/index.ts`; pass an `entries` filter to expose multiple files:

```ts
Lib({ entries: /(?<!\.test)\.ts$/ });
```

Pass `docs: false` to skip the VitePress integration.

---

### `UILib` / `UIApp` — Vue + Vuetify

```ts
import { UILib, UIApp } from "@mrmt/vite-ui";

// component library
export default defineConfig({ plugins: UILib() });

// application
export default defineConfig({ plugins: UIApp() });
```

Both include `@vitejs/plugin-vue`, `unplugin-vue-components`, and `vite-plugin-vuetify`.
`UIApp` adds `vue-router/vite` for file-based routing.
Pass `vuetify: false` or `vueRouter: false` to opt out of individual plugins.

---

### `Docs` — VitePress integration

Included automatically by `Lib`. On build it runs `vitepress build docs/`; in dev mode it mounts the VitePress dev server at `/docs/` alongside your Vite server.

On first run it scaffolds `docs/index.md` and `docs/.vitepress/config.ts` as editable defaults.

---

### `TypeDocPlugin` — API reference

```ts
// vite.config.ts
import TypeDoc from "@mrmt/unplugin-typedoc";

export default defineConfig({
  plugins: [TypeDoc()],
});
```

Generates a TypeDoc API reference into `docs/reference/api/` on every build, watches + rebuilds in dev mode and build watch mode.
Automatically writes a `.gitignore` inside the output directory so generated files are excluded from git (pass `gitignore: false` to opt out).

---

### `SidebarPlugin` — auto-generated VitePress sidebar

```ts
// docs/.vitepress/config.ts
import Sidebar from "@mrmt/vitepress-plugin-sidebar";

export default defineConfig({
  vite: {
    plugins: [Sidebar({ documentRootPath: "docs", collapsed: true })],
  },
});
```

Builds the sidebar automatically from the docs directory tree.
Also re-exports everything from [`vitepress-sidebar`](https://vitepress-sidebar.cdget.com/).

---

### `PackageMeta` — package name and version at runtime

Included automatically by `Lib`. Injects `VITE_PACKAGE_NAME` and `VITE_PACKAGE_VERSION` at build time.

```ts
import { resolvePackageMeta } from "@mrmt/utils/package-meta";

const { name, version } = resolvePackageMeta();
```

---

### Vitest helpers

```ts
import { withTmpDir, createTmpDir } from "@mrmt/vitest";

// auto-created before the suite, deleted after
const tmp = withTmpDir();

it("writes a file", () => {
  writeFileSync(tmp.path + "/out.txt", "hello");
});
```

## License

ISC
