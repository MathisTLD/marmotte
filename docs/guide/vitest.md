---
title: Testing Utilities
---

# Testing Utilities

Marmotte ships lightweight Vitest helpers for tests that need to work with the filesystem.

```ts
import { withTmpDir, createTmpDir, createTmpDirSync } from "marmotte/vitest"
```

See the [API reference](/reference/api/vitest/tmpdir) for full details.

## `withTmpDir` — auto-managed temporary directory

The most common helper. Call it at the top level of a `describe` block to get a reference to a temporary directory that is created before the suite runs and deleted after it finishes.

```ts
import { describe, it, expect } from "vitest"
import { withTmpDir } from "marmotte/vitest"
import { writeFile, readFile } from "fs/promises"
import { join } from "path"

describe("my file-writing logic", () => {
  const tmp = withTmpDir()

  it("writes and reads a file", async () => {
    const file = join(tmp.path, "hello.txt")
    await writeFile(file, "hello")
    expect(await readFile(file, "utf8")).toBe("hello")
  })
})
```

`withTmpDir` registers `beforeAll` / `afterAll` hooks in the current Vitest context. The `path` getter throws if accessed outside of a test (i.e. before `beforeAll` has run).

> **Note:** Access `tmp.path` only inside `it` / `test` blocks, never at the `describe` level.

## `createTmpDir` and `createTmpDirSync`

Use these when you need a temporary directory outside of a Vitest hook context, or when you want to manage the lifecycle yourself.

```ts
import { createTmpDir, createTmpDirSync } from "marmotte/vitest"
import { rm } from "fs/promises"

// Async version
const dir = await createTmpDir()
// … use dir …
await rm(dir, { recursive: true })

// Sync version
const dir2 = createTmpDirSync()
// … use dir2 …
```

Both delegate to Node's `fs.mkdtemp` / `fs.mkdtempSync` using the OS temp directory as the base.
