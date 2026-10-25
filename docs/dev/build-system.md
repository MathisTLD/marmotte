---
title: Build system
---

# Build system

The toolchain is Vite+ (`vite-plus`) on pnpm: `vp pack` (tsdown/rolldown) builds, `vp test` (Vitest) tests, `vp check`/`lint`/`fmt` (oxlint/oxfmt) checks, `vp run` runs cached tasks, and `vp staged` with `.vite-hooks` replaces husky and lint-staged. pnpm is pinned through `devEngines` and downloaded by `vp`.

## Per-package build

Each buildable package has a `vite.config.ts` calling `packageConfig(import.meta.dirname, { pack: { entry: {...} }, test: true })` from `tooling/pack.ts`. It returns:

- the `pack` block: ESM only, **bundled per entry** (so code inlined from private packages is tree-shaken), `.js` / `.d.ts` output, hidden sourcemaps (excluded from tarballs);
- the `build` and `test` tasks.

`build` and `test` are tasks in the config, not `package.json` scripts (a task cannot be defined in both).

## Task ordering

Workspace dependencies use the `workspace:^` protocol; that is what lets `vp run -r` and `--filter '<pkg>...'` order builds. `build` and `test` first build the package's `dependencies` **and** `devDependencies`.

A package that imports another workspace package (or extends `@mrmt/tsconfig`) must declare it. pnpm's `node_modules` is strict: nothing is hoisted by accident.

## API docs are generated during build

The TypeDoc plugin (`@mrmt/unplugin-typedoc`, Rolldown flavour) is set up in `packageConfig` and writes each package's API reference into `packages/<pkg>/docs/api/` (gitignored) as part of `vp pack`.

- `@mrmt/utils` and `@mrmt/unplugin-typedoc` opt out with `api: false`: the plugin depends on `utils`, so documenting them with it would make the build graph cyclic.
- Every other package lists `@mrmt/unplugin-typedoc` as a `workspace:^` devDependency so `vp` builds it first.
- The plugin is imported lazily (`lazyTypeDoc` in `tooling/pack.ts`) because configs are evaluated to build the task graph, before anything is built.
- `docs/**` is excluded from the build task's cache inputs: TypeDoc cleans and rewrites it.

See [Documentation](./documentation.md) for how the site reads these files.

## Private packages are inlined

`@mrmt/utils` is `private`: consumers list it under **devDependencies** and tsdown bundles (and tree-shakes) what they import, types included.

- A private package's own runtime dependencies must be declared by every consumer that inlines it (`@mrmt/vite` lists `zod` for the inlined `package-json` schema).
- Modules with global state (the comment-type registry in `codegen`) must be inlined by **one** package only, otherwise each package gets its own copy. Today only `@mrmt/vite` uses `codegen`; if another package needs it, re-export it from `@mrmt/vite` (`@mrmt/vite/codegen` does this for the public part).
- Don't import `@mrmt/utils` in files that run outside a build of the consumer: it is not installed for end users.

## Packing and releasing

- `pnpm pack`, `vp pm pack` and `vp pm publish` rewrite `workspace:^` to real ranges (`^0.6.1`) in the tarballs. Never use `npm pack` / `npm publish`.
- Releases use changesets with a fixed (lockstep) group: `vp run version` then `vp run release`. Untested end to end: check that `changeset publish` finds pnpm before the first real release.
- Scaffold tests pack every publishable package (not the private root or `@mrmt/utils`) and install all the tarballs together: see [Testing](./testing.md).

## Type-checking

`dts: true` generates declarations, but `vp check` does not type-check. Use `vp exec tsc --noEmit -p packages/<name>/tsconfig.json`, and `-p tsconfig.json` at the root (it covers every package's `vite.config.ts` and `tooling/`). Cross-package types come from built output, so build first.

## Known issues

- **`qsu` pin in `@mrmt/vitepress-plugin-sidebar`.** `qsu@1.100.0` (2026-10-23) renamed `capitalizeEachWords` to `capitalizeEachWord` in a minor release, which breaks `vitepress-sidebar@1.40.0` (it still allows `qsu ^1.18.0`). The package therefore depends on `qsu ~1.21.0` directly: npm reuses that copy for `vitepress-sidebar`, which keeps fresh installs (and the scaffold tests) working. pnpm consumers still resolve the newest `qsu` for `vitepress-sidebar` and need `overrides: { qsu: "~1.21.0" }` until upstream is fixed. Remove the pin once a `vitepress-sidebar` release supports the new `qsu`.
