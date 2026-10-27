---
title: Testing
---

# Testing

Unit tests live next to their source (`*.test.ts`) and run with `vp test run` through each package's `test` task, which builds the package and its workspace dependencies first.

Use `withTmpDir()` from `@mrmt/vitest` in hooks:

```ts
import { withTmpDir } from "@mrmt/vitest";
const { dir } = withTmpDir();
```

## Template tests

`packages/cli/src/template/template.test.ts` tests the scaffolding blocks without installing anything. `testBlock` and `testIntake` from `bingo-stratum-testers` run one block in memory; the other tests run a full `setup`, then a `transition` after hand edits, on a temporary directory. Start here when you change a block, and keep the scaffold integration tests below for "does the generated project build".

## Scaffold integration tests

`packages/cli/tests/` scaffolds real projects from the built-in templates and builds them:

1. `vp pm pack` packs every publishable workspace package (not the private root, not `@mrmt/utils`). Unpublished `@mrmt/*` dependencies cannot come from the registry.
2. All the tarballs are installed **together** in each generated project.
3. The project is built and its output checked.

They run seven real `npm install`s in parallel, so they are slow and network-bound: the per-test timeout is 180 s. A slow registry or a loaded machine makes them flaky; rerun before suspecting your change.

`packages/cli/tests/test-project.sh <template>` does the same for one template by hand, and `clean-rebuild.sh` runs the whole pipeline from a clean checkout.

## Type tests

`*.test-d.ts` files hold type-level tests. They are checked by `tsc`, not run.
