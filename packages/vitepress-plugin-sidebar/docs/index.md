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

To get this config scaffolded for you, use [`Docs({ workspace: true })`](../../vite/docs/docs.md#monorepo-mode) from `@mrmt/vite`.

Options: `root`, `shell` (site shell folder, default `docs`), `docsDir` (default `docs`), `order` (package directories listed first), `navText`, `exclude` (extra `srcExclude` globs) and `restart` (see below). The result is meant to be spread: if you set `themeConfig`, `markdown` or `rewrites` yourself, merge them by hand.

Inside a package's sidebar, handwritten pages come first (sorted by the optional `order` front matter), then the generated `api/` folder, and a package's own `index.md` is listed as its landing page.

## Dev server

The sidebar is computed when the VitePress config is evaluated, so in `vitepress dev` it would go stale when you add or remove pages or retitle one. Both `workspaceDocs()` and the `Sidebar()` plugin therefore restart VitePress for you, **debounced** (500 ms by default), when:

- a page is added or removed in the docs folders;
- an edit changes what the sidebar shows: the front matter `title` or `order`, or the first `#` heading.

Edits to the body of a page don't restart anything (normal hot reload). Disable it with `restart: false`, or tune it with `restart: { debounce: 1000 }`: in `workspaceDocs({ restart })`, or as the second argument of `Sidebar(options, restart)`.

Restarting works by touching the VitePress config file, which VitePress already watches. Regenerating a package's `docs/api` (a build in watch mode) adds and removes many pages at once, which the debounce turns into a single restart.

See also [how this repository organises its docs](../../../docs/dev/documentation/index.md).
