# Build, lint, format and test

Run the full quality pipeline for marmotte.

## Commands

```sh
# Build the library
npm run build

# Run tests
npm run test

# Lint (oxlint)
npm run lint

# Format check (oxfmt)
npm run fmt:check
```

## What each step does

- **build** — Vite compiles `src/` to `dist/` in ESM format. `vite-plugin-dts` emits `.d.ts` files and **fails the build on any type error**.
- **test** — Vitest runs all `*.test.ts` files except those under `tests/project-templates/`.
- **lint** — oxlint checks code quality rules.
- **fmt:check** — oxfmt verifies formatting without modifying files. Use `npm run fmt` to auto-fix.

## Fix cycle

If the build fails with type errors, fix them before anything else — the DTS plugin is configured to throw on diagnostics.

If tests fail, check `tests/` for the relevant test file and read the error. Use `withTmpDir()` from `marmotte/vitest` for filesystem-heavy tests.
