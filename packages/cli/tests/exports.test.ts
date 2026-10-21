import { describe, expect, test } from "vitest";
import { resolve } from "node:path";

const distDir = resolve(import.meta.dirname, "../../vitest/dist");

describe("Exports", () => {
  // the `test` task depends on the build of @mrmt/vitest
  test.for([
    ["@mrmt/vitest", "index.js"],
    ["@mrmt/vitest/tmpdir", "tmpdir.js"],
  ])("%s -> %s", ([modulePath, expected]) => {
    expect(import.meta.resolve(modulePath)).toEqual("file://" + resolve(distDir, expected));
  });
});
