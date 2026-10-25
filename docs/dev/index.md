---
title: Contributing
---

# Contributing

This section is for people **and AI agents** working on marmotte itself. Using marmotte in your own project? See the [guides](../guide/index.md) instead.

Marmotte is an extensible development toolkit for TypeScript projects, organised as a **pnpm-workspace monorepo** driven by the Vite+ toolchain (`vp`). It is also the home of the author's day-to-day tooling (AI tools, setups documented on this site).

## Start here

| Page                                  | Read it when you…                                                     |
| ------------------------------------- | --------------------------------------------------------------------- |
| [Architecture](./architecture.md)     | need the repo layout, package graph, public exports and code patterns |
| [Build system](./build-system.md)     | touch builds, tasks, dependencies or releases                         |
| [Recipes](./recipes.md)               | add an entry point, a package or a plugin                             |
| [Testing](./testing.md)               | write or debug tests (incl. the scaffold integration tests)           |
| [Documentation](./documentation.md)   | write docs: where they live, how they are linked and built            |
| [Open questions](./open-questions.md) | want to know what is still undecided, and what we found so far        |

## Everyday commands

Run them from the repository root with `vp` (installed globally, or `node_modules/.bin/vp`). Don't use `npx vp` or `npm run`: npm refuses to run in this pnpm project.

| Command              | What it does                                                                        |
| -------------------- | ----------------------------------------------------------------------------------- |
| `vp install`         | install dependencies (pnpm is downloaded by `vp`)                                   |
| `vp run build`       | build every package in dependency order (cached); generates each package's API docs |
| `vp run test`        | unit tests + the CLI scaffold integration tests (slow, needs network)               |
| `vp check`           | format (oxfmt) + lint (oxlint); `vp check --fix` fixes. Does **not** type-check     |
| `vp run <pkg>#build` | one package, e.g. `@mrmt/vite#build`, `marmotte#test`                               |
| `vp run docs`        | VitePress dev server                                                                |
| `vp run build:docs`  | build the packages then the documentation site                                      |

Type-check a package, tests included, with `vp exec tsc --noEmit -p packages/<name>/tsconfig.json` (and `-p tsconfig.json` at the root for the `vite.config.ts` files and `tooling/`).

## Rules that bite

- Use `vp` / `pnpm`. Never `npm pack` or `npm publish`: they would ship the literal `workspace:^` ranges.
- A package that imports another workspace package, or extends `@mrmt/tsconfig`, must declare it (`"@mrmt/x": "workspace:^"`). pnpm's `node_modules` is strict.
- `@mrmt/utils` is private and inlined into the packages that use it. See [Build system](./build-system.md#private-packages-are-inlined).
- When you change a package's public API or behaviour, update its docs in the same change ([Documentation](./documentation.md)).
