import { describe, expect, test, vi } from "vitest";

import { build } from "vite";
import dts, { type PluginOptions } from "../dts";
import { DocsTypedoc } from ".";

describe("typedoc", () => {
  test("retrieve dts options", async () => {
    const options: PluginOptions = { tsconfigPath: "./path/to/tsconfig.json" };
    const endTest = new Error("end test here");
    const optionsHook = vi.fn<
      NonNullable<NonNullable<Parameters<typeof DocsTypedoc>[0]>["options"]>
    >((opts) => {
      expect(opts.tsconfig).toBe(options.tsconfigPath);
      throw endTest;
    });
    await expect(
      build({
        // make sure not to have side effects
        root: "/tmp",
        plugins: [dts(options), DocsTypedoc({ options: optionsHook })],
        build: {
          lib: {
            //  add entry else the plugin is inactive
            entry: "src/index.ts",
            formats: ["es"],
          },
        },
      }),
    ).rejects.toThrow(endTest);

    expect(optionsHook).toHaveBeenCalled();
  });
});
