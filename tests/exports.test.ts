import { beforeAll, describe, expect, test } from "vitest";
import { build } from "vite";
import { dirname, resolve } from "node:path";

const rootDir = dirname(import.meta.dirname);
const distDir = resolve(rootDir, "dist");

describe("Exports", () => {
  beforeAll(async () => {
    // ensure we have a fresh build of this package that will be installed by scaffolded projects
    await build({ root: rootDir });
  });

  test.for([
    ["marmotte/vitest", "vitest/index.js"],
    ["marmotte/vitest/tmpdir", "vitest/tmpdir.js"],
  ])("%s -> %s", async ([modulePath, expected]) => {
    expect(import.meta.resolve(modulePath)).toEqual("file://" + resolve(distDir, expected));
  });
});
