import { mkdtempSync } from "fs";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { beforeAll, afterAll } from "vitest";

/** Synchronously creates a unique temporary directory and returns its absolute path. */
export function createTmpDirSync() {
  return mkdtempSync(tmpdir());
}

/** Asynchronously creates a unique temporary directory and returns its absolute path. */
export function createTmpDir() {
  return mkdtemp(tmpdir());
}

/**
 * Sets up beforeAll and afterAll hooks to create a tmp dir
 *
 * the dir will be deleted at the end of test context (see https://vitest.dev/api/#afterall)
 * @returns a reference to the dir. **IT MUST ONLY BE ACCESSED INSIDE TESTS**
 */
export function withTmpDir() {
  let tmpDir: string | undefined = undefined;
  beforeAll(async () => {
    tmpDir = await createTmpDir();
  });
  afterAll(async () => {
    await rm(tmpDir!, { recursive: true });
  });
  return {
    get path() {
      if (!tmpDir) throw new Error("path is not accessible yet");
      return tmpDir;
    },
  };
}
