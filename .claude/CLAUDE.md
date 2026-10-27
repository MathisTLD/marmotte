# Marmotte: AI assistant guide

Marmotte is an extensible development toolkit for TypeScript projects: Vite plugins (library bundling, Vue/Vuetify UI, VitePress docs, TypeDoc API), Vitest helpers, shared tsconfigs and a CLI + MCP server. It is a **pnpm-workspace monorepo** on the **Vite+** toolchain (`vp`), and the home of the author's day-to-day tooling (AI tools, documented setups).

## Where things are documented

The contributor documentation lives in the docs, not here. Read these before changing things:

- [docs/dev/index.md](../docs/dev/index.md): commands and the rules that bite
- [docs/dev/architecture.md](../docs/dev/architecture.md): layout, package graph, exports, code patterns
- [docs/dev/build-system.md](../docs/dev/build-system.md): Vite+ tasks, the opt-in API reference, private/inlined packages, releases
- [docs/dev/recipes.md](../docs/dev/recipes.md): add an entry point, a package, a plugin
- [docs/dev/testing.md](../docs/dev/testing.md): unit and scaffold integration tests
- [docs/dev/documentation.md](../docs/dev/documentation.md): how docs are organised and linked

Each package also keeps its own docs next to its code: `packages/<pkg>/docs/` (handwritten pages; `@mrmt/vite` and `@mrmt/vite-ui` also get a generated, gitignored `api/` reference from their build). Follow relative links between the `.md` files; they work without the built site.

## Essentials

- Run everything from the repo root with `vp` (global, or `node_modules/.bin/vp`). Not `npx vp`, not `npm run`: npm refuses to run in this pnpm project.
- Verify with `vp run build`, `vp run test`, `vp check`, and `vp exec tsc --noEmit -p packages/<name>/tsconfig.json` (`vp check` does not type-check).
- Never `npm pack` / `npm publish`: use `vp pm pack` / pnpm so `workspace:^` is rewritten.
- A package importing another workspace package (or extending `@mrmt/tsconfig`) must declare it as `workspace:^`.
- `@mrmt/utils` is private and inlined into the packages that use it (devDependency): never publish it, and see [build-system.md](../docs/dev/build-system.md#private-packages-are-inlined) for the rules.
- Changed a package's public API or behaviour? Update its `docs/` in the same change.
