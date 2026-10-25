---
title: Sidebar and monorepo docs
---

# Sidebar and monorepo docs

`@mrmt/vitepress-plugin-sidebar` builds a [VitePress](https://vitepress.dev) sidebar automatically from the docs directory tree (it wraps [`vitepress-sidebar`](https://vitepress-sidebar.cdget.com/), whose exports it re-exports). A second entry, `workspaceDocs`, assembles one site from the docs of every package in a monorepo.

```sh
npm install --save-dev @mrmt/vitepress-plugin-sidebar
```

## Sidebar for a single site

The default config uses `generateSidebar` from `vitepress-sidebar` to build the sidebar automatically from the docs directory tree. No manual sidebar config needed.

```ts
import { generateSidebar } from "@mrmt/vitepress-plugin-sidebar";

const sidebar = generateSidebar({
  documentRootPath: "docs",
  collapsed: true,
  useFolderTitleFromIndexFile: true,
  useTitleFromFrontmatter: true,
});
```

The default export is a Vite plugin doing the same at config time, which is what the scaffolded `docs/.vitepress/config.ts` uses:

```ts
import Sidebar from "@mrmt/vitepress-plugin-sidebar";

export default defineConfig({ vite: { plugins: [Sidebar()] } });
```

Import the CSS for indented groups in your theme: `import "@mrmt/vitepress-plugin-sidebar/indent.css"`.

## Monorepos: docs next to code

`workspaceDocs()` (from `@mrmt/vitepress-plugin-sidebar/workspace`) returns the VitePress config pieces for a monorepo whose packages keep their docs in `packages/<pkg>/docs/`:

```ts
// docs/.vitepress/config.ts
import { defineConfig } from "vitepress";
import { workspaceDocs } from "@mrmt/vitepress-plugin-sidebar/workspace";

export default async () => {
  const workspace = await workspaceDocs({ order: ["core", "cli"] });
  return defineConfig({
    title: "my monorepo",
    ...workspace,
    themeConfig: { ...workspace.themeConfig /* your own options */ },
  });
};
```

- Packages are discovered from the workspace definition (npm and pnpm workspaces, through [`@manypkg/get-packages`](https://github.com/Thinkmanager/manypkg)). Every package with markdown in its `docs/` folder is served at `/<package directory name>/`, and the shell folder (`docs/` by default) at `/`.
- Pages are **read in place**: nothing is copied, so the files stay where agents and contributors look for them.
- **Relative `.md` links work on disk and on the site**, including across packages (`../../vite/docs/lib.md`): they are resolved from the real source file and mapped to site URLs.
- It adds a **Packages** nav dropdown and one sidebar per package, and generates the `srcExclude` that keeps READMEs, changelogs and sources out of the site.

Options: `root`, `shell` (site shell folder, default `docs`), `docsDir` (default `docs`), `order` (package directories listed first), `navText` and `exclude` (extra `srcExclude` globs). The result is meant to be spread: if you set `themeConfig`, `markdown` or `rewrites` yourself, merge them by hand.

Pages added or removed while the dev server runs need a restart. See also [how this repository organises its docs](../../../docs/dev/documentation.md).
