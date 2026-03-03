import { resolveConfig } from "vite";
import { assert, describe, expect, test } from "vitest";
import { Lib } from "./lib";
import { resolve } from "path";

const ROOT = resolve(import.meta.dirname, "..", "..");

describe("Lib Plugin", () => {
  test("Default entry point detection", async () => {
    const config = await resolveConfig(
      { plugins: [Lib({ docs: false })], configFile: false },
      "build",
    );
    const { lib } = config.build;
    assert(lib);
    expect(lib.entry).toEqual({ index: resolve(ROOT, "src/index.ts") });
  });

  test("RegExp entry point detection", async () => {
    const config = await resolveConfig(
      {
        plugins: [Lib({ docs: false, entries: /utils\/codegen\/.+(?<!\.test)\.ts$/ })],
        configFile: false,
      },
      "build",
    );
    const { lib } = config.build;
    assert(lib);
    expect(lib.entry).toEqual({
      "utils/codegen/context": resolve(ROOT, "src/utils/codegen/context.ts"),
      "utils/codegen/format": resolve(ROOT, "src/utils/codegen/format.ts"),
      "utils/codegen/header": resolve(ROOT, "src/utils/codegen/header.ts"),
      "utils/codegen/index": resolve(ROOT, "src/utils/codegen/index.ts"),
    });
  });
});
