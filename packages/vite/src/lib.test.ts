import { resolveConfig } from "vite";
import { assert, describe, expect, test } from "vitest";
import { Lib } from "./lib";
import { resolve } from "path";

const ROOT = resolve(import.meta.dirname, "..");

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
        plugins: [Lib({ docs: false, entries: /docs\/.+(?<!\.test)\.ts$/ })],
        configFile: false,
      },
      "build",
    );
    const { lib } = config.build;
    assert(lib);
    expect(lib.entry).toEqual({
      "docs/codegen": resolve(ROOT, "src/docs/codegen.ts"),
      "docs/context": resolve(ROOT, "src/docs/context.ts"),
      "docs/index": resolve(ROOT, "src/docs/index.ts"),
    });
  });

  test("Default sourcemap is hidden", async () => {
    const config = await resolveConfig(
      { plugins: [Lib({ docs: false })], configFile: false },
      "build",
    );
    expect(config.build.sourcemap).toBe("hidden");
  });

  test("sourcemap can be overridden", async () => {
    const config = await resolveConfig(
      { build: { sourcemap: true }, plugins: [Lib({ docs: false })], configFile: false },
      "build",
    );
    expect(config.build.sourcemap).toBe(true);
  });
});
