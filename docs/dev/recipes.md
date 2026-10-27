---
title: Recipes
---

# Recipes

## Add an entry point to a package

1. Create the source file in `packages/<pkg>/src/`.
2. Add it to `pack.entry` in `packages/<pkg>/vite.config.ts`.
3. Add the matching `exports` key in `packages/<pkg>/package.json`.
4. `vp run @mrmt/<pkg>#build`, and check that the `dist/` path matches the export.

## Add a package

1. Create `packages/<name>/` with:
   - `package.json`: `name`, a `version` equal to the other packages, `type: "module"`, `workspace:^` for `@mrmt/*` dependencies (including a devDependency on `@mrmt/tsconfig`), `files: ["dist", "!dist/**/*.map"]`, explicit `exports`, and `publishConfig.access: "public"` for scoped names;
   - `tsconfig.json` extending `@mrmt/tsconfig/tsconfig.node-lib.json`;
   - `vite.config.ts` using `packageConfig`.
2. `packages/*` in `pnpm-workspace.yaml` picks it up. If the site should depend on its build, add `<name>#build` to `docsDependencies` in the root `vite.config.ts`.
3. Give it a `docs/` folder if it has anything to document ([Documentation](./documentation.md)). Only add a generated API reference if people will look its types up ([Build system](./build-system.md#api-reference)).
4. `vp install`, then `vp run build`.

## Add a Vite plugin

1. Create `packages/vite/src/<name>.ts` exporting `function MyPlugin(options): Plugin | Plugin[]`. Plugins that need Vue or Vuetify go in `@mrmt/vite-ui`.
2. Use `DefaultVitePluginContext` for path resolution if needed.
3. Add the entry and the `exports` key (see above).
4. Write `packages/vite/src/<name>.test.ts`.
5. Document it in `packages/vite/docs/`.
